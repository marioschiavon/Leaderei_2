import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCadences } from "@/hooks/useCadences";
import { useSavePipedrivePushConfig, type PipedrivePushConfig } from "@/hooks/usePipedrivePush";

type Cfg = PipedrivePushConfig & { inbound_enabled?: boolean; inbound_token?: string | null; inbound_cadence_id?: string | null };

const newToken = () => crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

export function PipedriveInboundTab({ saved }: { saved: Cfg }) {
  const save = useSavePipedrivePushConfig();
  const { data: cadences } = useCadences();
  const [enabled, setEnabled] = useState(false);
  const [cadenceId, setCadenceId] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    setEnabled(saved.inbound_enabled === true);
    setCadenceId(saved.inbound_cadence_id ?? null);
    setToken(saved.inbound_token || newToken());
  }, [saved.inbound_enabled, saved.inbound_cadence_id, saved.inbound_token]);

  const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/pipedrive-inbound?token=${token}`;
  const active = (cadences ?? []).filter((c: any) => c.status === "active" || c.status === "draft");

  const onSave = () => save.mutate({ ...saved, inbound_enabled: enabled, inbound_cadence_id: cadenceId, inbound_token: token } as Cfg);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Quando um negócio entrar na etapa escolhida no Pipedrive, a Leaderei cria o lead, liga ao mesmo cartão e já começa a cadência.
        Organizações em "Não prospectar" nunca são abordadas.
      </p>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="pd-inbound">Receber leads do Pipedrive</Label>
        <Switch id="pd-inbound" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="space-y-2">
        <Label>Cadência de destino</Label>
        <Select value={cadenceId ?? undefined} onValueChange={setCadenceId}>
          <SelectTrigger><SelectValue placeholder="Selecione a cadência" /></SelectTrigger>
          <SelectContent>
            {active.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Endereço para a automação do Pipedrive</Label>
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <Button variant="outline" size="icon" title="Copiar"
            onClick={() => { navigator.clipboard.writeText(url); toast.success("Endereço copiado"); }}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Gerar novo endereço (o antigo para de funcionar ao salvar)"
            onClick={() => setToken(newToken())}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Como configurar no Pipedrive</p>
        <p>1. Automações → Nova automação → gatilho "Negócio criado" (ou "Negócio atualizado").</p>
        <p>2. Condição: Funil = seu funil de entrada e Etapa = a etapa de prospecção.</p>
        <p>3. Ação: Webhook, método POST, cole o endereço acima e no corpo envie o campo <code>deal_id</code> com o ID do negócio.</p>
      </div>

      <Button className="w-full" onClick={onSave} disabled={save.isPending || (enabled && !cadenceId)}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
      </Button>
    </div>
  );
}
