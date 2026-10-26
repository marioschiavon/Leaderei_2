import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, CheckCircle2, XCircle, Loader2, AlertCircle, Mail, MessageSquare, Linkedin, NotebookPen, X } from "lucide-react";
import { useApprovals, useApprovalExecute, useBulkApprovalExecute, type ApprovalRow } from "@/hooks/useApprovals";
import { WhatsAppQueueBadge } from "@/components/WhatsAppQueueBadge";
import { useLeadLists } from "@/hooks/useLeadLists";
import { formatDistanceToNow, format } from "date-fns";
import { TablePagination } from "@/components/TablePagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ptBR } from "date-fns/locale";


const kindLabel: Record<string, string> = {
  first_message: "Primeira mensagem",
  sdr_reply: "Resposta SDR",
  cadence_step: "Passo de cadência",
  sensitive_action: "Ação sensível",
};

const channelIcon = (ch: string | null) => {
  if (ch === "email") return <Mail className="h-3 w-3" />;
  if (ch === "whatsapp") return <MessageSquare className="h-3 w-3" />;
  if (ch === "linkedin") return <Linkedin className="h-3 w-3" />;
  return null;
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const batchId = params.get("batch");
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => { setPage(1); }, [tab, batchId, statusFilter, from, to, pageSize]);
  const { data, isLoading } = useApprovals(tab, batchId, { page, pageSize, statusFilter, from, to });
  const approvals = data?.rows ?? [];
  const total = data?.total ?? 0;
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  const setRange = (days: number | "month" | null) => {
    const now = new Date();
    if (days === null) { setFrom(""); setTo(""); return; }
    if (days === "month") { setFrom(fmt(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(fmt(now)); return; }
    setFrom(fmt(new Date(now.getTime() - (days - 1) * 86400000))); setTo(fmt(now));
  };
  const { data: lists = [] } = useLeadLists();
  const activeList = useMemo(() => lists.find((l) => l.id === batchId), [lists, batchId]);
  const execute = useApprovalExecute();
  const bulk = useBulkApprovalExecute();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const selected = useMemo(
    () => approvals.find((a: any) => a.id === selectedId) as any | undefined,
    [approvals, selectedId],
  );

  useEffect(() => {
    if (!selectedId && approvals.length > 0) setSelectedId(approvals[0].id);
  }, [approvals, selectedId]);

  // Clear selection if batch/tab changes
  useEffect(() => { setChecked(new Set()); }, [batchId, tab]);

  const pendingIds = useMemo(
    () => approvals.filter((a: any) => a.status === "pending").map((a: any) => a.id),
    [approvals],
  );
  const allChecked = checked.size > 0 && pendingIds.every((id) => checked.has(id));
  const someChecked = checked.size > 0;

  const toggleOne = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(pendingIds));
  };

  const clearBatch = () => {
    const p = new URLSearchParams(params); p.delete("batch"); setParams(p, { replace: true });
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Aprovações
          </h1>
          <p className="text-sm text-muted-foreground">
            Revise, edite e aprove cada ação da IA antes que ela seja executada.
          </p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="all">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <WhatsAppQueueBadge />

      {activeList && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Lote:</span>
          <Badge variant="secondary" className="gap-1">
            {activeList.name}
            <button onClick={clearBatch} className="ml-1 rounded hover:bg-muted-foreground/20" aria-label="Limpar filtro">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {tab === "pending" && pendingIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-2 px-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            <span className="text-sm">
              {someChecked ? `${checked.size} selecionada${checked.size > 1 ? "s" : ""}` : `Selecionar tudo (${pendingIds.length})`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!someChecked || bulk.isPending}
              onClick={() => {
                const reason = prompt(
                  `Motivo da rejeição para ${checked.size} aprovação(ões)? (será registrado nas Anotações)`,
                  "Rejeitado em lote",
                );
                if (reason === null) return;
                const trimmed = reason.trim() || "Rejeitado em lote";
                bulk.mutate(
                  { approval_ids: Array.from(checked), action: "reject", rejection_reason: trimmed, note: trimmed },
                  { onSuccess: () => setChecked(new Set()) },
                );
              }}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Rejeitar
            </Button>
            <Button
              size="sm"
              disabled={!someChecked || bulk.isPending}
              onClick={() => {
                if (confirm(`Aprovar e enviar ${checked.size} mensagem(ns)? Será aplicado throttle de 1.5s entre envios.`)) {
                  bulk.mutate(
                    { approval_ids: Array.from(checked), action: "approve" },
                    { onSuccess: () => setChecked(new Set()) },
                  );
                }
              }}
            >
              {bulk.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Aprovar e enviar
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              {tab === "pending" ? "Fila" : "Todos"} ({approvals.length})
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="divide-y">
              {isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando...</p>}
              {!isLoading && approvals.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma aprovação {tab === "pending" ? "pendente" : "no histórico"}.
                </p>
              )}
              {approvals.map((a: any) => {
                const leadName = a.leads?.name || a.leads?.company_name || "Lead sem nome";
                const preview = (a.payload?.subject || a.payload?.message || a.payload?.body || "").toString().slice(0, 80);
                const isActive = selectedId === a.id;
                const isPending = a.status === "pending";
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-2 p-3 hover:bg-muted/50 transition ${isActive ? "bg-muted" : ""}`}
                  >
                    {isPending && (
                      <Checkbox
                        className="mt-1"
                        checked={checked.has(a.id)}
                        onCheckedChange={() => toggleOne(a.id)}
                      />
                    )}
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{leadName}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {channelIcon(a.channel)}
                          {kindLabel[a.kind] || a.kind}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
                        </span>
                        {a.status === "pending" && Date.now() - new Date(a.created_at).getTime() > 7 * 86400000 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px]"
                            title={a.context?.recovered
                              ? "Aprovada antes, mas não foi enviada. Revise se ainda faz sentido enviar."
                              : "Gerada há mais de 7 dias. Revise se ainda faz sentido enviar."}
                          >
                            Antiga
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{preview}</p>
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>


        {selected ? (
          <ApprovalDetail
            approval={selected}
            disabled={execute.isPending || selected.status !== "pending"}
            onApprove={(edited, note) =>
              execute.mutate({
                approval_id: selected.id,
                action: "approve",
                edited_payload: edited,
                note,
              })
            }
            onReject={(reason, note) =>
              execute.mutate(
                {
                  approval_id: selected.id,
                  action: "reject",
                  rejection_reason: reason,
                  note,
                },
                {
                  onSuccess: (data: any) => {
                    const convId = data?.conversation_id || selected.conversation_id;
                    if (convId) navigate(`/inbox?conversation=${convId}`);
                  },
                },
              )
            }

            pending={execute.isPending}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Selecione uma aprovação na lista.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-amber-100 text-amber-800" },
    queued: { label: "Na fila", cls: "bg-indigo-100 text-indigo-800" },
    approved: { label: "Enviado", cls: "bg-green-100 text-green-800" },
    edited_sent: { label: "Editado", cls: "bg-blue-100 text-blue-800" },
    rejected: { label: "Rejeitado", cls: "bg-red-100 text-red-800" },
    failed: { label: "Falhou", cls: "bg-red-100 text-red-800" },
    expired: { label: "Expirado", cls: "bg-gray-100 text-gray-700" },
  };
  const m = map[status] || { label: status, cls: "bg-muted" };
  return <Badge className={`text-[10px] ${m.cls}`} variant="secondary">{m.label}</Badge>;
}

function ApprovalDetail({
  approval,
  disabled,
  pending,
  onApprove,
  onReject,
}: {
  approval: ApprovalRow & { leads?: any; cadences?: any };
  disabled: boolean;
  pending: boolean;
  onApprove: (edited?: Record<string, any>, note?: string) => void;
  onReject: (reason: string, note?: string) => void;
}) {
  const initial = (approval.edited_payload as any) || approval.payload || {};
  const [subject, setSubject] = useState<string>(initial.subject ?? "");
  const [message, setMessage] = useState<string>(initial.message ?? initial.body ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const p: any = approval.edited_payload || approval.payload || {};
    setSubject(p.subject ?? "");
    setMessage(p.message ?? p.body ?? "");
    setRejectReason("");
    setNote("");
  }, [approval.id]);

  const edited =
    subject !== (initial.subject ?? "") ||
    message !== (initial.message ?? initial.body ?? "");

  const leadName = approval.leads?.name || approval.leads?.company_name || "Lead";
  const ctx = approval.context || {};

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{leadName}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="gap-1">
                {channelIcon(approval.channel)}
                {kindLabel[approval.kind] || approval.kind}
              </Badge>
              {approval.cadences?.name && (
                <Badge variant="outline">Cadência: {approval.cadences.name}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {approval.leads?.email}
              </span>
            </div>
          </div>
          <StatusBadge status={approval.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {ctx.tool_failure && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
            <div className="font-semibold text-destructive mb-1">
              ⚠️ Falha na ferramenta `{ctx.tool_failure.tool}` — revise com cuidado
            </div>
            <p className="text-destructive/90">
              A IA tentou executar <strong>{ctx.tool_failure.tool}</strong> mas a ação falhou
              ({String(ctx.tool_failure.error || "erro desconhecido")}). A mensagem abaixo é apenas uma resposta de contingência —
              confirme se ela representa fielmente o que aconteceu antes de aprovar.
            </p>
          </div>
        )}
        {ctx.rationale && (
          <div className="rounded-md border border-dashed border-amber-200 bg-amber-50 p-3 text-xs">
            <div className="font-medium text-amber-900 mb-1">Justificativa da IA</div>
            <p className="text-amber-900/80 italic">"{ctx.rationale}"</p>
            {ctx.intent && <p className="mt-1 text-amber-900/70">Intent: {ctx.intent}</p>}
          </div>
        )}

        {approval.channel === "email" && (
          <div>
            <Label className="text-xs">Assunto</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={disabled}
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Mensagem</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
            rows={Math.min(20, Math.max(6, message.split("\n").length + 2))}
            className="mt-1 font-mono text-sm"
          />
        </div>

        {approval.status === "pending" && (
          <>
            <div className="pt-2 border-t">
              <Label className="text-xs flex items-center gap-1">
                <NotebookPen className="h-3 w-3" />
                Anotação (opcional — fica salva em /annotations para treinar a IA)
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: tom muito formal, faltou personalização, prospect já respondeu antes..."
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() =>
                  onApprove(edited ? { subject, message } : undefined, note.trim() || undefined)
                }
                disabled={pending || !message.trim()}
              >
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {edited ? "Editar e enviar" : "Aprovar e enviar"}
              </Button>
            </div>
            <div className="pt-3 border-t space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Rejeitar (motivo opcional)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: tom inadequado, dados errados..."
                />
                <Button
                  variant="destructive"
                  onClick={() => onReject(rejectReason, note.trim() || undefined)}
                  disabled={pending}
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          </>
        )}

        {approval.status !== "pending" && approval.execution_error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-700 mt-0.5" />
            <div>
              <div className="font-medium text-red-900">Erro de execução</div>
              <p className="text-red-900/80">{approval.execution_error}</p>
            </div>
          </div>
        )}
        {approval.status === "rejected" && approval.rejection_reason && (
          <div className="text-xs text-muted-foreground">
            Motivo: <span className="italic">{approval.rejection_reason}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
