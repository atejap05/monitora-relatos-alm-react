import { Progress, Typography } from "nfse-ds";
import { useSessao } from "@/state/sessao";

export function BarraVarredura() {
  const varredura = useSessao((s) => s.varredura);
  if (!varredura) return null;
  const { atual, total, numeroAlm } = varredura;
  return (
    <div role="status" aria-live="polite" className="space-y-1">
      <Typography variant="caption">
        Consultando o ALM: {atual} de {total}
        {numeroAlm ? ` · relato ${numeroAlm}` : ""}. Para interromper, use Fechar.
      </Typography>
      <Progress value={atual} max={Math.max(total, 1)} aria-label="Progresso da varredura" />
    </div>
  );
}
