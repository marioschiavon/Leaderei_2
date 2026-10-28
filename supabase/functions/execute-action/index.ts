import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getZApiConfig, sendWhatsAppViaZApi, checkPhonesOnWhatsApp, getHook7SendInstance } from "../_shared/hook7-whatsapp.ts";
import { enqueueWhatsAppSend } from "../_shared/whatsapp-pacer.ts";
import { shouldGate, createApprovalRequest, isLeadUnderHumanTakeover } from "../_shared/hitl-gate.ts";
import { getEmailReplyContext } from "../_shared/email-thread.ts";
import { normalizePhoneBR, toWhatsAppDigits } from "../_shared/phone-br.ts";
import { buildOutreach, sendOrGate } from "../_shared/shared-contact.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ActionContext = {
  supabase: ReturnType<typeof createClient>;
  company_id: string;
  lead_id: string;
  conversation_id: string | null;
  intent_log_id: string | null;
  params: Record<string, any>;
};

async function logActivity(ctx: ActionContext, type: string, description: string, metadata: Record<string, any> = {}) {
  try {
    await ctx.supabase.from("lead_activities").insert({
      company_id: ctx.company_id,
      lead_id: ctx.lead_id,
      type,
      description,
      metadata: { source: "execute-action", ...metadata },
    });
  } catch (e) {
    console.error("logActivity failed:", e);
  }
}

async function loadLead(ctx: ActionContext) {
  const { data } = await ctx.supabase.from("leads").select("*").eq("id", ctx.lead_id).maybeSingle();
  return data;
}

async function loadHistory(ctx: ActionContext, limit = 12) {
  if (!ctx.conversation_id) return [];
  const { data } = await ctx.supabase
    .from("messages")
    .select("direction, content")
    .eq("conversation_id", ctx.conversation_id)
    .order("sent_at", { ascending: true })
    .limit(limit);
  return data || [];
}

async function loadConversationChannel(ctx: ActionContext): Promise<string> {
  if (!ctx.conversation_id) return "email";
  const { data } = await ctx.supabase
    .from("conversations")
    .select("channel")
    .eq("id", ctx.conversation_id)
    .maybeSingle();
  return (data?.channel as string) || "email";
}

async function loadIntent(ctx: ActionContext) {
  if (!ctx.intent_log_id) return null;
  const { data } = await ctx.supabase
    .from("lead_intents_log")
    .select("category, sub_intent, entities")
    .eq("id", ctx.intent_log_id)
    .maybeSingle();
  return data;
}

/**
 * Defense in depth: guard destructive actions so a misconfigured rule cannot
 * cancel/reschedule meetings just because the prospect mentioned a date.
 * Only enforced when triggered automatically (no explicit booking_uid param).
 */
const DESTRUCTIVE_SUB_INTENTS: Record<string, Set<string>> = {
  cancel_booking: new Set(["cancel_request", "cancel_meeting", "wants_to_cancel"]),
  reschedule_booking: new Set(["reschedule_request", "wants_to_reschedule", "change_time"]),
  mark_meeting_attended: new Set(["attended_confirmation", "post_meeting_followup", "no_show_explanation"]),
};

async function assertSubIntentAllowed(ctx: ActionContext, action: string) {
  const allowed = DESTRUCTIVE_SUB_INTENTS[action];
  if (!allowed) return;
  const intent = await loadIntent(ctx);
  const sub = intent?.sub_intent || "";
  if (!allowed.has(sub)) {
    throw new Error(
      `${action}: sub_intent não compatível (${sub || "vazio"}) — nenhuma ação tomada`,
    );
  }
}

/* ─── Generate-reply helper ─────────────────────────────────────── */
async function generateReply(ctx: ActionContext, opts: { tone?: string; category?: string; sub_intent?: string }) {
  const [lead, history, channel] = await Promise.all([loadLead(ctx), loadHistory(ctx), loadConversationChannel(ctx)]);
  const intent = await loadIntent(ctx);
  const { data, error } = await ctx.supabase.functions.invoke("generate-reply", {
    body: {
      company_id: ctx.company_id,
      lead,
      intent: {
        category: opts.category || intent?.category || "info_request",
        sub_intent: opts.sub_intent || intent?.sub_intent || null,
      },
      history,
      channel,
      tone: opts.tone,
    },
  });
  if (error) throw new Error(`generate-reply failed: ${error.message}`);
  return data as { subject?: string | null; body: string };
}

