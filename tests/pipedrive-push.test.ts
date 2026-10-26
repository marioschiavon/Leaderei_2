import { describe, it, expect } from "vitest";
import { shouldAdvance, stageForEvent, configIsReady, buildEntityFields } from "../supabase/functions/_shared/pipedrive.ts";

describe("Pipedrive: negócio só avança", () => {
  it("resposta não volta negócio que já tem reunião", () => {
    expect(shouldAdvance(3, "stage_replied")).toBe(false);
  });
  it("reunião avança negócio em conversa", () => {
    expect(shouldAdvance(2, "stage_meeting")).toBe(true);
  });
  it("atendimento humano avança a partir da reunião", () => {
    expect(shouldAdvance(3, "move_stage")).toBe(true);
  });
});

describe("Pipedrive: configuração", () => {
  it("envio desligado nunca está pronto", () => {
    expect(configIsReady({ push_enabled: false, pipeline_id: 1, stage_created: 2 })).toBe(false);
  });
  it("etapa não escolhida é ignorada", () => {
    expect(stageForEvent({ stage_meeting: null }, "stage_meeting")).toBeNull();
  });
  it("de/para envia só campos da entidade e ignora vazios", () => {
    const map = { title: { entity: "person" as const, field: "job" }, website: { entity: "deal" as const, field: "abc" } };
    expect(buildEntityFields({ title: "CEO", website: "" }, map, "person")).toEqual({ job: "CEO" });
    expect(buildEntityFields({ title: "CEO", website: "" }, map, "deal")).toEqual({});
  });
});

import { buildActivityDrafts, buildSummaryNote, countTouches } from "../supabase/functions/_shared/pipedrive.ts";

describe("Pipedrive: atividades e resumo", () => {
  const msgs = [
    { direction: "outbound", channel: "whatsapp", content: "Oi", sent_at: "2026-10-01T12:00:00Z" },
    { direction: "outbound", channel: "whatsapp", content: "Tudo bem?", sent_at: "2026-10-02T12:00:00Z" },
    { direction: "outbound", channel: "email", content: "Proposta", sent_at: "2026-10-03T12:00:00Z" },
    { direction: "inbound", channel: "whatsapp", content: "Me conte mais", sent_at: "2026-10-03T15:00:00Z" },
  ];
  it("canal aparece como WhatsApp, nunca Hook7", () => {
    const subjects = buildActivityDrafts(msgs).map((a) => a.subject).join(" ");
    expect(subjects).toContain("WhatsApp: 2 mensagens enviadas");
    expect(subjects).not.toMatch(/hook7/i);
  });
  it("agrupa em uma atividade por canal e sentido", () => {
    expect(buildActivityDrafts(msgs)).toHaveLength(3);
  });
  it("conta toques por canal", () => {
    expect(countTouches(msgs)).toEqual({ whatsapp_out: 2, whatsapp_in: 1, email_out: 1, email_in: 0 });
  });
  it("resumo traz contagem e link da conversa", () => {
    const note = buildSummaryNote({ msgs, summary: "", leadId: "abc" });
    expect(note).toContain("WhatsApp: 2 enviadas / 1 recebidas");
    expect(note).toContain("https://app.leaderei.com.br/conversations?lead=abc");
  });
});
