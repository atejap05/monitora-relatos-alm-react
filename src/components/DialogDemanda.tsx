import { useForm } from "@tanstack/react-form";
import { Button, Dialog, DialogContent, TextArea, TextField } from "nfse-ds";
import type { Demanda } from "@/@types/backend";
import { useEditarDemanda, useRegistrarDemanda } from "@/hooks/useAcoes";
import {
  MAX_DESCRICAO_DEMANDA,
  MAX_NOME_DEMANDA,
  normalizarDescricao,
  normalizarNomeDemanda,
  validarDescricao,
  validarNomeDemanda,
} from "@/lib/demandas";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  demandas: Demanda[];
  /** Presente = editar essa demanda (RF-24); ausente = criar (RF-23). */
  demanda?: Demanda | null;
  onGravada?: (demandaId: string) => void;
}

const ID_FORM = "form-demanda";

/** Monta o formulário só quando abre, para os valores iniciais virem da demanda em edição. */
export function DialogDemanda(props: Props) {
  const { aberto, onOpenChange, demanda } = props;
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      {aberto && <ConteudoDemanda key={demanda?.id ?? "nova"} {...props} />}
    </Dialog>
  );
}

function ConteudoDemanda({ onOpenChange, demandas, demanda, onGravada }: Props) {
  const criar = useRegistrarDemanda();
  const editar = useEditarDemanda();
  const editando = Boolean(demanda);
  const form = useForm({
    defaultValues: { nome: demanda?.nome ?? "", descricao: demanda?.descricao ?? "" },
    onSubmit: async ({ value }) => {
      const nome = normalizarNomeDemanda(value.nome);
      const descricao = normalizarDescricao(value.descricao);
      let id: string;
      try {
        id = demanda
          ? (await editar.mutateAsync({ demandaId: demanda.id, nome, descricao })).demanda.id
          : (await criar.mutateAsync({ nome, descricao })).demanda.id;
      } catch {
        return; // toast já exibido; o diálogo fica aberto para corrigir
      }
      onOpenChange(false);
      onGravada?.(id);
    },
  });
  const validarNome = (nome: string) => validarNomeDemanda(nome, demandas, demanda?.id);

  return (
    <DialogContent
      title={editando ? `Editar demanda ${demanda?.nome}` : "Nova demanda"}
      description="Uma demanda agrupa os relatos de uma frente de homologação (na P6, uma aba da planilha)."
      footer={
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([podeEnviar, enviando]) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" disabled={enviando} onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" form={ID_FORM} disabled={!podeEnviar || enviando}>
                {enviando ? "Gravando…" : editando ? "Gravar" : "Criar demanda"}
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
        <form.Field name="nome" validators={{ onChange: ({ value }) => validarNome(value), onSubmit: ({ value }) => validarNome(value) }}>
          {(field) => {
            const erro = field.state.meta.errors[0];
            const contador = `${normalizarNomeDemanda(field.state.value).length}/${MAX_NOME_DEMANDA} caracteres`;
            return (
              <TextField
                label="Nome da demanda"
                required
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={Boolean(erro)}
                hint={typeof erro === "string" ? erro : `Ex.: Homologação Março, NFSe local. ${contador}`}
              />
            );
          }}
        </form.Field>
        <form.Field name="descricao" validators={{ onChange: ({ value }) => validarDescricao(value) }}>
          {(field) => {
            const erro = field.state.meta.errors[0];
            const contador = `${normalizarDescricao(field.state.value).length}/${MAX_DESCRICAO_DEMANDA} caracteres`;
            return (
              <TextArea
                label="Descrição (opcional)"
                rows={4}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={Boolean(erro)}
                hint={typeof erro === "string" ? erro : `Resumo e objetivo da homologação. ${contador}`}
              />
            );
          }}
        </form.Field>
      </form>
    </DialogContent>
  );
}
