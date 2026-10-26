import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApprovalRow {
  id: string;
  company_id: string;
  lead_id: string | null;
  conversation_id: string | null;
  enrollment_id: string | null;
  cadence_id: string | null;
  kind: "first_message" | "sdr_reply" | "cadence_step" | "sensitive_action";
  channel: string | null;
  action: string;
  payload: Record<string, any>;
  edited_payload: Record<string, any> | null;
  context: Record<string, any>;
  status: "pending" | "queued" | "approved" | "rejected" | "edited_sent" | "expired" | "failed";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  queued_at: string | null;
  executed_at: string | null;
  execution_error: string | null;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalFilters {
  page?: number; // 1-based
  pageSize?: number;
  statusFilter?: string; // "all" | status value
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
}

export function useApprovals(
  status: "pending" | "all" = "pending",
  batchId?: string | null,
  filters: ApprovalFilters = {},
) {
  const qc = useQueryClient();
  const { page = 1, pageSize = 50, statusFilter = "all", from, to } = filters;
  const query = useQuery({
    queryKey: ["approvals", status, batchId || null, page, pageSize, statusFilter, from || null, to || null],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const start = (page - 1) * pageSize;
      let q = supabase
        .from("approval_requests")
        .select("*, leads(id, name, email, company_name, lead_list_id), cadences(id, name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(start, start + pageSize - 1);
      if (status === "pending") q = q.eq("status", "pending");
      else if (statusFilter !== "all" && statusFilter !== "pending") q = q.eq("status", statusFilter as any);
      else q = q.not("status", "in", "(pending,queued)");
      if (batchId) q = q.eq("batch_id", batchId);
      if (from) q = q.gte("created_at", new Date(`${from}T00:00:00`).toISOString());
      if (to) q = q.lte("created_at", new Date(`${to}T23:59:59.999`).toISOString());
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data || []) as any[], total: count ?? 0 };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("approval_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approval_requests" },
        () => {
          qc.invalidateQueries({ queryKey: ["approvals"] });
          qc.invalidateQueries({ queryKey: ["approvals-count"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useBulkApprovalExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      approval_ids: string[];
      action: "approve" | "reject";
      rejection_reason?: string;
      note?: string;
      throttle_ms?: number;
    }) => {
      const delay = Math.max(0, input.throttle_ms ?? 200);
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (let i = 0; i < input.approval_ids.length; i++) {
        const id = input.approval_ids[i];
        try {
          const { data, error } = await supabase.functions.invoke("approval-execute", {
            body: {
              approval_id: id,
              action: input.action,
              rejection_reason: input.action === "reject" ? input.rejection_reason : undefined,
              note: input.note,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          results.push({ id, ok: true });
        } catch (e: any) {
          results.push({ id, ok: false, error: e?.message || String(e) });
        }
        if (i < input.approval_ids.length - 1 && delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      return results;
    },
    onSuccess: (results, vars) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["approvals-count"] });
      qc.invalidateQueries({ queryKey: ["lead-lists"] });
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      const verb = vars.action === "approve" ? "aprovadas" : "rejeitadas";
      const suffix = vars.action === "approve"
        ? " — envios de WhatsApp distribuídos ao longo dos próximos minutos (anti-spam)"
        : "";
      if (fail === 0) toast.success(`${ok} ${verb}${suffix}`);
      else toast.error(`${ok} ${verb}, ${fail} com erro`);
    },
    onError: (e: any) => toast.error(e?.message || "Falha no processamento em lote"),
  });
}

export function usePendingApprovalsCount() {
  return useQuery({
    queryKey: ["approvals-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("approval_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });
}

export function useApprovalExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      approval_id: string;
      action: "approve" | "reject";
      edited_payload?: Record<string, any>;
      rejection_reason?: string;
      note?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("approval-execute", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["approvals-count"] });
      toast.success(vars.action === "approve" ? "Aprovação enviada" : "Aprovação rejeitada");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Falha ao processar aprovação");
    },
  });
}

export function useHitlSettings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["hitl-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: member } = await supabase
        .from("company_members").select("company_id").eq("user_id", user.id).maybeSingle();
      if (!member) return null;
      const { data: company, error } = await supabase
        .from("companies").select("id, hitl_enabled, hitl_scopes")
        .eq("id", member.company_id).maybeSingle();
      if (error) throw error;
      return company;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: { hitl_enabled?: boolean; hitl_scopes?: Record<string, boolean> }) => {
      const companyId = query.data?.id;
      if (!companyId) throw new Error("sem empresa");
      const { data, error } = await supabase
        .from("companies")
        .update(patch)
        .eq("id", companyId)
        .select("id, hitl_enabled, hitl_scopes")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Você não tem permissão para alterar estas preferências");
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["hitl-settings"], data);
      qc.invalidateQueries({ queryKey: ["hitl-settings"] });
      toast.success("Preferências salvas");
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao salvar"),
  });

  return { ...query, update };
}
