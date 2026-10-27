// Recebe a automação do Pipedrive (negócio criado/movido para a etapa de entrada),
// espelha o lead, vincula o negócio original e inscreve na cadência escolhida.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createPipedriveClient } from "../_shared/pipedrive.ts";
import { buildLeadFromDeal, extractDealId, inboundReady, type InboundConfig } from "../_shared/pipedrive-inbound.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 24) return json({ error: "Token ausente" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: integ } = await supabase.from("integrations")
    .select("company_id, api_token, status, config")
    .eq("provider", "pipedrive").eq("config->>inbound_token", token).maybeSingle();
  const cfg = (integ?.config ?? null) as InboundConfig | null;
  if (!integ || integ.status !== "active" || !integ.api_token || !inboundReady(cfg, token)) {
    return json({ error: "Entrada do Pipedrive desligada ou token inválido" }, 401);
  }
  const companyId = integ.company_id as string;

  const body = await req.json().catch(() => ({}));
  const dealId = extractDealId(body, url.searchParams);
  if (!dealId) return json({ error: "ID do negócio não encontrado no corpo (envie deal_id)" }, 400);

  try {
    // Já vinculado? Não duplica.
    const { data: existing } = await supabase.from("pipedrive_deals").select("lead_id")
      .eq("company_id", companyId).eq("deal_id", dealId).maybeSingle();
    let leadId = existing?.lead_id as string | undefined;

    const pd = createPipedriveClient(integ.api_token);
    const deal = await pd.get<any>(`/deals/${dealId}`);
    const personId = Number(deal?.person_id?.value ?? deal?.person_id) || null;
    const orgId = Number(deal?.org_id?.value ?? deal?.org_id) || null;

    if (!leadId) {
      const person = personId ? await pd.get<any>(`/persons/${personId}`).catch(() => null) : null;
      const org = orgId ? await pd.get<any>(`/organizations/${orgId}`).catch(() => null) : null;
      const draft = buildLeadFromDeal(deal, person, org);
      if (!draft.email && !draft.phone) {
        return json({ ok: false, reason: "Negócio sem e-mail nem telefone na pessoa" }, 422);
      }

      // Reaproveita lead já existente (mesmo e-mail ou pessoa do Pipedrive).
      let q = supabase.from("leads").select("id").eq("company_id", companyId).limit(1);
      q = draft.email ? q.eq("email", draft.email) : q.eq("pipedrive_id", String(personId));
      const { data: found } = await q.maybeSingle();
      if (found) {
        leadId = found.id;
      } else {
        const { data: created, error } = await supabase.from("leads").insert({
          company_id: companyId, ...draft, pipedrive_id: personId ? String(personId) : null,
        }).select("id").single();
        if (error) throw error;
        leadId = created.id;
      }

      await supabase.from("pipedrive_deals").upsert({
        company_id: companyId, lead_id: leadId, deal_id: dealId, person_id: personId, org_id: orgId,
        current_stage: deal?.stage_id ? String(deal.stage_id) : null, stage_rank: 1,
      }, { onConflict: "company_id,lead_id" });
    }

    // Organizações protegidas nunca entram em cadência.
    const { data: prot } = await supabase.rpc("is_lead_protected", { _lead_id: leadId });
    if (prot === true) return json({ ok: false, lead_id: leadId, reason: "Organização protegida (Não prospectar)" });

    const cadenceId = cfg!.inbound_cadence_id!;
    const { data: step } = await supabase.from("cadence_steps").select("delay_days")
      .eq("cadence_id", cadenceId).order("step_order", { ascending: true }).limit(1).maybeSingle();
    const next = new Date();
    next.setDate(next.getDate() + (step?.delay_days ?? 0));
    const { error: enrErr } = await supabase.from("cadence_enrollments").upsert({
      cadence_id: cadenceId, lead_id: leadId, company_id: companyId, next_execution_at: next.toISOString(),
    }, { onConflict: "cadence_id,lead_id", ignoreDuplicates: true });
    if (enrErr) throw enrErr;

    return json({ ok: true, lead_id: leadId, deal_id: dealId });
  } catch (e) {
    console.error("pipedrive-inbound", dealId, (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
