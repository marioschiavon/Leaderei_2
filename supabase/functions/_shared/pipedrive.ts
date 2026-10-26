// Cliente e regras da esteira Leaderei → Pipedrive.
// O token fica só no servidor (vai na query string da API v1, nunca em log).

export type PipedriveEntity = "deal" | "person";

export interface PipedriveFieldTarget {
  entity: PipedriveEntity;
  field: string;
}

export interface PipedriveConfig {
  push_enabled?: boolean;
  pipeline_id?: number | string | null;
  stage_created?: number | string | null;
  stage_replied?: number | string | null;
  stage_meeting?: number | string | null;
  stage_handoff?: number | string | null;
  owner_id?: number | string | null;
  field_map?: Record<string, PipedriveFieldTarget>;
}

/** O negócio só avança: criação < em conversa < reunião < atendimento humano. */
export const STAGE_RANK = {
  create_deal: 1,
  stage_replied: 2,
  stage_meeting: 3,
  move_stage: 4,
} as const;

export type PipedriveEvent = keyof typeof STAGE_RANK;

export function shouldAdvance(currentRank: number, event: string): boolean {
  const next = STAGE_RANK[event as PipedriveEvent] ?? 0;
  return next > (Number(currentRank) || 0);
}

export function stageForEvent(config: PipedriveConfig, event: string): string | null {
  const v = event === "stage_replied"
    ? config.stage_replied
    : event === "stage_meeting"
    ? config.stage_meeting
    : event === "move_stage"
    ? config.stage_handoff
    : event === "create_deal"
    ? config.stage_created
    : null;
  return v === null || v === undefined || v === "" ? null : String(v);
}

export function configIsReady(cfg: PipedriveConfig | null | undefined): boolean {
  return !!cfg && cfg.push_enabled === true && !!cfg.pipeline_id && !!cfg.stage_created;
}

/** Monta os campos de uma entidade a partir do de/para. Valores vazios são ignorados. */
export function buildEntityFields(
  lead: Record<string, unknown>,
  map: Record<string, PipedriveFieldTarget> | null | undefined,
  entity: PipedriveEntity,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [leadKey, target] of Object.entries(map ?? {})) {
    if (!target?.field || target.entity !== entity) continue;
    const value = lead[leadKey];
    if (value === null || value === undefined || value === "") continue;
    out[target.field] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

export interface PipedriveClient {
  get<T = any>(path: string, params?: Record<string, string | number>): Promise<T>;
  post<T = any>(path: string, body: Record<string, unknown>): Promise<T>;
  put<T = any>(path: string, body: Record<string, unknown>): Promise<T>;
}

export function createPipedriveClient(apiToken: string): PipedriveClient {
  let last = 0;
  async function call(method: string, path: string, params: Record<string, string | number> = {}, body?: unknown) {
    const wait = 500 - (Date.now() - last);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_token: apiToken });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const res = await fetch(`https://api.pipedrive.com/v1${path}?${qs}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const msg = data?.error || data?.error_info || `HTTP ${res.status}`;
        throw new Error(`Pipedrive ${method} ${path}: ${msg}`);
      }
      return data?.data;
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    get: (p, params) => call("GET", p, params),
    post: (p, b) => call("POST", p, {}, b),
    put: (p, b) => call("PUT", p, {}, b),
  };
}

// ---------- Atividades e resumo para o cliente final ----------
// Texto que sai para o CRM do cliente: canal sempre "WhatsApp" ou "E-mail".

export interface SyncMessage {
  direction: string;
  channel: string;
  content?: string | null;
  sent_at: string;
}

export function channelLabel(channel: string): "WhatsApp" | "E-mail" {
  return channel === "whatsapp" ? "WhatsApp" : "E-mail";
}

export interface ActivityDraft {
  subject: string;
  type: "email" | "task";
  note: string;
  due: string; // ISO do último envio do grupo
}

/** Agrupa mensagens novas em uma atividade concluída por canal e sentido (economiza chamadas). */
export function buildActivityDrafts(msgs: SyncMessage[]): ActivityDraft[] {
  const groups = new Map<string, SyncMessage[]>();
  for (const m of msgs) {
    const k = `${channelLabel(m.channel)}|${m.direction === "inbound" ? "in" : "out"}`;
    groups.set(k, [...(groups.get(k) ?? []), m]);
  }
  const out: ActivityDraft[] = [];
  for (const [k, list] of groups) {
    const [label, dir] = k.split("|") as ["WhatsApp" | "E-mail", "in" | "out"];
    const n = list.length;
    const subject = dir === "in"
      ? `${label}: resposta do lead${n > 1 ? ` (${n} mensagens)` : ""}`
      : `${label}: ${n > 1 ? `${n} mensagens enviadas` : "mensagem enviada"} pela Leaderei`;
    const last = list[list.length - 1];
    const snippet = String(last.content ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
    out.push({
      subject,
      type: label === "E-mail" ? "email" : "task",
      note: snippet ? `Última mensagem: "${snippet}"` : "",
      due: last.sent_at,
    });
  }
  return out;
}

export function countTouches(msgs: SyncMessage[]) {
  const c = { whatsapp_out: 0, whatsapp_in: 0, email_out: 0, email_in: 0 };
  for (const m of msgs) {
    const ch = m.channel === "whatsapp" ? "whatsapp" : "email";
    const d = m.direction === "inbound" ? "in" : "out";
    c[`${ch}_${d}` as keyof typeof c]++;
  }
  return c;
}

export function buildSummaryNote(opts: {
  msgs: SyncMessage[];
  summary: string;
  leadId: string;
  meetingAt?: string | null;
  appUrl?: string;
}): string {
  const c = countTouches(opts.msgs);
  const firstOut = opts.msgs.find((m) => m.direction !== "inbound");
  const firstIn = opts.msgs.find((m) => m.direction === "inbound");
  let response = "";
  if (firstOut && firstIn && firstIn.sent_at > firstOut.sent_at) {
    const h = (new Date(firstIn.sent_at).getTime() - new Date(firstOut.sent_at).getTime()) / 3_600_000;
    response = h < 24 ? `${Math.max(1, Math.round(h))}h` : `${Math.round(h / 24)} dia(s)`;
  }
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const url = `${opts.appUrl ?? "https://app.leaderei.com.br"}/conversations?lead=${opts.leadId}`;
  return [
    "<b>Resumo Leaderei</b>",
    `WhatsApp: ${c.whatsapp_out} enviadas / ${c.whatsapp_in} recebidas`,
    `E-mail: ${c.email_out} enviados / ${c.email_in} recebidos`,
    response ? `Tempo até a primeira resposta: ${response}` : null,
    opts.meetingAt ? `Reunião: ${fmt(opts.meetingAt)}` : null,
    opts.summary ? `<br><b>Resumo da conversa</b><br>${opts.summary.replace(/\n/g, "<br>")}` : null,
    `<br><a href="${url}">Ver conversa completa na Leaderei</a>`,
  ].filter(Boolean).join("<br>");
}
