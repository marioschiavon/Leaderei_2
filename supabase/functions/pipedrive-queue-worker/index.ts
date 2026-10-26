import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  STAGE_RANK,
  buildActivityDrafts,
  buildEntityFields,
  buildSummaryNote,
  type SyncMessage,
  configIsReady,
  createPipedriveClient,
  shouldAdvance,
  stageForEvent,
  type PipedriveClient,
  type PipedriveConfig,
} from "../_shared/pipedrive.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const MAX_JOBS = 20;
const MAX_ATTEMPTS = 5;
const BACKOFF_MIN = [1, 5, 25, 60, 120];

const json = (p: unknown, s = 200) =>
  new Response(JSON.stringify(p), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const isEmpty = (v: unknown) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && (v.length === 0 || (v.length === 1 && !v[0]?.value)));

async function findOrCreatePerson(
  pd: PipedriveClient,
  lead: Record<string, any>,
  extra: Record<string, unknown>,
  orgId: number | null,
  ownerId: number | null,
): Promise<number | null> {
  const email = String(lead.email ?? "").trim();
  const phone = String(lead.whatsapp ?? lead.phone ?? "").trim();
  let id: number | null = lead.pipedrive_id ? Number(lead.pipedrive_id) : null;

  if (id) {
    try { await pd.get(`/persons/${id}`); } catch { id = null; }
  }
  for (const [term, field] of [[email, "email"], [phone, "phone"]] as const) {
    if (id || !term) continue;
    const res = await pd.get<any>("/persons/search", { term, fields: field, exact_match: "true", limit: 1 });
    const hit = res?.items?.[0]?.item;
    if (hit?.id) id = Number(hit.id);
  }

  if (id) {
    // Nunca sobrescreve: só preenche o que está vazio no Pipedrive.
    const codes = Object.keys(extra);
    if (codes.length || orgId) {
      const current = await pd.get<any>(`/persons/${id}`);
      const patch: Record<string, unknown> = {};
      for (const c of codes) if (isEmpty(current?.[c])) patch[c] = extra[c];
      if (orgId && isEmpty(current?.org_id)) patch.org_id = orgId;
      if (Object.keys(patch).length) await pd.put(`/persons/${id}`, patch);
    }
    return id;
  }

  const body: Record<string, unknown> = { ...extra };
  if (!body.name) body.name = String(lead.name ?? "").trim() || email || phone || "Lead";
  if (email && !body.email) body.email = [{ value: email, primary: true }];
  if (phone && !body.phone) body.phone = [{ value: phone, primary: true }];
  if (orgId) body.org_id = orgId;
  if (ownerId) body.owner_id = ownerId;
  const created = await pd.post<any>("/persons", body);
  return created?.id ? Number(created.id) : null;
}

async function findOrCreateOrg(pd: PipedriveClient, name: string, ownerId: number | null): Promise<number | null> {
  const term = name.trim();
  if (!term) return null;
  const res = await pd.get<any>("/organizations/search", { term, fields: "name", exact_match: "true", limit: 1 });
  const hit = res?.items?.[0]?.item;
  if (hit?.id) return Number(hit.id);
  const body: Record<string, unknown> = { name: term };
  if (ownerId) body.owner_id = ownerId;
  const created = await pd.post<any>("/organizations", body);
  return created?.id ? Number(created.id) : null;
}

async function conversationSummary(supabase: ReturnType<typeof createClient>, leadId: string): Promise<string> {
  const { data: convs } = await supabase.from("conversations").select("id, summary")
    .eq("lead_id", leadId).order("created_at", { ascending: false }).limit(1);
  const conv = convs?.[0] as any;
  if (!conv) return "";
  if (conv.summary) return String(conv.summary);
  const { data: msgs } = await supabase.from("messages").select("direction, content, sent_at")
    .eq("conversation_id", conv.id).order("sent_at", { ascending: false }).limit(12);
  return (msgs ?? []).reverse()
    .map((m: any) => `${m.direction === "inbound" ? "Lead" : "IA"}: ${m.content ?? ""}`)
    .join("\n").slice(0, 4000);
}

const dueParts = (iso: string) => {
  const d = new Date(iso);
  return { due_date: d.toISOString().slice(0, 10), due_time: d.toISOString().slice(11, 16) };
};

