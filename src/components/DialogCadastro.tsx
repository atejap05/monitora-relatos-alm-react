import { useForm } from "@tanstack/react-form";
import { Button, Dialog, DialogContent, TextArea, Typography } from "nfse-ds";
import { useCadastrar } from "@/hooks/useAcoes";
import { analisarLote, MAX_TEXTO_ANOTACAO, validarAnotacao } from "@/lib/numeros";
import { validarTester } from "@/lib/tester";
import { CampoTester } from "./CampoTester";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  demandaId: string;
  demandaNome: string;
  sugestoesTester: string[];
}

const ID_FORM = "form-cadastro-relatos";

function validar(texto: string): string | undefined {
  const { validos, invalidos } = analisarLote(texto);
  if (!validos.length && !invalidos.length) return "Informe ao menos um número ALM.";
  if (invalidos.length) {
    return invalidos.map((i) => `${i.bruto}: ${i.mensagem}`).join(" · ");
  }
  return undefined;
}

export function DialogCadastro({ aberto, onOpenChange, demandaId, demandaNome, sugestoesTester }: Props) {
  const cadastrar = useCadastrar();
  const form = useForm({
    defaultValues: { numeros: "", tester: "", anotacoes: "" },
    onSubmit: async ({ value, formApi }) => {
      const { validos } = analisarLote(value.numeros);
      try {
        await cadastrar.mutateAsync({
          demandaId,
          numeros: validos,
          testerNome: value.tester,
          anotacoes: value.anotacoes,
        });
      } catch {
        return; // o toast de erro já saiu em useCadastrar; o diálogo fica aberto
      }
      formApi.reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!cadastrar.isPending) onOpenChange(v);
      }}
    >
      <DialogContent
        title={`Cadastrar relatos em ${demandaNome}`}
        description="Relatos já abertos no ALM. Cada número é consultado uma vez; os não encontrados não entram na lista."
        footer={
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([podeEnviar, enviando]) => (
              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" disabled={enviando} onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" form={ID_FORM} disabled={!podeEnviar || enviando}>
                  {enviando ? "Consultando o ALM…" : "Cadastrar"}
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
          <form.Field name="numeros" validators={{ onChange: ({ value }) => validar(value), onSubmit: ({ value }) => validar(value) }}>
            {(field) => {
              const erro = field.state.meta.errors[0];
              const { validos } = analisarLote(field.state.value);
              return (
                <div className="space-y-2">
                  <TextArea
                    label="Números ALM"
                    required
                    rows={5}
                    placeholder={"5477222\n5483739, 5489614"}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={Boolean(erro)}
                    hint={
                      typeof erro === "string"
                        ? erro
                        : "Um por linha, ou separados por vírgula ou espaço. Faixa 1 a 2147483647."
                    }
                  />
                  {validos.length > 1 && (
                    <Typography variant="caption">{validos.length} números serão consultados em sequência.</Typography>
                  )}
                </div>
              );
            }}
          </form.Field>
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
                  dica="Opcional; vale para todos os números. Em branco, quem já está na lista mantém o nome."
                />
              );
            }}
          </form.Field>
          <form.Field name="anotacoes" validators={{ onChange: ({ value }) => validarAnotacao(value) }}>
            {(field) => {
              const erro = field.state.meta.errors[0];
              const tamanho = field.state.value.trim().length;
              return (
                <TextArea
                  label="Anotações"
                  rows={3}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={Boolean(erro)}
                  hint={
                    typeof erro === "string"
                      ? erro
                      : `Opcional; vale para todos os números. Em branco, quem já está na lista mantém a anotação. ${tamanho}/${MAX_TEXTO_ANOTACAO} caracteres`
                  }
                />
              );
            }}
          </form.Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
