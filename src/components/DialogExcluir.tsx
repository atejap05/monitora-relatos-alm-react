import { Button, Dialog, DialogContent, Typography } from "nfse-ds";
import type { Relato } from "@/@types/backend";
import { useExcluirRelato } from "@/hooks/useAcoes";

interface Props {
  relato: Relato | null;
  onClose: () => void;
}

export function DialogExcluir({ relato, onClose }: Props) {
  const excluir = useExcluirRelato();
  const temAnotacoes = Boolean(relato?.anotacoes);

  return (
    <Dialog open={relato !== null} onOpenChange={(v) => !v && !excluir.isPending && onClose()}>
      {relato && (
        <DialogContent
          title={`Excluir o relato ${relato.numeroAlm} da lista?`}
          description={relato.titulo || undefined}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={excluir.isPending} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                disabled={excluir.isPending}
                onClick={async () => {
                  await excluir.mutateAsync(relato.numeroAlm).catch(() => undefined);
                  onClose();
                }}
              >
                {excluir.isPending ? "Excluindo…" : "Excluir da lista"}
              </Button>
            </div>
          }
        >
          <Typography variant="body">
            O relato deixa de ser monitorado por este aplicativo. Ele <strong>continua no ALM</strong>, sem
            nenhuma alteração. Para voltar a monitorá-lo, cadastre o número de novo.
          </Typography>
          {temAnotacoes && (
            <Typography variant="caption" className="mt-2 block">
              As anotações deste relato serão apagadas junto.
            </Typography>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