/** Registra no negócio as atividades novas, a reunião e (se final) o resumo fixado. */
async function syncHistory(
  supabase: ReturnType<typeof createClient>,
  pd: PipedriveClient,
  deal: Record<string, any>,
  leadId: string,
  ownerId: number | null,
  final: boolean,
) {
  const { data: convs } = await supabase.from("conversations").select("id").eq("lead_id", leadId);
  const ids = (convs ?? []).map((c: any) => c.id);
  const msgs: SyncMessage[] = ids.length
    ? ((await supabase.from("messages").select("direction, channel, content, sent_at")
      .in("conversation_id", ids).order("sent_at", { ascending: true }).limit(1000)).data ?? []) as SyncMessage[]
    : [];
  const since = deal.activities_synced_at ? String(deal.activities_synced_at) : null;
  const fresh = since ? msgs.filter((m) => new Date(m.sent_at) > new Date(since)) : msgs;
  const base: Record<string, unknown> = { deal_id: Number(deal.deal_id) };
  if (deal.person_id) base.person_id = Number(deal.person_id);
  if (ownerId) base.user_id = ownerId;
  const patch: Record<string, unknown> = {};

  for (const a of buildActivityDrafts(fresh)) {
    await pd.post("/activities", { ...base, subject: a.subject, type: a.type, note: a.note, done: 1, ...dueParts(a.due) });
  }
  if (fresh.length) patch.activities_synced_at = fresh[fresh.length - 1].sent_at;

  const { data: bk } = await supabase.from("bookings").select("id, scheduled_at, duration_minutes, title, meeting_url")
    .eq("lead_id", leadId).in("status", ["accepted", "pending", "confirmed"] as any).not("scheduled_at", "is", null)
    .order("created_at", { ascending: false }).limit(1);
  const booking = bk?.[0] as any;
  if (booking && booking.id !== deal.meeting_booking_id) {
    const act = await pd.post<any>("/activities", {
      ...base, type: "meeting", done: 0,
      subject: booking.title || "Reunião agendada pela Leaderei",
      duration: `${String(Math.floor((booking.duration_minutes ?? 30) / 60)).padStart(2, "0")}:${String((booking.duration_minutes ?? 30) % 60).padStart(2, "0")}`,
      note: booking.meeting_url ? `Link: ${booking.meeting_url}` : "",
      ...dueParts(booking.scheduled_at),
    });
    patch.meeting_activity_id = act?.id ? Number(act.id) : null;
    patch.meeting_booking_id = booking.id;
  }

  if (final) {
    const summary = await conversationSummary(supabase, leadId);
    const content = buildSummaryNote({ msgs, summary, leadId, meetingAt: booking?.scheduled_at ?? null });
    let noteId = deal.summary_note_id ? Number(deal.summary_note_id) : null;
    if (noteId) {
      try { await pd.put(`/notes/${noteId}`, { content, pinned_to_deal_flag: 1 }); } catch { noteId = null; }
    }
    if (!noteId) {
      const n = await pd.post<any>("/notes", { deal_id: Number(deal.deal_id), content, pinned_to_deal_flag: 1 });
      patch.summary_note_id = n?.id ? Number(n.id) : null;
    }
  }
  if (Object.keys(patch).length) await supabase.from("pipedrive_deals").update(patch).eq("id", deal.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Backend não configurado" }, 500);
  const supabase = createClient(url, key);

  const { data: jobs, error } = await supabase.from("pipedrive_sync_queue").select("*")
    .in("status", ["pending", "failed"]).lt("attempts", MAX_ATTEMPTS)
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true }).limit(MAX_JOBS);
  if (error) return json({ error: error.message }, 500);

  const results: Array<Record<string, unknown>> = [];
  const cache = new Map<string, { pd: PipedriveClient; cfg: PipedriveConfig } | null>();
  const setJob = (id: string, patch: Record<string, unknown>) =>
    supabase.from("pipedrive_sync_queue").update(patch).eq("id", id);

  for (const job of jobs ?? []) {
    const attempts = (job.attempts ?? 0) + 1;
    try {
      await setJob(job.id, { status: "running", attempts });

      if (!cache.has(job.company_id)) {
        const { data: integ } = await supabase.from("integrations").select("api_token, config, status")
          .eq("company_id", job.company_id).eq("provider", "pipedrive").maybeSingle();
        const cfg = (integ?.config ?? null) as PipedriveConfig | null;
        cache.set(job.company_id, integ && integ.status === "active" && integ.api_token && configIsReady(cfg)
          ? { pd: createPipedriveClient(integ.api_token), cfg: cfg! }
          : null);
      }
      const entry = cache.get(job.company_id);
      if (!entry) {
        await setJob(job.id, { status: "skipped", last_error: "Pipedrive inativo, envio desligado ou sem funil/etapa configurados." });
        results.push({ id: job.id, status: "skipped" });
        continue;
      }
      const { pd, cfg } = entry;
      const ownerId = cfg.owner_id ? Number(cfg.owner_id) : null;

      const { data: lead } = await supabase.from("leads").select("*").eq("id", job.lead_id).maybeSingle();
      if (!lead) {
        await setJob(job.id, { status: "skipped", last_error: "Lead não encontrado." });
        continue;
      }
      const { data: deal } = await supabase.from("pipedrive_deals").select("*")
        .eq("company_id", job.company_id).eq("lead_id", job.lead_id).maybeSingle();

      if (job.event === "create_deal") {
        if (deal) {
          await setJob(job.id, { status: "done", last_error: null });
          continue;
        }
        const { data: prot } = await supabase.rpc("is_lead_protected", { _lead_id: job.lead_id });
        if (prot === true) {
          await setJob(job.id, { status: "skipped", last_error: "Organização protegida (Não prospectar)." });
          continue;
        }
        const row = lead as Record<string, unknown>;
        const orgId = lead.company_name ? await findOrCreateOrg(pd, String(lead.company_name), ownerId) : null;
        const personId = await findOrCreatePerson(pd, lead, buildEntityFields(row, cfg.field_map, "person"), orgId, ownerId);
        const body: Record<string, unknown> = {
          pipeline_id: Number(cfg.pipeline_id),
          stage_id: Number(cfg.stage_created),
          ...buildEntityFields(row, cfg.field_map, "deal"),
        };
        if (!body.title) body.title = `${lead.name ?? "Lead"}${lead.company_name ? ` — ${lead.company_name}` : ""}`;
        if (personId) body.person_id = personId;
        if (orgId) body.org_id = orgId;
        if (ownerId) body.user_id = ownerId;
        const created = await pd.post<any>("/deals", body);
        const { data: newDeal } = await supabase.from("pipedrive_deals").insert({
          company_id: job.company_id, lead_id: job.lead_id, deal_id: Number(created.id),
          person_id: personId, org_id: orgId, current_stage: String(cfg.stage_created),
          stage_rank: STAGE_RANK.create_deal,
        }).select("*").single();
        if (personId && !lead.pipedrive_id) {
          await supabase.from("leads").update({ pipedrive_id: personId }).eq("id", lead.id).is("pipedrive_id", null);
        }
        if (newDeal) await syncHistory(supabase, pd, newDeal, job.lead_id, ownerId, false).catch(() => null);
        await setJob(job.id, { status: "done", last_error: null });
        results.push({ id: job.id, status: "done", deal_id: created.id });
        continue;
      }

      const target = stageForEvent(cfg, job.event);
      if (!target || !(job.event in STAGE_RANK)) {
        await setJob(job.id, { status: "skipped", last_error: "Etapa não configurada para este evento." });
        continue;
      }
      if (!deal) {
        await supabase.from("pipedrive_sync_queue").upsert(
          { company_id: job.company_id, lead_id: job.lead_id, event: "create_deal", status: "pending", attempts: 0, next_attempt_at: new Date().toISOString() },
          { onConflict: "lead_id,event", ignoreDuplicates: true },
        );
        await setJob(job.id, {
          status: "pending", attempts: Math.max(0, attempts - 1), last_error: "Aguardando criação do negócio.",
          next_attempt_at: new Date(Date.now() + 60_000).toISOString(),
        });
        continue;
      }
      if (!shouldAdvance(deal.stage_rank, job.event)) {
        await syncHistory(supabase, pd, deal, job.lead_id, ownerId, job.event !== "stage_replied").catch(() => null);
        await setJob(job.id, { status: "done", last_error: null });
        continue;
      }
      await pd.put(`/deals/${deal.deal_id}`, {
        stage_id: Number(target),
        ...buildEntityFields(lead as Record<string, unknown>, cfg.field_map, "deal"),
      });
      if (job.event === "move_stage") {
        const reason = (job.payload as any)?.reason ?? null;
        await pd.post("/notes", { deal_id: Number(deal.deal_id), content: `Atendimento transferido para humano pela Leaderei.${reason ? `<br>Motivo: ${reason}` : ""}` }).catch(() => null);
      }
      await syncHistory(supabase, pd, deal, job.lead_id, ownerId, job.event !== "stage_replied");
      await supabase.from("pipedrive_deals").update({ current_stage: target, stage_rank: STAGE_RANK[job.event as keyof typeof STAGE_RANK] }).eq("id", deal.id);
      await setJob(job.id, { status: "done", last_error: null });
      results.push({ id: job.id, status: "done", moved: target });
    } catch (err) {
      const message = (err as Error)?.message ?? "Erro desconhecido";
      const delay = BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)];
      const exhausted = attempts >= MAX_ATTEMPTS;
      await setJob(job.id, {
        status: exhausted ? "failed" : "pending", attempts, last_error: message.slice(0, 1000),
        next_attempt_at: new Date(Date.now() + delay * 60_000).toISOString(),
      });
      results.push({ id: job.id, status: exhausted ? "failed" : "retry" });
    }
  }
  return json({ ok: true, processed: (jobs ?? []).length, results });
});
