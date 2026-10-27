import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ExternalLink, Loader2, Plug, RefreshCw, RotateCcw, Unplug } from "lucide-react";
import { useIntegration, useConnectPipedrive, useDisconnectPipedrive, useSyncLeads } from "@/hooks/usePipedrive";
import {
  PIPEDRIVE_LEAD_FIELDS,
  useDiscoverPipedrive,
  usePipedriveQueue,
  useRetryPipedriveFailed,
  useSavePipedrivePushConfig,
  type PipedriveFieldTarget,
  type PipedrivePushConfig,
} from "@/hooks/usePipedrivePush";
import { PipedriveInboundTab } from "@/components/PipedriveInboundTab";

const NONE = "__none__";

export function PipedriveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [apiToken, setApiToken] = useState("");
  const { data: integration } = useIntegration("pipedrive");
  const connect = useConnectPipedrive();
  const disconnect = useDisconnectPipedrive();
  const sync = useSyncLeads();
  const save = useSavePipedrivePushConfig();
  const retry = useRetryPipedriveFailed();
  const connected = integration?.status === "active";
  const saved = ((integration as any)?.config ?? {}) as PipedrivePushConfig;

  const [enabled, setEnabled] = useState(false);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [stages, setStages] = useState<Record<string, string | null>>({});
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [fieldMap, setFieldMap] = useState<Record<string, PipedriveFieldTarget>>({});

  useEffect(() => {
    if (!open) return;
    setEnabled(saved.push_enabled === true);
    setPipelineId(saved.pipeline_id ? String(saved.pipeline_id) : null);
    setStages({
      stage_created: saved.stage_created ? String(saved.stage_created) : null,
      stage_replied: saved.stage_replied ? String(saved.stage_replied) : null,
      stage_meeting: saved.stage_meeting ? String(saved.stage_meeting) : null,
      stage_handoff: saved.stage_handoff ? String(saved.stage_handoff) : null,
    });
    setOwnerId(saved.owner_id ? String(saved.owner_id) : null);
    setFieldMap(saved.field_map ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, integration?.id]);

  const discover = useDiscoverPipedrive(open && connected);
  const queue = usePipedriveQueue(open && connected);
  const d = discover.data;
  const pipelineStages = useMemo(
    () => (d?.stages ?? []).filter((s) => s.pipeline_id === pipelineId).sort((a, b) => a.order - b.order),
    [d, pipelineId],
  );
  const canSave = !enabled || (!!pipelineId && !!stages.stage_created);

  const onSave = () =>
    save.mutate({
      ...saved,
      push_enabled: enabled,
      pipeline_id: pipelineId,
      stage_created: stages.stage_created,
      stage_replied: stages.stage_replied,
      stage_meeting: stages.stage_meeting,
      stage_handoff: stages.stage_handoff,
      owner_id: ownerId,
      field_map: fieldMap,
    });

  const stageSelect = (key: string, label: string, required = false) => (
    <div className="space-y-2" key={key}>
      <Label>{label}</Label>
      <Select
        value={stages[key] ?? (required ? undefined : NONE)}
        onValueChange={(v) => setStages((s) => ({ ...s, [key]: v === NONE ? null : v }))}
        disabled={!pipelineId}
      >
        <SelectTrigger><SelectValue placeholder={required ? "Selecione" : "Não mover"} /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={NONE}>Não mover</SelectItem>}
          {pipelineStages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pipedrive</DialogTitle>
          <DialogDescription>
            Importe contatos do Pipedrive quando quiser e envie automaticamente os negócios dos leads abordados pela Leaderei.
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pd-token">API Token</Label>
              <Input id="pd-token" type="password" placeholder="Cole seu API Token do Pipedrive"
                value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
              <a href="https://app.pipedrive.com/settings/api" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Onde encontrar meu API Token? <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Button className="w-full" onClick={() => connect.mutate(apiToken)} disabled={!apiToken || connect.isPending}>
              <Plug className="mr-2 h-4 w-4" /> {connect.isPending ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">Conectado</Badge>
                <span className="text-muted-foreground">{integration?.api_domain}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                <Unplug className="mr-2 h-4 w-4" /> Desconectar
              </Button>
            </div>

            <Tabs defaultValue="push">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="push">Envio de negócios</TabsTrigger>
                <TabsTrigger value="inbound">Entrada (Inbound)</TabsTrigger>
                <TabsTrigger value="import">Importar contatos</TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="space-y-3 pt-3">
                <p className="text-sm text-muted-foreground">
                  Traz as pessoas do Pipedrive para a sua lista de Leads. É sempre manual: só acontece quando você clica no botão.
                  Leads que já têm negócio enviado pela Leaderei nunca são apagados por aqui.
                </p>
                {integration?.last_synced_at && (
                  <p className="text-xs text-muted-foreground">
                    Última importação: {new Date(integration.last_synced_at).toLocaleString("pt-BR")}
                  </p>
                )}
                <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
                  {sync.isPending ? "Importando..." : "Importar contatos agora"}
                </Button>
              </TabsContent>

              <TabsContent value="push" className="space-y-5 pt-3">
                <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Enviar negócios automaticamente</p>
                    <p className="text-xs text-muted-foreground">
                      Quando um lead é abordado, o negócio nasce no Pipedrive e avança quando ele responde,
                      agenda reunião ou vai para atendimento humano. Nunca volta de etapa.
                    </p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                {discover.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Lendo funis e campos do Pipedrive…
                  </div>
                ) : discover.isError ? (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                    <span>{(discover.error as Error).message}. Se o token foi trocado, desconecte e conecte de novo.</span>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Funil</Label>
                        <Select value={pipelineId ?? undefined} onValueChange={(v) => {
                          setPipelineId(v);
                          setStages({ stage_created: null, stage_replied: null, stage_meeting: null, stage_handoff: null });
                        }}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {(d?.pipelines ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Dono do negócio</Label>
                        <Select value={ownerId ?? NONE} onValueChange={(v) => setOwnerId(v === NONE ? null : v)}>
                          <SelectTrigger><SelectValue placeholder="Padrão do token" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Padrão do token</SelectItem>
                            {(d?.users ?? []).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {stageSelect("stage_created", "Etapa ao abordar o lead", true)}
                      {stageSelect("stage_replied", "Etapa quando o lead responde")}
                      {stageSelect("stage_meeting", "Etapa quando agenda reunião")}
                      {stageSelect("stage_handoff", "Etapa no atendimento humano")}
                    </div>

                    <div className="space-y-2">
                      <Label>De/para de campos (opcional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Nome, e-mail e telefone já vão para a Pessoa automaticamente. Escolha onde guardar os demais dados.
                      </p>
                      <div className="space-y-2">
                        {PIPEDRIVE_LEAD_FIELDS.map((f) => {
                          const cur = fieldMap[f.key];
                          const entity = cur?.entity ?? f.entity;
                          const options = entity === "person" ? d?.person ?? [] : d?.deal ?? [];
                          return (
                            <div key={f.key} className="grid grid-cols-[1fr_7rem_1.4fr] items-center gap-2">
                              <span className="text-sm">{f.label}</span>
                              <Select value={entity} onValueChange={(v) =>
                                setFieldMap((m) => { const n = { ...m }; delete n[f.key]; return v === f.entity ? n : { ...n, [f.key]: { entity: v as any, field: "" } }; })}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="person">Pessoa</SelectItem>
                                  <SelectItem value="deal">Negócio</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select value={cur?.field || NONE} onValueChange={(v) =>
                                setFieldMap((m) => {
                                  const n = { ...m };
                                  if (v === NONE) delete n[f.key]; else n[f.key] = { entity, field: v };
                                  return n;
                                })}>
                                <SelectTrigger className="h-8"><SelectValue placeholder="Não enviar" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NONE}>Não enviar</SelectItem>
                                  {options.map((o) => <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-lg border p-3 text-sm space-y-2">
                  <div className="flex flex-wrap gap-4">
                    <span>Negócios enviados: <strong>{queue.data?.deals ?? 0}</strong></span>
                    <span>Na fila: <strong>{queue.data?.pending ?? 0}</strong></span>
                    <span>Falhas: <strong>{queue.data?.failed ?? 0}</strong></span>
                  </div>
                  {queue.data?.lastError && (
                    <p className="text-xs text-muted-foreground">Último aviso: {queue.data.lastError}</p>
                  )}
                  <Button variant="outline" size="sm" onClick={() => retry.mutate()} disabled={retry.isPending}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Tentar falhas novamente
                  </Button>
                </div>

                <Button className="w-full" onClick={onSave} disabled={!canSave || save.isPending}>
                  {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                </Button>
              </TabsContent>

              <TabsContent value="inbound" className="pt-3">
                <PipedriveInboundTab saved={saved} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
