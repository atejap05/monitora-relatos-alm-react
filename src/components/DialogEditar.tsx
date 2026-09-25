import { useForm } from "@tanstack/react-form";
import { Button, Dialog, DialogContent, TextArea, Typography } from "nfse-ds";
import type { Relato } from "@/@types/backend";
import { useEditarRelato } from "@/hooks/useAcoes";
import { formatarDataHora } from "@/lib/formato";
import { MAX_TEXTO_ANOTACAO } from "@/lib/numeros";
import { validarTester } from "@/lib/tester";
import { CampoTester } from "./CampoTester";

interface Props {
  relato: Relato | null;
  onClose: () => void;
  sugestoesTester: string[];
}

const ID_FORM = "form-editar-relato";

function limite(valor: string): string | undefined {
  return valor.trim().length > MAX_TEXTO_ANOTACAO ? `Máximo de ${MAX_TEXTO_ANOTACAO} caracteres.` : undefined;
}

/** Monta o formulário só com um relato em mãos, para os valores iniciais virem dele. */
export function DialogEditar({ relato, onClose, sugestoesTester }: Props) {
  return (
    <Dialog open={relato !== null} onOpenChange={(v) => !v && onClose()}>
      {relato && (
        <ConteudoEditar key={relato.numeroAlm} relato={relato} onClose={onClose} sugestoesTester={sugestoesTester} />
      )}
    </Dialog>
  );
}

function ConteudoEditar({
  relato,
  onClose,
  sugestoesTester,
}: {
  relato: Relato;
  onClose: () => void;
  sugestoesTester: string[];
}) {
  const editar = useEditarRelato();
  const form = useForm({
    defaultValues: {
      tester: relato.testerNome ?? "",
      anotacoes: relato.anotacoes ?? "",
      observacoes: relato.observacoes ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await editar.mutateAsync({
          numeroAlm: relato.numeroAlm,
          testerNome: value.tester,
          anotacoes: value.anotacoes,
          observacoes: value.observacoes,
        });
      } catch {
        return; // toast já exibido; o diálogo fica aberto para corrigir
      }
      onClose();
    },
  });

  return (
    <DialogContent
      title={`Editar relato ${relato.numeroAlm}`}
      description={relato.titulo || "Relato sem título consultado."}
      footer={
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([podeEnviar, enviando]) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" disabled={enviando} onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" form={ID_FORM} disabled={!podeEnviar || enviando}>
                {enviando ? "Gravando…" : "Gravar"}
              </Button>
            </div>
          )}
        </form.Subscribe>
      }
    >
      <form
        id={ID_FORM}
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="tester" validators={{ onChange: ({ value }) => validarTester(value) }}>
          {(field) => {
            const erro = field.state.meta.errors[0];
            return (
              <CampoTester
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                sugestoes={sugestoesTester}
                erro={typeof erro === "string" ? erro : undefined}
              />
            );
          }}
        </form.Field>
        {(["anotacoes", "observacoes"] as const).map((nome) => (
          <form.Field key={nome} name={nome} validators={{ onChange: ({ value }) => limite(value) }}>
            {(field) => {
              const erro = field.state.meta.errors[0];
              const tamanho = field.state.value.trim().length;
              return (
                <TextArea
                  label={nome === "anotacoes" ? "Anotações" : "Observações"}
                  rows={4}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={Boolean(erro)}
                  hint={typeof erro === "string" ? erro : `${tamanho}/${MAX_TEXTO_ANOTACAO} caracteres`}
                />
              );
            }}
          </form.Field>
        ))}
        <Typography variant="caption">
          Texto da RFB, gravado só no arquivo local. O relato no ALM não é alterado. Deixe em branco para
          limpar.
          {relato.anotacoesAtualizadasEm ? ` Última edição: ${formatarDataHora(relato.anotacoesAtualizadasEm)}.` : ""}
        </Typography>
      </form>
    </DialogContent>
  );
}
