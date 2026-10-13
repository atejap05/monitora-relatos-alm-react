import { Download } from "lucide-react";
import { Alert, Button, Dialog, DialogContent, Typography } from "nfse-ds";
import type { Demanda } from "@/@types/backend";
import { useExcluirDemanda } from "@/hooks/useAcoes";
import { formatarDataHora } from "@/lib/formato";

interface Props {
  demanda: Demanda | null;
  onClose: () => void;
  onExcluida: (demandaId: string) => void;
  /** Troca este diálogo pelo de exportação (RF-27). */
  onExportar: (demanda: Demanda) => void;
}

function textoRelatos(total: number): string {
  if (total === 0) return "Nenhum relato sai da lista local.";
  return total === 1 ? "1 relato sai da lista local." : `${total} relatos saem da lista local.`;
}

/** Exclusão em cascata (RF-25): a demanda e os relatos dela saem do JSON; o ALM não é tocado. */
export function DialogExcluirDemanda({ demanda, onClose, onExcluida, onExportar }: Props) {
  const excluir = useExcluirDemanda();

  return (
    <Dialog open={demanda !== null} onOpenChange={(v) => !v && !excluir.isPending && onClose()}>
      {demanda && (
        <DialogContent
          title={`Excluir a demanda ${demanda.nome}?`}
          description={demanda.descricao || undefined}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={excluir.isPending} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                disabled={excluir.isPending}
                onClick={async () => {
                  try {
                    await excluir.mutateAsync(demanda.id);
                  } catch {
                    onClose();
                    return;
                  }
                  onClose();
                  onExcluida(demanda.id);
                }}
              >
                {excluir.isPending ? "Excluindo…" : "Excluir demanda"}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <Typography variant="body">
              <strong>{textoRelatos(demanda.totalMonitorados)}</strong>
              {demanda.totalMonitorados > 0 && (
                <>
                  {" "}
                  Anotações e tester desses relatos são apagados junto. Os relatos{" "}
                  <strong>continuam no ALM</strong>, sem nenhuma alteração.
                </>
              )}
            </Typography>
            {demanda.totalMonitorados > 0 &&
              (demanda.exportadaEm ? (
                <Typography variant="caption" className="block">
                  Exportada em {formatarDataHora(demanda.exportadaEm)}. Se a lista mudou depois disso, exporte de
                  novo antes de excluir.
                </Typography>
              ) : (
                <Alert variant="warning" title="Exporte antes, se precisar do histórico">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Esta demanda nunca foi exportada. Depois de excluir, não há como recuperar a lista.</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={excluir.isPending}
                      onClick={() => {
                        onClose();
                        onExportar(demanda);
                      }}
                    >
                      <Download aria-hidden="true" className="size-4" />
                      Exportar
                    </Button>
                  </div>
                </Alert>
              ))}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
