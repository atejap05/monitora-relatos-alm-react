import { Copy, Download, Trash2 } from "lucide-react";
import { Alert, Button, Dialog, DialogContent, toast, Typography } from "nfse-ds";
import type { Demanda, Relato } from "@/@types/backend";
import { useExportarDemanda } from "@/hooks/useAcoes";
import { copiarTexto } from "@/lib/copiar";
import { formatarDataHora } from "@/lib/formato";
import { ResumoCategorias } from "./ResumoCategorias";

interface Props {
  demanda: Demanda | null;
  /** Relatos da demanda, para o resumo antes de exportar. */
  relatos: Relato[];
  onClose: () => void;
  /** "Excluir demanda" depois de exportar (RF-27: exportar e depois excluir). */
  onExcluir: (demanda: Demanda) => void;
}

/** Exportação da demanda (RF-26): confirma, grava em Downloads e mostra os caminhos. */
export function DialogExportar({ demanda, relatos, onClose, onExcluir }: Props) {
  return (
    <Dialog open={demanda !== null} onOpenChange={(v) => !v && onClose()}>
      {demanda && (
        <ConteudoExportar key={demanda.id} demanda={demanda} relatos={relatos} onClose={onClose} onExcluir={onExcluir} />
      )}
    </Dialog>
  );
}

function ConteudoExportar({ demanda, relatos, onClose, onExcluir }: Props & { demanda: Demanda }) {
  const exportar = useExportarDemanda();
  const resultado = exportar.data;

  const copiar = async (caminho: string) => {
    if (await copiarTexto(caminho)) toast.success("Caminho copiado.");
    else toast.error("Não foi possível copiar. Selecione o texto e copie com Ctrl+C.");
  };

  return (
    <DialogContent
      title={`Exportar a demanda ${demanda.nome}`}
      description="Grava um JSON (registro completo) e um CSV (tabela para o Excel) na sua pasta Downloads."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" disabled={exportar.isPending} onClick={onClose}>
            {resultado ? "Fechar" : "Cancelar"}
          </Button>
          {resultado ? (
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                onExcluir(resultado.demanda);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Excluir demanda
            </Button>
          ) : (
            <Button disabled={exportar.isPending} onClick={() => exportar.mutate(demanda.id)}>
              <Download aria-hidden="true" className="size-4" />
              {exportar.isPending ? "Exportando…" : "Exportar"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {relatos.length ? (
          <ResumoCategorias relatos={relatos} />
        ) : (
          <Typography variant="body">A demanda não tem relatos: os arquivos saem só com o cabeçalho.</Typography>
        )}
        {!resultado && (
          <Typography variant="caption" className="block">
            {demanda.exportadaEm
              ? `Última exportação: ${formatarDataHora(demanda.exportadaEm)}.`
              : "Esta demanda ainda não foi exportada."}{" "}
            O arquivo leva o seu nome como operador, sem CPF.
          </Typography>
        )}
        {resultado && (
          <Alert variant="success" title={`${resultado.resumo.total} relato(s) exportado(s)`}>
            <ul className="mt-1 space-y-2" aria-label="Arquivos gravados">
              {resultado.arquivos.map((caminho) => (
                <li key={caminho} className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all text-xs">{caminho}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Copiar o caminho ${caminho}`}
                    onClick={() => void copiar(caminho)}
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </DialogContent>
  );
}