async function sendOutbound(ctx: ActionContext, content: string, subject: string | null, channel: string, metadata: Record<string, any> = {}) {
  if (!ctx.conversation_id) return { sent: false, reason: "no conversation_id" };

  // Human takeover: operator owns the thread — never send or create approvals.
  if (await isLeadUnderHumanTakeover(ctx.supabase, { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id })) {
    console.log("[execute-action] skip sendOutbound — human_takeover", { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id });
    return { sent: false, reason: "human_takeover" };
  }

  // HITL gate: if enabled for this company + scope, create approval and skip send
  if (!metadata.hitl_bypass) {
    const action = String(metadata.action || "send_reply");
    const sensitive = /cancel|reschedule|remove|booking_confirmation/i.test(action);
    const scope: "sdr_reply" | "sensitive_action" = sensitive ? "sensitive_action" : "sdr_reply";
    if (await shouldGate(ctx.supabase, ctx.company_id, scope, { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id })) {
      await createApprovalRequest(ctx.supabase, {
        company_id: ctx.company_id,
        lead_id: ctx.lead_id,
        conversation_id: ctx.conversation_id,
        kind: scope,
        channel,
        action,
        payload: { subject, message: content, ...metadata },
        context: { intent_log_id: ctx.intent_log_id, ...((metadata as any)._ctx || {}) },
      });
      return { sent: false, reason: "hitl_pending", pending_approval: true };
    }
  }


  let deliveryStatus: string = "sent";
  const deliveryMeta: Record<string, any> = {};
  let sent = true;
  let outboundError: string | null = null;
  let outboundReason: string | null = null;

  if (channel === "email") {
    const lead = await loadLead(ctx);
    if (lead?.email) {
      try {
        const threadCtx = await getEmailReplyContext(ctx.supabase, ctx.conversation_id);
        const finalSubject = threadCtx.reply_subject || subject || "Continuando nossa conversa";
        await ctx.supabase.functions.invoke("send-outbound-email", {
          body: {
            to: lead.email,
            subject: finalSubject,
            html: content.replace(/\n/g, "<br/>"),
            lead_id: ctx.lead_id,
            company_id: ctx.company_id,
            conversation_id: ctx.conversation_id,
            in_reply_to_rfc_id: threadCtx.in_reply_to_rfc_id,
            references: threadCtx.references,
            provider_thread_id: threadCtx.provider_thread_id,
          },
        });
        deliveryStatus = "sent";
      } catch (e: any) {
        console.error("gmail-send failed:", e);
        deliveryStatus = "failed";
        sent = false;
        outboundError = e?.message || String(e);
        deliveryMeta.delivery_error = outboundError;
      }
    } else {
      sent = false;
      outboundReason = "lead sem e-mail";
      deliveryStatus = "failed";
      deliveryMeta.delivery_error = outboundReason;
    }
  } else if (channel === "whatsapp") {
    const lead = await loadLead(ctx);
    const toNumber = (lead as any)?.whatsapp || (lead as any)?.phone;
    if (!toNumber) {
      sent = false;
      outboundReason = "lead sem whatsapp/phone";
      deliveryStatus = "failed";
      deliveryMeta.delivery_error = outboundReason;
    } else {
      const cfg = await getZApiConfig(ctx.supabase, ctx.company_id);
      let needsRequeue = false;
      if (!cfg) {
        outboundReason = "nenhuma conexão de WhatsApp ativa";
        deliveryMeta.delivery_error = outboundReason;
        needsRequeue = true;
      } else {
        const r = await sendWhatsAppViaZApi(cfg, toNumber, content);
        if (r.ok) {
          deliveryStatus = "delivered";
          deliveryMeta.zapi_message_id = r.sid;
          deliveryMeta.zapi_status = r.status;
        } else {
          console.error("whatsapp send failed:", r);
          outboundError = r.error || `HTTP ${r.status}`;
          deliveryMeta.zapi_status = r.status;
          deliveryMeta.zapi_error = r.error;
          deliveryMeta.delivery_error = outboundError;
          needsRequeue = true;
        }
      }
      // Rede de segurança: reenfileira com prioridade alta em vez de perder a
      // resposta, e registra no histórico do lead.
      if (needsRequeue) {
        const q = await enqueueWhatsAppSend(ctx.supabase, {
          companyId: ctx.company_id,
          toPhone: toNumber,
          body: String(content),
          leadId: (lead as any)?.id ?? null,
          conversationId: ctx.conversation_id ?? null,
          source: "execute_action_retry",
          replyMode: true,
        });
        deliveryMeta.requeued = q.ok;
        if (q.ok) {
          sent = true;
          deliveryStatus = "queued";
        } else {
          sent = false;
          deliveryStatus = "failed";
          deliveryMeta.requeue_error = q.error;
        }
        if ((lead as any)?.id) {
          await ctx.supabase.from("lead_activities").insert({
            company_id: ctx.company_id,
            lead_id: (lead as any).id,
            type: "whatsapp",
            description: q.ok
              ? "⏳ WhatsApp fora do ar — resposta na fila, será enviada assim que reconectar"
              : `❌ WhatsApp não enviado (conexão fora do ar): ${outboundError ?? outboundReason ?? "sem conexão"}`,
          });
        }
      }
    }
  } else {
    deliveryStatus = "pending_manual";
  }

  // E-mails enviados via gmail-send já são persistidos por aquela função
  // (com gmail_message_id/rfc_message_id). Para evitar dupla escrita em
  // `messages`, só inserimos aqui quando NÃO é email-sucesso.
  const skipInsert = channel === "email" && deliveryStatus === "sent";
  if (!skipInsert) {
    await ctx.supabase.from("messages").insert({
      conversation_id: ctx.conversation_id,
      content,
      direction: "outbound",
      ai_suggested: true,
      channel,
      metadata: { source: "execute-action", subject, delivery_status: deliveryStatus, ...deliveryMeta, ...metadata },
    });
  }


  return { sent, channel, delivery_status: deliveryStatus, ...(outboundError ? { error: outboundError } : {}), ...(outboundReason ? { reason: outboundReason } : {}), ...deliveryMeta };
}

