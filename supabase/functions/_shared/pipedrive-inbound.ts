// Regras puras da entrada (Inbound) Pipedrive → Leaderei.
// A automação do Pipedrive envia um corpo livre; só precisamos achar o ID do negócio.

export interface InboundConfig {
  inbound_enabled?: boolean;
  inbound_token?: string | null;
  inbound_cadence_id?: string | null;
}

function toId(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Aceita os formatos comuns: {deal_id}, {id}, {current:{id}}, {data:{id}}, {deal:{id}} e ?deal_id= na URL. */
export function extractDealId(body: unknown, query?: URLSearchParams): number | null {
  const fromQuery = query ? toId(query.get("deal_id")) : null;
  if (fromQuery) return fromQuery;
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, any>;
  return toId(b.deal_id) ?? toId(b.dealId) ?? toId(b.current?.id) ?? toId(b.data?.id) ??
    toId(b.deal?.id) ?? toId(b.meta?.entity_id) ?? toId(b.id);
}

export function inboundReady(cfg: InboundConfig | null | undefined, token: string | null): boolean {
  return !!cfg && cfg.inbound_enabled === true && !!cfg.inbound_token && !!token &&
    cfg.inbound_token === token && !!cfg.inbound_cadence_id;
}

function first(list: unknown): string | null {
  if (!Array.isArray(list)) return typeof list === "string" && list.trim() ? list.trim() : null;
  const primary = list.find((x: any) => x?.primary) ?? list[0];
  const v = typeof primary === "string" ? primary : primary?.value;
  return v && String(v).trim() ? String(v).trim() : null;
}

/** Monta o lead a partir do negócio, pessoa e organização do Pipedrive. */
export function buildLeadFromDeal(deal: any, person: any, org: any) {
  const phone = first(person?.phone);
  return {
    name: String(person?.name || deal?.person_name || deal?.title || "Lead Pipedrive").slice(0, 200),
    email: first(person?.email)?.toLowerCase() ?? null,
    phone,
    whatsapp: phone,
    company_name: org?.name ?? deal?.org_name ?? null,
  };
}
