import { KeyRound } from "lucide-react";
import { Alert, Button, Card, Spinner, Typography } from "nfse-ds";
import { useAutenticar } from "@/hooks/useAcoes";
import { useBloqueios } from "@/hooks/useBloqueios";
import { emAutenticacao, useSessao } from "@/state/sessao";

/** Autenticação no ALM: convite, andamento (eventos de status) ou sessão expirada. */
export function PainelSessao() {
  const fase = useSessao((s) => s.fase);
  const sessaoCaiu = useSessao((s) => s.sessaoCaiu);
  const statusTexto = useSessao((s) => s.statusTexto);
  const { podeAutenticar } = useBloqueios();
  const autenticar = useAutenticar();

  if (sessaoCaiu) {
    return (
      <Alert variant="error" title="A sessão do ALM expirou">
        <div className="flex flex-wrap items-center gap-3">
          <span>As consultas pararam. Autentique-se de novo para continuar; a lista local está preservada.</span>
          <Button size="sm" disabled={!podeAutenticar} onClick={() => autenticar.mutate()}>
            <KeyRound aria-hidden="true" className="size-4" />
            Reautenticar
          </Button>
        </div>
      </Alert>
    );
  }

  if (emAutenticacao(fase)) {
    return (
      <Card>
        <div className="flex items-start gap-4">
          <Spinner size="md" label="Autenticando" />
          <div className="space-y-1">
            <Typography variant="body">
              <strong>{fase === "autenticando" ? "Autenticando no ALM…" : "Preparando a sessão do ALM…"}</strong>
            </Typography>
            {statusTexto && (
              <Typography variant="caption" as="p" className="whitespace-pre-line">
                {statusTexto}
              </Typography>
            )}
            <Typography variant="caption" as="p">
              Digite o PIN do certificado se o Windows pedir. Nesta fase o X da janela não responde: para
              cancelar, use o botão <strong>Fechar</strong>.
            </Typography>
          </div>
        </div>
      </Card>
    );
  }

  if (fase === "nao_autenticado") {
    return (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl space-y-1">
            <Typography variant="body">
              <strong>Autentique-se no ALM para consultar os relatos.</strong>
            </Typography>
            <Typography variant="caption" as="p">
              A autenticação corre em segundo plano; só o diálogo de certificado/PIN do Windows aparece. O
              script nunca lê nem grava o PIN. Anotações e exclusões funcionam sem autenticar.
            </Typography>
          </div>
          <Button disabled={!podeAutenticar} onClick={() => autenticar.mutate()}>
            <KeyRound aria-hidden="true" className="size-4" />
            Autenticar no ALM
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
