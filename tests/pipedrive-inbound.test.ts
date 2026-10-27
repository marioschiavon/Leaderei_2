import { describe, expect, it } from "vitest";
import { buildLeadFromDeal, extractDealId, inboundReady } from "../supabase/functions/_shared/pipedrive-inbound";

describe("entrada Pipedrive", () => {
  it("acha o ID do negócio nos formatos da automação", () => {
    expect(extractDealId({ deal_id: "42" })).toBe(42);
    expect(extractDealId({ current: { id: 7 } })).toBe(7);
    expect(extractDealId({ data: { id: 9 } })).toBe(9);
    expect(extractDealId({}, new URLSearchParams("deal_id=5"))).toBe(5);
    expect(extractDealId({ deal_id: "abc" })).toBeNull();
  });

  it("só aceita com entrada ligada, token igual e cadência escolhida", () => {
    const cfg = { inbound_enabled: true, inbound_token: "t".repeat(32), inbound_cadence_id: "c1" };
    expect(inboundReady(cfg, "t".repeat(32))).toBe(true);
    expect(inboundReady(cfg, "x".repeat(32))).toBe(false);
    expect(inboundReady({ ...cfg, inbound_enabled: false }, "t".repeat(32))).toBe(false);
    expect(inboundReady({ ...cfg, inbound_cadence_id: null }, "t".repeat(32))).toBe(false);
  });

  it("usa o telefone principal da pessoa como WhatsApp", () => {
    const lead = buildLeadFromDeal({ title: "N" }, {
      name: "Ana", email: [{ value: "ANA@X.COM", primary: true }],
      phone: [{ value: "1", primary: false }, { value: "11999990000", primary: true }],
    }, { name: "MG7" });
    expect(lead).toMatchObject({ name: "Ana", email: "ana@x.com", whatsapp: "11999990000", company_name: "MG7" });
  });
});