/* ─── Action handlers ─────────────────────────────────────────────── */
const HANDLERS: Record<string, (ctx: ActionContext) => Promise<any>> = {
  async update_lead_score(ctx) {
    const delta = Number(ctx.params.delta) || 0;
    const { data: l } = await ctx.supabase.from("leads").select("score").eq("id", ctx.lead_id).maybeSingle();
    const newScore = Math.max(0, (l?.score || 0) + delta);
    await ctx.supabase.from("leads").update({ score: newScore }).eq("id", ctx.lead_id);
    await logActivity(ctx, "note", `🎯 Score atualizado: ${delta >= 0 ? "+" : ""}${delta} → ${newScore}`, { delta, new_score: newScore });
    return { new_score: newScore, delta };
  },

  async disqualify_lead(ctx) {
    await ctx.supabase.from("leads").update({ status: "lost" as any }).eq("id", ctx.lead_id);
    await logActivity(ctx, "note", "❌ Lead desqualificado automaticamente", { reason: ctx.params.reason || "intent_rejection" });
    return { status: "lost" };
  },

  async mark_opt_out(ctx) {
    const lead = await loadLead(ctx);
    await ctx.supabase.from("leads").update({ status: "lost" as any }).eq("id", ctx.lead_id);
    if (lead?.email) {
      await ctx.supabase.from("suppressed_emails").upsert(
        { email: lead.email, reason: "opt_out", metadata: { lead_id: ctx.lead_id } } as any,
        { onConflict: "email" } as any,
      );
    }
    await logActivity(ctx, "note", "🚫 Opt-out registrado, e-mail adicionado à supressão");
    return { opted_out: true, email: lead?.email };
  },

  async stop_sequence(ctx) {
    const { data, error } = await ctx.supabase
      .from("cadence_enrollments")
      .update({ status: "paused", paused_reason: ctx.params.reason || "intent_pipeline" } as any)
      .eq("lead_id", ctx.lead_id)
      .in("status", ["active", "paused"])
      .select("id");
    if (error) throw error;
    await logActivity(ctx, "note", `⏸ Cadência pausada (${ctx.params.reason || "intent_pipeline"})`);
    return { paused: data?.length || 0 };
  },

  async handoff_to_human(ctx) {
    await ctx.supabase
      .from("leads")
      .update({
        handoff_required: true,
        handoff_reason: ctx.params.reason || "intent_escalation",
        handoff_at: new Date().toISOString(),
      } as any)
      .eq("id", ctx.lead_id);
    await logActivity(ctx, "note", `👤 Handoff humano solicitado: ${ctx.params.reason || "escalation"}`);
    return { handoff: true };
  },

  async schedule_followup(ctx) {
    // Branch 1: lead explicitly requested a callback at a specific time/channel.
    // When the queued row's scheduled_for has fired, generate + send a real message
    // and resume the cadence.
    if (ctx.params.source === "lead_request") {
      const requestedChannel = (ctx.params.channel as string | undefined) || (await loadConversationChannel(ctx));
      const originalRequest = (ctx.params.original_request as string | undefined) || "";
      const tone = `O lead pediu explicitamente que voltássemos a contatá-lo neste momento via ${requestedChannel}${
        originalRequest ? ` (pedido original: "${originalRequest.slice(0, 200)}")` : ""
      }. Escreva uma mensagem curta, natural, retomando a conversa como combinado — sem reapresentar a empresa, sem perguntar se "pode falar", e seguindo o objetivo discutido antes. Não ofereça horários de reunião a menos que ele já tenha demonstrado interesse explícito em agendar.`;
      const reply = await generateReply(ctx, { tone, category: "info_request" });
      // Send via the requested channel
      if (requestedChannel === "email") {
        const lead = await loadLead(ctx);
        if (!lead?.email) {
          await logActivity(ctx, "note", "⚠️ Callback agendado por e-mail, mas lead sem e-mail cadastrado");
          return { skipped: "no email" };
        }
        // Human takeover: skip entirely.
        if (await isLeadUnderHumanTakeover(ctx.supabase, { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id })) {
          await logActivity(ctx, "system", `⏸️ Callback ignorado — operador no controle (human_takeover)`);
          return { sent: false, reason: "human_takeover" };
        }
        // HITL gate
        if (await shouldGate(ctx.supabase, ctx.company_id, "sdr_reply", { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id })) {
          await createApprovalRequest(ctx.supabase, {
            company_id: ctx.company_id,
            lead_id: ctx.lead_id,
            conversation_id: ctx.conversation_id,
            kind: "sdr_reply",
            channel: "email",
            action: "schedule_followup_callback",
            payload: { subject: reply.subject || "Continuando nossa conversa", message: reply.body, to: lead.email },
            context: { intent_log_id: ctx.intent_log_id, lead_requested: true },
          });
          await logActivity(ctx, "system", `🕓 Callback por e-mail aguardando aprovação humana`);
          return { sent: false, reason: "hitl_pending", pending_approval: true };
        }
        const threadCtx = await getEmailReplyContext(ctx.supabase, ctx.conversation_id);
        await ctx.supabase.functions.invoke("send-outbound-email", {
          body: {
            to: lead.email,
            subject: threadCtx.reply_subject || reply.subject || "Continuando nossa conversa",
            html: reply.body.replace(/\n/g, "<br/>"),
            lead_id: ctx.lead_id,
            company_id: ctx.company_id,
            conversation_id: ctx.conversation_id,
            in_reply_to_rfc_id: threadCtx.in_reply_to_rfc_id,
            references: threadCtx.references,
            provider_thread_id: threadCtx.provider_thread_id,
          },
        });
        // `gmail-send` já persiste a mensagem outbound em `messages` com
        // gmail_message_id; não duplicamos aqui.

        await logActivity(ctx, "email", `📧 Callback enviado conforme solicitado pelo lead`, { channel: "email" });
      } else {
        await sendOutbound(ctx, reply.body, reply.subject ?? null, requestedChannel, {
          action: "schedule_followup",
          lead_requested: true,
        });
        await logActivity(ctx, requestedChannel === "whatsapp" ? "whatsapp" : "note",
          `📤 Callback enviado conforme solicitado pelo lead (${requestedChannel})`,
          { channel: requestedChannel });
      }
      // Resume cadence
      await ctx.supabase
        .from("cadence_enrollments")
        .update({ status: "active", paused_reason: null, next_execution_at: new Date(Date.now() + 86400_000).toISOString() } as any)
        .eq("lead_id", ctx.lead_id)
        .eq("paused_reason", "lead_requested_callback");
      return { sent: true, channel: requestedChannel };
    }
    // Branch 2 (legacy): generic "schedule a reply in N days"
    const days = Number(ctx.params.days) || 2;
    const scheduledFor = new Date(Date.now() + days * 86400000).toISOString();
    await ctx.supabase.from("lead_action_queue").insert({
      company_id: ctx.company_id,
      lead_id: ctx.lead_id,
      conversation_id: ctx.conversation_id,
      intent_log_id: ctx.intent_log_id,
      action_type: "send_reply" as any,
      params: { tone: "followup", reason: "scheduled_followup" },
      scheduled_for: scheduledFor,
      triggered_by: "schedule_followup",
    });
    await logActivity(ctx, "note", `⏰ Follow-up agendado para daqui ${days}d`, { scheduled_for: scheduledFor });
    return { scheduled_for: scheduledFor };
  },


  async send_reply(ctx) {
    let { message, subject } = ctx.params as { message?: string; subject?: string | null };
    if (!message) {
      const reply = await generateReply(ctx, { tone: ctx.params.tone });
      message = reply.body;
      subject = subject ?? reply.subject ?? null;
    }
    const channel = await loadConversationChannel(ctx);
    const _ctx = (ctx.params as any)._ctx;
    const result = await sendOutbound(ctx, message!, subject ?? null, channel, { action: "send_reply", ...(_ctx ? { _ctx } : {}) });
    await logActivity(ctx, channel === "whatsapp" ? "whatsapp" : channel === "linkedin" ? "linkedin" : "email",
      `📤 Resposta enviada: ${message!.substring(0, 120)}`, { direction: "outbound", channel });
    return result;
  },

  async ask_clarifying_question(ctx) {
    const reply = await generateReply(ctx, { tone: "pergunta_curta_de_qualificacao" });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "ask_clarifying_question" });
    await logActivity(ctx, "note", `❓ Pergunta de qualificação enviada`);
    return { sent: true };
  },

  async request_info_from_lead(ctx) {
    const missing = ctx.params.missing_fields || ["cargo", "empresa", "e-mail corporativo"];
    const reply = await generateReply(ctx, {
      tone: `peça gentilmente as informações faltantes: ${(missing as string[]).join(", ")}`,
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "request_info_from_lead", missing });
    await logActivity(ctx, "note", `📋 Pedido de informações faltantes: ${(missing as string[]).join(", ")}`);
    return { sent: true, missing };
  },

  async suggest_meeting_times(ctx) {
    // Try real Cal.com slots; fall back to AI reply offering generic times
    try {
      // Read last intent entities to honour the lead's date preference
      let rangeHint: { start_after?: string; end_before?: string } | null = null;
      try {
        const { data: lastIntent } = await ctx.supabase
          .from("lead_intents_log")
          .select("entities, message_excerpt")
          .eq("lead_id", ctx.lead_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const dtHint = (lastIntent as any)?.entities?.datetime;
        const excerpt = (lastIntent as any)?.message_excerpt || "";
        const { extractDateRangeFromText } = await import("../_shared/date-range.ts");
        rangeHint = extractDateRangeFromText(`${dtHint || ""} ${excerpt}`);
      } catch (_) { /* best effort */ }

      const body: any = {
        company_id: ctx.company_id,
        lead_id: ctx.lead_id,
        conversation_id: ctx.conversation_id,
        preferred_channel: await loadConversationChannel(ctx),
      };
      if (rangeHint?.start_after) body.start_after = rangeHint.start_after;
      if (rangeHint?.end_before) body.end_before = rangeHint.end_before;

      const { data: slots, error } = await ctx.supabase.functions.invoke("calcom-slots", { body });
      if (error) throw new Error(error.message);
      await logActivity(ctx, "note", `📅 Horários sugeridos via Cal.com`);
      return { slots };
    } catch (e) {
      // Fallback: AI message asking when the lead is free
      const reply = await generateReply(ctx, { tone: "ofereça 2 horários genéricos esta semana para uma conversa rápida de apresentação, sem citar duração em minutos", category: "scheduling" });
      const channel = await loadConversationChannel(ctx);
      await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "suggest_meeting_times", fallback: true });
      await logActivity(ctx, "note", `📅 Sugestão de horário enviada (fallback)`);
      return { fallback: true, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async create_cal_booking(ctx) {
    const { selected_datetime, selected_slot } = ctx.params;
    if (!selected_datetime && !selected_slot) {
      throw new Error("create_cal_booking requer selected_datetime ou selected_slot");
    }
    const { data, error } = await ctx.supabase.functions.invoke("calcom-confirm-booking", {
      body: {
        company_id: ctx.company_id,
        lead_id: ctx.lead_id,
        conversation_id: ctx.conversation_id,
        slot_datetime: selected_datetime,
        slot_index: selected_slot,
      },
    });
    if (error) throw new Error(error.message);
    await logActivity(ctx, "meeting", `✅ Reunião confirmada (Cal.com)`, { booking: data });
    return data;
  },

  async send_calendar_link(ctx) {
    const link = Deno.env.get("CALCOM_BOOKING_LINK") || ctx.params.link;
    if (!link) throw new Error("CALCOM_BOOKING_LINK não configurado");
    const lead = await loadLead(ctx);
    const message = `Oi ${lead?.name?.split(" ")[0] || ""}, segue meu link de agenda — escolhe o horário que melhor encaixa: ${link}`;
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, message, "Agendamento de reunião", channel, { action: "send_calendar_link", link });
    await logActivity(ctx, "note", `🔗 Link de calendário enviado`);
    return { link, sent: true };
  },

  async send_email(ctx) {
    const lead = await loadLead(ctx);
    if (!lead?.email) throw new Error("lead sem e-mail cadastrado");
    let subject = ctx.params.subject as string | undefined;
    let body = ctx.params.body as string | undefined;
    if (!body) {
      const reply = await generateReply(ctx, { tone: ctx.params.tone });
      body = reply.body;
      subject = subject ?? reply.subject ?? "Continuando nossa conversa";
    }

    // Human takeover: skip entirely — operator owns the thread.
    if (await isLeadUnderHumanTakeover(ctx.supabase, { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id })) {
      await logActivity(ctx, "system", `⏸️ send_email ignorado — operador no controle (human_takeover)`);
      return { sent: false, reason: "human_takeover" };
    }

    // HITL gate
    if (await shouldGate(ctx.supabase, ctx.company_id, "sdr_reply", { lead_id: ctx.lead_id, conversation_id: ctx.conversation_id })) {
      await createApprovalRequest(ctx.supabase, {
        company_id: ctx.company_id,
        lead_id: ctx.lead_id,
        conversation_id: ctx.conversation_id,
        kind: "sdr_reply",
        channel: "email",
        action: "send_email",
        payload: { subject, message: body, to: lead.email },
        context: { intent_log_id: ctx.intent_log_id },
      });
      await logActivity(ctx, "system", `🕓 E-mail aguardando aprovação humana`);
      return { sent: false, reason: "hitl_pending", pending_approval: true };
    }

    const threadCtx = await getEmailReplyContext(ctx.supabase, ctx.conversation_id);
    const { error } = await ctx.supabase.functions.invoke("send-outbound-email", {
      body: {
        to: lead.email,
        subject: threadCtx.reply_subject || subject || "Continuando nossa conversa",
        html: body!.replace(/\n/g, "<br/>"),
        lead_id: ctx.lead_id,
        company_id: ctx.company_id,
        conversation_id: ctx.conversation_id,
        in_reply_to_rfc_id: threadCtx.in_reply_to_rfc_id,
        references: threadCtx.references,
        provider_thread_id: threadCtx.provider_thread_id,
      },
    });
    if (error) throw new Error(`gmail-send failed: ${error.message}`);
    // `gmail-send` já persiste a mensagem outbound em `messages` com
    // gmail_message_id e headers — não duplicar aqui.
    await logActivity(ctx, "email", `📧 E-mail enviado: ${subject}`, { direction: "outbound", subject });
    return { sent: true, to: lead.email, subject };
  },

  async create_new_contact(ctx) {
    const { name, role, context, company_name, website, address, linkedin_company_url } = ctx.params;
    const email: string | null = ctx.params.email ? String(ctx.params.email).trim().toLowerCase() : null;
    const phone: string | null = ctx.params.phone ? normalizePhoneBR(String(ctx.params.phone)) : null;
    if (!name && !email && !phone) {
      await logActivity(ctx, "note", `⚠️ Tentou criar novo contato por indicação, mas faltaram nome, e-mail e telefone — ação ignorada.`, { params: ctx.params });
      return { skipped: "missing name, email and phone" };
    }
    const referrer = await loadLead(ctx);

    // Não duplica: indicado que já é lead da empresa só fica registrado.
    {
      const d = phone ? phone.replace(/\D/g, "") : "";
      const ors: string[] = [];
      if (email) ors.push(`email.ilike.${email}`);
      if (d) ors.push(`whatsapp.ilike.%${d.slice(-8)}`, `phone.ilike.%${d.slice(-8)}`);
      if (ors.length) {
        const { data: cands } = await ctx.supabase.from("leads").select("id, name, email, whatsapp, phone")
          .eq("company_id", ctx.company_id).neq("id", ctx.lead_id).or(ors.join(",")).limit(10);
        const dig = (s: any) => String(s ?? "").replace(/\D/g, "");
        const existing = (cands || []).find((l: any) =>
          (email && String(l.email || "").toLowerCase() === email) ||
          (d && [dig(l.whatsapp), dig(l.phone)].some((x) => x && x.slice(-10) === d.slice(-10))));
        if (existing) {
          await logActivity(ctx, "referral" as any, `🔁 Indicou ${existing.name || email || phone}, que já é um lead cadastrado — sem nova abordagem`, { existing_lead_id: existing.id });
          return { skipped: "duplicate", existing_lead_id: existing.id };
        }
      }
    }

    // Nome inteligente: jamais coloca o e-mail bruto no campo nome.
    const deriveNameFromEmail = (e?: string | null) => {
      if (!e) return null;
      const local = String(e).split("@")[0] || "";
      const cleaned = local.replace(/[._\-+0-9]+/g, " ").trim();
      if (!cleaned) return null;
      return cleaned
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    };
    const formatPhone = (p?: string | null) => {
      if (!p) return null;
      const digits = String(p).replace(/\D/g, "");
      return digits.length >= 10 ? `Contato ${digits.slice(-4)}` : null;
    };
    const isEmailLike = (s?: string | null) =>
      !!s && (String(s).includes("@") || String(s).trim() === String(email ?? "").trim());
    const finalName =
      (typeof name === "string" && name.trim() && !isEmailLike(name) ? name.trim() : null) ||
      deriveNameFromEmail(email) ||
      formatPhone(phone) ||
      "Indicação sem nome";

    const payload: Record<string, any> = {
      company_id: ctx.company_id,
      name: finalName,
      email: email || null,
      phone: phone || null,
      title: role || null,
      // Empresa/website/address/linkedin: usa o que veio no params; senão herda do indicante.
      company_name: company_name || referrer?.company_name || null,
      website: website || referrer?.website || null,
      address: address || referrer?.address || null,
      linkedin_company_url: linkedin_company_url || referrer?.linkedin_company_url || null,
      source: "referral",
      status: "new" as any,
      pipeline_mode: referrer?.pipeline_mode || "agent",
      referral_source_lead_id: ctx.lead_id,
      referral_role: role || null,
      referral_context: context || null,
      referral_stage: "pending_outreach",
      // Snapshot do indicante para fácil acesso (sem precisar de join).
      referrer_name: referrer?.name || null,
      referrer_company: referrer?.company_name || null,
    };

    const { data: newLead, error } = await ctx.supabase
      .from("leads")
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;

    // ── Abordagem do indicado ──────────────────────────────────────────
    // 1) Organização protegida ("Não prospectar") → não aborda.
    // 2) Telefone + WhatsApp conectado → primeira mensagem no WhatsApp.
    // 3) Só e-mail → cadência de indicações (se houver) ou e-mail direto
    //    pela MESMA caixa que conversava com quem indicou.
    let outreachDone = false;
    let outreachResult: string | null = null;
    try {
      const { data: isProt } = await ctx.supabase.rpc("is_lead_protected", { _lead_id: newLead.id });
      if (isProt) {
        outreachDone = true;
        outreachResult = "protected";
        await logActivity(ctx, "note", `🛡️ Indicado ${finalName} pertence a uma organização da lista "Não prospectar" — sem abordagem`, { new_lead_id: newLead.id });
      }
    } catch (e) {
      console.error("[create_new_contact] protection check failed:", e);
    }

    if (!outreachDone) {
      const contextText = (await loadHistory(ctx))
        .map((m: any) => `${m.direction === "inbound" ? "LEAD" : "SDR"}: ${m.content || ""}`).join("\n");
      const contact = { name: finalName, phone, email, org: payload.company_name, title: role || null };
      try {
        const { data: inst } = phone
          ? await ctx.supabase.from("hook7_instances").select("id").eq("company_id", ctx.company_id)
              .eq("status", "connected").is("archived_at", null).limit(1).maybeSingle()
          : { data: null } as any;
        // Verifica se o telefone indicado tem WhatsApp antes de abordar.
        // Resultado desconhecido (erro) mantém o comportamento anterior.
        let hasWhats: boolean | null = null;
        if (phone && inst) {
          try {
            const sendInst = await getHook7SendInstance(ctx.supabase, ctx.company_id);
            const d = toWhatsAppDigits(phone);
            if (sendInst && d) {
              const r = await checkPhonesOnWhatsApp(ctx.supabase, sendInst, [d]);
              const v = r.ok ? r.results.get(d) : undefined;
              if (typeof v === "boolean") {
                hasWhats = v;
                await ctx.supabase.from("leads").update({
                  whatsapp_valid: v, whatsapp_checked_at: new Date().toISOString(), whatsapp_check_error: null,
                  ...(v ? {} : { preferred_channel: email ? "email" : "phone" }),
                } as any).eq("id", newLead.id);
              }
            }
          } catch (e) {
            console.error("[create_new_contact] whatsapp check failed:", e);
          }
          if (hasWhats === false) {
            await logActivity(ctx, "note", `📵 Telefone do indicado ${finalName} não tem WhatsApp${email ? " — abordagem segue por e-mail" : " — sem canal digital para abordar"}`, { new_lead_id: newLead.id });
            if (!email) { outreachDone = true; outreachResult = "sem WhatsApp e sem e-mail"; }
          }
        }
        if (phone && inst && hasWhats !== false) {
          await ctx.supabase.from("leads").update({ whatsapp: phone, preferred_channel: "whatsapp" } as any).eq("id", newLead.id);
          const { data: conv } = await ctx.supabase.from("conversations")
            .insert({ company_id: ctx.company_id, lead_id: newLead.id, channel: "whatsapp" } as any).select("id").single();
          const msg = await buildOutreach(ctx.supabase, ctx.company_id, referrer || {}, contact as any, contextText, "whatsapp");
          outreachResult = await sendOrGate(ctx.supabase, {
            companyId: ctx.company_id, leadId: newLead.id, conversationId: (conv as any).id, phone, message: msg,
            kind: "first_message", context: { referral_outreach: true, referral_source_lead_id: ctx.lead_id },
          });
          outreachDone = true;
        } else if (email) {
          const { data: refCad } = await ctx.supabase.from("cadences").select("id")
            .eq("company_id", ctx.company_id).eq("kind", "referral").eq("status", "active").limit(1).maybeSingle();
          if (!refCad) {
            // Caixa dona da conversa com o indicante (stickiness).
            let grantId: string | null = null;
            const { data: refConvs } = await ctx.supabase.from("conversations").select("id")
              .eq("lead_id", ctx.lead_id).eq("channel", "email").limit(1);
            if (refConvs?.[0]?.id) {
              const { data: lastOut } = await ctx.supabase.from("messages").select("metadata")
                .eq("conversation_id", refConvs[0].id).eq("direction", "outbound")
                .not("metadata->>grant_id", "is", null).order("sent_at", { ascending: false }).limit(1).maybeSingle();
              grantId = (lastOut as any)?.metadata?.grant_id ?? null;
            }
            await ctx.supabase.from("leads").update({ preferred_channel: "email" } as any).eq("id", newLead.id);
            const { data: conv } = await ctx.supabase.from("conversations")
              .insert({ company_id: ctx.company_id, lead_id: newLead.id, channel: "email" } as any).select("id").single();
            const msg = await buildOutreach(ctx.supabase, ctx.company_id, referrer || {}, contact as any, contextText, "email");
            const subject = `Indicação de ${referrer?.name?.split(" ")[0] || "um colega"}${referrer?.company_name ? ` (${referrer.company_name})` : ""}`;
            const gated = await shouldGate(ctx.supabase, ctx.company_id, "first_message", { lead_id: newLead.id, conversation_id: (conv as any).id });
            if (gated) {
              await createApprovalRequest(ctx.supabase, {
                company_id: ctx.company_id, lead_id: newLead.id, conversation_id: (conv as any).id,
                kind: "first_message", channel: "email", action: "send",
                payload: { message: msg, subject, email_grant_id: grantId },
                context: { referral_outreach: true, referral_source_lead_id: ctx.lead_id },
              } as any);
              outreachResult = "pending_approval";
            } else {
              const { error: se } = await ctx.supabase.functions.invoke("send-outbound-email", {
                body: {
                  to: email, subject, text: msg, html: msg.replace(/\n/g, "<br/>"),
                  lead_id: newLead.id, company_id: ctx.company_id, conversation_id: (conv as any).id,
                  email_grant_id: grantId, extra_metadata: { referral_outreach: true, referral_source_lead_id: ctx.lead_id },
                },
              });
              outreachResult = se ? `failed: ${se.message}` : "sent";
            }
            outreachDone = true;
          }
        }
      } catch (e) {
        console.error("[create_new_contact] outreach failed:", e);
        outreachResult = `failed: ${(e as Error).message}`;
      }
    }
    if (outreachResult) {
      await logActivity(ctx, "referral", `📨 Abordagem do indicado ${finalName}: ${
        outreachResult === "pending_approval" ? "aguardando em Aprovações" :
        outreachResult === "queued" ? "na fila do WhatsApp" :
        outreachResult === "sent" ? "e-mail enviado" :
        outreachResult === "protected" ? "bloqueada (Não prospectar)" : outreachResult}`, { new_lead_id: newLead.id });
    }

    // Auto-enroll na cadência de indicações ativa (kind='referral') da empresa.
    let referralEnrollmentId: string | null = null;
    if (!outreachDone) try {
      const { data: refCadence } = await ctx.supabase
        .from("cadences")
        .select("id")
        .eq("company_id", ctx.company_id)
        .eq("kind", "referral")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (refCadence?.id) {
        const { data: firstStep } = await ctx.supabase
          .from("cadence_steps")
          .select("id, delay_days")
          .eq("cadence_id", refCadence.id)
          .order("step_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        const nextAt = new Date();
        if (firstStep?.delay_days && firstStep.delay_days > 0) {
          nextAt.setDate(nextAt.getDate() + Number(firstStep.delay_days));
        }
        const { data: enr, error: enrErr } = await ctx.supabase
          .from("cadence_enrollments")
          .insert({
            cadence_id: refCadence.id,
            lead_id: newLead.id,
            company_id: ctx.company_id,
            status: "active",
            current_step: 1,
            next_execution_at: nextAt.toISOString(),
          } as any)
          .select("id")
          .single();
        if (enrErr) {
          console.error("[create_new_contact] enroll referral cadence failed:", enrErr);
        } else {
          referralEnrollmentId = enr?.id ?? null;
        }
      }
    } catch (e) {
      console.error("[create_new_contact] referral enrollment exception:", e);
    }

    const referrerLabel = referrer?.name
      ? `${referrer.name}${referrer?.company_name ? ` (${referrer.company_name})` : ""}`
      : "(indicante sem nome)";
    await logActivity(
      ctx,
      "note",
      `🆕 Novo contato criado por indicação — Indicado por ${referrerLabel}: ${finalName}${email ? ` <${email}>` : ""}${referralEnrollmentId ? " — inscrito na cadência de indicações" : ""}`,
      {
        new_lead_id: newLead.id,
        referral_enrollment_id: referralEnrollmentId,
        referrer_name: referrer?.name ?? null,
        referrer_company: referrer?.company_name ?? null,
        inherited_company_name: !company_name && !!referrer?.company_name,
        inherited_website: !website && !!referrer?.website,
        inherited_address: !address && !!referrer?.address,
      },
    );
    return { new_lead_id: newLead.id, name: finalName, referrer_name: referrer?.name ?? null, referral_enrollment_id: referralEnrollmentId };
  },

  async mark_current_contact_as_referrer(ctx) {
    await ctx.supabase
      .from("leads")
      .update({
        referral_stage: "is_referrer",
        referral_permission_to_mention: ctx.params.permission_to_mention ?? true,
        status: "qualified" as any,
      } as any)
      .eq("id", ctx.lead_id);
    await logActivity(ctx, "note", `🔁 Marcado como indicante`);
    return { ok: true };
  },

  async create_call_task(ctx) {
    await ctx.supabase
      .from("leads")
      .update({ call_requested_at: new Date().toISOString(), preferred_channel: "phone" } as any)
      .eq("id", ctx.lead_id);
    await logActivity(ctx, "note", `📞 Ligação solicitada${ctx.params.preferred_time ? ` (preferência: ${ctx.params.preferred_time})` : ""}`,
      { preferred_time: ctx.params.preferred_time });
    return { call_task: true };
  },

  async send_material(ctx) {
    const query = String(ctx.params.material_query || ctx.params.topic || "").trim();
    let material: any = null;
    if (query) {
      const { data } = await ctx.supabase
        .from("company_knowledge")
        .select("title, content, source_url, file_path")
        .eq("company_id", ctx.company_id)
        .not("type", "in", "(highlights,ai_instructions)")
        .ilike("title", `%${query}%`)
        .limit(1)
        .maybeSingle();
      material = data;
    }
    if (!material) {
      const { data } = await ctx.supabase
        .from("company_knowledge")
        .select("title, content, source_url, file_path")
        .eq("company_id", ctx.company_id)
        .not("type", "in", "(highlights,ai_instructions)")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      material = data;
    }
    if (!material) {
      await logActivity(ctx, "note", `📎 Tentou enviar material mas não há conteúdo na base`);
      return { skipped: "no material in knowledge base" };
    }
    const lead = await loadLead(ctx);
    const link = material.source_url || (material.file_path ? `(arquivo: ${material.file_path})` : null);
    const message = `Oi ${lead?.name?.split(" ")[0] || ""}, segue o material sobre **${material.title}**:\n\n${
      (material.content || "").substring(0, 600)
    }${link ? `\n\nMais detalhes: ${link}` : ""}`;
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, message, `Material: ${material.title}`, channel, { action: "send_material", material_title: material.title });
    await logActivity(ctx, "note", `📎 Material enviado: ${material.title}`);
    return { sent: true, material_title: material.title };
  },

  async recover_no_show(ctx) {
    const reply = await generateReply(ctx, {
      tone: "reagendamento gentil após no-show — sem culpabilizar, oferecer 2 novos horários",
      category: "scheduling",
      sub_intent: "no_show_recovery",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "recover_no_show" });
    await logActivity(ctx, "note", `🔄 Mensagem de recuperação de no-show enviada`);
    return { sent: true };
  },

  /* ─── Cal.com scheduling handlers ─────────────────────────────────── */
  async fetch_existing_booking(ctx) {
    const lead = await loadLead(ctx);
    const { data, error } = await ctx.supabase.functions.invoke("calcom-booking-fetch", {
      body: { lead_id: ctx.lead_id, email: lead?.email },
    });
    if (error) throw new Error(error.message);
    await logActivity(ctx, "note", `🔍 Reservas existentes consultadas (${(data as any)?.bookings?.length || 0})`);
    return data;
  },

  async reschedule_booking(ctx) {
    const { booking_uid, start, reason } = ctx.params;
    if (!booking_uid) await assertSubIntentAllowed(ctx, "reschedule_booking");
    let uid = booking_uid as string | undefined;
    if (!uid) {
      const { data: existing } = await ctx.supabase
        .from("bookings").select("calcom_booking_uid")
        .eq("lead_id", ctx.lead_id).in("status", ["confirmed", "pending", "rescheduled"])
        .order("scheduled_at", { ascending: false }).limit(1).maybeSingle();
      uid = existing?.calcom_booking_uid;
    }
    if (!uid || !start) throw new Error("reschedule_booking requer booking_uid e start");
    const { data, error } = await ctx.supabase.functions.invoke("calcom-booking-reschedule", {
      body: { booking_uid: uid, start, reason, lead_id: ctx.lead_id },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async cancel_booking(ctx) {
    const { booking_uid, reason, source } = ctx.params;
    if (!booking_uid) await assertSubIntentAllowed(ctx, "cancel_booking");
    let uid = booking_uid as string | undefined;
    if (!uid) {
      const { data: existing } = await ctx.supabase
        .from("bookings").select("calcom_booking_uid")
        .eq("lead_id", ctx.lead_id).in("status", ["confirmed", "pending", "rescheduled"])
        .order("scheduled_at", { ascending: false }).limit(1).maybeSingle();
      uid = existing?.calcom_booking_uid;
    }
    if (!uid) throw new Error("cancel_booking: nenhuma reserva ativa encontrada");
    // Marcar origem ANTES de invocar Cal.com para que o webhook BOOKING_CANCELLED
    // consiga identificar que o cancelamento foi iniciado internamente (SDR/humano)
    // e não dispare um acknowledge_cancellation redundante.
    const stampedSource = typeof source === "string" && source.length > 0 ? source : "sdr";
    try {
      await ctx.supabase
        .from("bookings")
        .update({
          cancellation_source: stampedSource,
          cancellation_requested_at: new Date().toISOString(),
        })
        .eq("calcom_booking_uid", uid);
    } catch (_) { /* best effort */ }
    const { data, error } = await ctx.supabase.functions.invoke("calcom-booking-cancel", {
      body: { booking_uid: uid, reason },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async ask_cancel_reason(ctx) {
    const reply = await generateReply(ctx, {
      tone: "pergunte com empatia o motivo do cancelamento, sem ser invasivo",
      category: "scheduling", sub_intent: "cancel_request",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "ask_cancel_reason" });
    await logActivity(ctx, "note", `❓ Motivo do cancelamento solicitado`);
    return { sent: true };
  },

  async offer_reschedule_instead(ctx) {
    const reply = await generateReply(ctx, {
      tone: "ofereça remarcar para um novo horário antes de cancelar definitivamente; sugira 2 horários",
      category: "scheduling", sub_intent: "offer_reschedule",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "offer_reschedule_instead" });
    await logActivity(ctx, "note", `🔄 Oferta de remarcação enviada`);
    return { sent: true };
  },

  async acknowledge_cancellation(ctx) {
    const { booking_uid } = ctx.params;
    let whenLabel = "";

    // Guard 0: já reconhecemos um cancelamento para este lead nas últimas 24h?
    // Evita rajada quando reschedule + cancel real disparam dois acks.
    try {
      const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data: prevAck } = await ctx.supabase
        .from("lead_action_queue")
        .select("id, params, executed_at, result")
        .eq("lead_id", ctx.lead_id)
        .eq("action_type", "acknowledge_cancellation")
        .eq("status", "done")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5);
      const alreadySent = (prevAck || []).some((row: any) => {
        // Conta apenas envios efetivos (não skipped).
        return row?.result?.sent === true;
      });
      if (alreadySent) {
        await logActivity(ctx, "note", `↩️ acknowledge_cancellation ignorado (já reconhecido nas últimas 24h)`, { booking_uid });
        return { skipped: true, reason: "already_acknowledged_24h" };
      }
    } catch (_) { /* best effort */ }

    // Safety net: se o cancelamento foi iniciado por nós (SDR/humano/sistema)
    // ou se o SDR já enviou alguma resposta outbound nos últimos 10 min, não
    // mandar o acknowledge — o lead já foi atendido conversacionalmente.
    if (booking_uid) {
      const { data: bk } = await ctx.supabase
        .from("bookings")
        .select("cancellation_source, cancellation_requested_at, scheduled_at")
        .eq("calcom_booking_uid", booking_uid)
        .maybeSingle();
      if (bk?.cancellation_source && bk.cancellation_source !== "lead") {
        await logActivity(ctx, "note", `↩️ acknowledge_cancellation ignorado (cancelamento iniciado por ${bk.cancellation_source})`, { booking_uid });
        return { skipped: true, reason: `cancellation_source=${bk.cancellation_source}` };
      }
      if (bk?.scheduled_at) {
        whenLabel = new Date(bk.scheduled_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      }
    }
    // Defesa em profundidade: se SDR já mandou outbound recente nesta conversa
    // (dentro de 10 min antes do disparo do acknowledge), assumir que já cobriu.
    try {
      const { data: conv } = await ctx.supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", ctx.lead_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (conv?.id) {
        const since = new Date(Date.now() - 10 * 60_000).toISOString();
        const { data: recent } = await ctx.supabase
          .from("messages")
          .select("id, sent_at, metadata")
          .eq("conversation_id", conv.id)
          .eq("direction", "outbound")
          .gte("sent_at", since)
          .order("sent_at", { ascending: false })
          .limit(5);
        const coveredByRecent = (recent || []).some((m: any) => {
          const act = m?.metadata?.action;
          return act === "cancel_booking" || act === "send_reply";
        });
        if (coveredByRecent) {
          await logActivity(ctx, "note", `↩️ acknowledge_cancellation ignorado (SDR já respondeu nos últimos 10 min)`, { booking_uid });
          return { skipped: true, reason: "already_acknowledged_in_chat" };
        }
      }
    } catch (_) { /* best effort */ }
    const reply = await generateReply(ctx, {
      tone: `O lead acabou de cancelar nossa reunião${whenLabel ? ` de ${whenLabel}` : ""} pelo link do Cal.com. Reconheça com empatia ("vi aqui que você cancelou", "imagino que algo tenha surgido", sem cobrança), e pergunte se ele gostaria de remarcar — sem propor horários ainda, apenas abrindo a porta para retomar a conversa. Tom natural e curto.`,
      category: "scheduling", sub_intent: "cancellation_followup",
    });
    const channel = await loadConversationChannel(ctx);
    const out = await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "acknowledge_cancellation", booking_uid });
    if (!out?.sent) {
      throw new Error(`acknowledge_cancellation: envio falhou (${out?.reason || out?.error || "sem motivo"})`);
    }
    await logActivity(ctx, "meeting", `🔄 Lead cancelou via Cal.com — follow-up de retomada enviado`, { booking_uid, channel });
    return { sent: true, channel, delivery_status: out.delivery_status };
  },


  async send_booking_confirmation(ctx) {
    const { booking_uid, rescheduled } = ctx.params;
    const { data: booking } = await ctx.supabase.from("bookings").select("*").eq("calcom_booking_uid", booking_uid).maybeSingle();
    if (!booking) throw new Error("booking não encontrado");

    // Guard 1: booking não está mais ativo (foi cancelado/remarcado/no-show).
    const inactiveStatuses = new Set(["cancelled", "rescheduled", "no_show"]);
    if (booking.status && inactiveStatuses.has(booking.status)) {
      await logActivity(ctx, "note", `↩️ send_booking_confirmation ignorado (status=${booking.status})`, { booking_uid });
      return { skipped: true, reason: `status=${booking.status}` };
    }

    // Guard 2: existe outra reserva mais recente ativa para o mesmo lead.
    const { data: newer } = await ctx.supabase
      .from("bookings")
      .select("id, calcom_booking_uid, scheduled_at, status")
      .eq("lead_id", ctx.lead_id)
      .in("status", ["confirmed", "pending"])
      .neq("calcom_booking_uid", booking_uid)
      .gt("created_at", booking.created_at)
      .limit(1)
      .maybeSingle();
    if (newer) {
      await logActivity(ctx, "note", `↩️ send_booking_confirmation ignorado (superseded por ${newer.calcom_booking_uid})`, { booking_uid });
      return { skipped: true, reason: "superseded_by_newer_booking" };
    }

    // Guard 3: idempotência local — já mandamos confirmação para este uid
    // (ou qualquer confirmação nos últimos 10 min)?
    try {
      const { data: conv } = await ctx.supabase
        .from("conversations").select("id").eq("lead_id", ctx.lead_id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (conv?.id) {
        const since = new Date(Date.now() - 10 * 60_000).toISOString();
        const { data: recent } = await ctx.supabase
          .from("messages")
          .select("id, sent_at, metadata")
          .eq("conversation_id", conv.id)
          .eq("direction", "outbound")
          .gte("sent_at", since)
          .order("sent_at", { ascending: false })
          .limit(10);
        const dup = (recent || []).some((m: any) => {
          const act = m?.metadata?.action;
          const uid = m?.metadata?.booking_uid;
          if (act === "send_booking_confirmation" && uid === booking_uid) return true;
          // SDR já respondeu sincronamente confirmando esta reserva
          if (uid === booking_uid && (act === "book" || act === "reschedule" || act === "send_reply")) return true;
          return false;
        });
        if (dup) {
          await logActivity(ctx, "note", `↩️ send_booking_confirmation ignorado (já enviado nos últimos 10 min)`, { booking_uid });
          return { skipped: true, reason: "already_sent_recently" };
        }
      }
    } catch (_) { /* best effort */ }

    const when = booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "horário a confirmar";
    const lead = await loadLead(ctx);
    const verb = rescheduled ? "remarcada" : "confirmada";
    const link = booking.meeting_url ? `\n\nLink: ${booking.meeting_url}` : "";
    const message = `Oi ${lead?.name?.split(" ")[0] || ""}, sua reunião foi ${verb} para **${when}** (horário de Brasília).${link}\n\nNos vemos lá!`;
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, message, `Reunião ${verb}`, channel, { action: "send_booking_confirmation", booking_uid });
    await logActivity(ctx, "meeting", `✉️ Confirmação enviada para ${when}`);
    return { sent: true };
  },

  async offer_event_types(ctx) {
    const { data: types } = await ctx.supabase
      .from("calcom_event_types").select("title, length_minutes, slug, calcom_id")
      .eq("company_id", ctx.company_id).eq("active", true).limit(5);
    if (!types || !types.length) {
      await logActivity(ctx, "note", `⚠️ Nenhum tipo de evento ativo para oferecer`);
      return { skipped: "no event types" };
    }
    const list = types.map((t: any) => `• **${t.title}** (${t.length_minutes || "?"} min)`).join("\n");
    const reply = await generateReply(ctx, {
      tone: `apresente os tipos de reunião disponíveis e pergunte qual encaixa melhor:\n${list}`,
      category: "scheduling", sub_intent: "event_type_question",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "offer_event_types", types });
    await logActivity(ctx, "note", `📋 ${types.length} tipos de reunião oferecidos`);
    return { sent: true, types };
  },

  async collect_booking_info(ctx) {
    const missing = ctx.params.missing_fields || ["nome completo", "e-mail", "fuso horário"];
    const reply = await generateReply(ctx, {
      tone: `peça gentilmente: ${(missing as string[]).join(", ")} para confirmar o agendamento`,
      category: "scheduling", sub_intent: "collect_info",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "collect_booking_info", missing });
    await logActivity(ctx, "note", `📋 Coletando dados de agendamento: ${(missing as string[]).join(", ")}`);
    return { sent: true };
  },

  async detect_timezone(ctx) {
    const reply = await generateReply(ctx, {
      tone: "pergunte de qual cidade/fuso horário a pessoa está, de forma natural",
      category: "scheduling", sub_intent: "timezone_question",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? null, channel, { action: "detect_timezone" });
    await logActivity(ctx, "note", `🌍 Pergunta de fuso horário enviada`);
    return { sent: true };
  },

  async send_meeting_recap(ctx) {
    const { booking_uid } = ctx.params;
    const reply = await generateReply(ctx, {
      tone: "envie um resumo curto da reunião, agradecendo e listando os próximos passos acordados",
      category: "scheduling", sub_intent: "meeting_recap",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? "Resumo da nossa reunião", channel, { action: "send_meeting_recap", booking_uid });
    await logActivity(ctx, "note", `📝 Recap de reunião enviado`);
    return { sent: true };
  },

  async request_feedback(ctx) {
    const { booking_uid } = ctx.params;
    const reply = await generateReply(ctx, {
      tone: "peça feedback rápido (1-5) sobre a reunião e o que pode melhorar",
      category: "scheduling", sub_intent: "feedback_request",
    });
    const channel = await loadConversationChannel(ctx);
    await sendOutbound(ctx, reply.body, reply.subject ?? "Como foi nossa conversa?", channel, { action: "request_feedback", booking_uid });
    await logActivity(ctx, "note", `⭐ Feedback solicitado`);
    return { sent: true };
  },

  async mark_meeting_attended(ctx) {
    const { booking_uid, attended } = ctx.params;
    if (!booking_uid) await assertSubIntentAllowed(ctx, "mark_meeting_attended");
    const { data: booking } = await ctx.supabase.from("bookings").select("id").eq("calcom_booking_uid", booking_uid).maybeSingle();
    if (!booking) throw new Error("booking não encontrado");
    await ctx.supabase.from("bookings").update({ status: attended === false ? "no_show" : "completed" }).eq("id", booking.id);
    await logActivity(ctx, "meeting", attended === false ? `❌ No-show registrado` : `✅ Presença confirmada`);
    return { ok: true };
  },
};

/* ─── Server ─────────────────────────────────────────────────────────── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    let actionRow: any = null;

    if (body.action_id) {
      const { data, error } = await supabase
        .from("lead_action_queue")
        .select("*")
        .eq("id", body.action_id)
        .maybeSingle();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "ação não encontrada" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      actionRow = data;
    } else {
      actionRow = {
        id: null,
        company_id: body.company_id,
        lead_id: body.lead_id,
        conversation_id: body.conversation_id || null,
        intent_log_id: body.intent_log_id || null,
        action_type: body.action_type,
        params: body.params || {},
        attempts: 0,
      };
    }

    if (!actionRow.company_id || !actionRow.lead_id || !actionRow.action_type) {
      return new Response(JSON.stringify({ error: "company_id, lead_id e action_type são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: se a ação foi enfileirada sem conversation_id, tente recuperar
    // a conversa mais recente do lead. Sem isso, sendOutbound não envia nada.
    let resolvedConversationId: string | null = actionRow.conversation_id || null;
    if (!resolvedConversationId) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", actionRow.lead_id)
        .eq("company_id", actionRow.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (conv?.id) {
        resolvedConversationId = conv.id as string;
      } else {
        // Cria conversa nova usando o canal preferido do lead (whatsapp por padrão)
        const { data: lead } = await supabase
          .from("leads")
          .select("preferred_channel, whatsapp, phone, email")
          .eq("id", actionRow.lead_id)
          .maybeSingle();
        const channel = (lead as any)?.preferred_channel
          || ((lead as any)?.whatsapp || (lead as any)?.phone ? "whatsapp" : "email");
        const { data: created } = await supabase
          .from("conversations")
          .insert({ lead_id: actionRow.lead_id, company_id: actionRow.company_id, channel })
          .select("id")
          .single();
        resolvedConversationId = created?.id || null;
      }
    }

    const ctx: ActionContext = {
      supabase,
      company_id: actionRow.company_id,
      lead_id: actionRow.lead_id,
      conversation_id: resolvedConversationId,
      intent_log_id: actionRow.intent_log_id,
      params: actionRow.params || {},
    };

    let result: any = null;
    let error: string | null = null;
    const handler = HANDLERS[actionRow.action_type as string];

    if (!handler) {
      error = `action_type desconhecido: ${actionRow.action_type}`;
    } else {
      try {
        result = await handler(ctx);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        console.error(`execute-action[${actionRow.action_type}] error:`, e);
      }
    }

    if (actionRow.id) {
      await supabase.from("lead_action_queue").update({
        status: error ? "failed" : "done",
        executed_at: new Date().toISOString(),
        attempts: (actionRow.attempts || 0) + 1,
        result,
        error,
      }).eq("id", actionRow.id);
    }

    return new Response(JSON.stringify({ ok: !error, action_type: actionRow.action_type, result, error }), {
      status: error ? 500 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("execute-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
