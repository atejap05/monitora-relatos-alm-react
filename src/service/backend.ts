import type {
  Envelope,
  Estado,
  Payload,
  RespostaAbrirNoAlm,
  RespostaAtualizarRelato,
  RespostaAtualizarTodos,
  RespostaDemanda,
  RespostaEditar,
  RespostaErro,
  RespostaExcluir,
  RespostaExcluirDemanda,
  RespostaExportar,
  RespostaLote,
  StatusSessao,
} from "@/@types/backend";
import { pedir } from "@/bridge/pedir";
import { mensagemErro } from "@/lib/mensagens";

export class ErroBackend extends Error {
  readonly codigo: string;
  /** Presente quando a recusa mudou a lista (ex.: 404 que tirou uma linha sem título). */
  readonly estado?: Estado;

  constructor(resposta: RespostaErro) {
    super(mensagemErro(resposta.erro, resposta.mensagem));
    this.name = "ErroBackend";
    this.codigo = resposta.erro;
    if (resposta.demandas && resposta.relatos) {
      this.estado = {
        demandas: resposta.demandas,
        relatos: resposta.relatos,
        ultimaPersistencia: resposta.ultimaPersistencia,
      };
    }
  }
}

async function chamar<T>(payload: Payload): Promise<T> {
  const resposta = (await pedir(payload)) as { ok: boolean };
  if (!resposta || !resposta.ok) throw new ErroBackend(resposta as RespostaErro);
  return resposta as T;
}

export const backend = {
  statusSessao: () => chamar<StatusSessao>({ acao: "status_sessao" }),
  carregarEstado: () => chamar<Envelope>({ acao: "carregar_estado" }),
  autenticar: () => chamar<{ ok: true; fase: string }>({ acao: "autenticar" }),
  fechar: () => chamar<{ ok: true; fase: string }>({ acao: "fechar" }),
  registrarDemanda: (nome: string, descricao = "") =>
    chamar<RespostaDemanda>({ acao: "registrar_demanda", nome, descricao }),
  /** `descricao` vazia limpa a descrição (RF-24). */
  editarDemanda: (demandaId: string, nome: string, descricao: string) =>
    chamar<RespostaDemanda>({ acao: "editar_demanda", demandaId, nome, descricao }),
  excluirDemanda: (demandaId: string) => chamar<RespostaExcluirDemanda>({ acao: "excluir_demanda", demandaId }),
  /** JSON + CSV na pasta Downloads (RF-26). */
  exportarDemanda: (demandaId: string) => chamar<RespostaExportar>({ acao: "exportar_demanda", demandaId }),
  /** `testerNome` vazio não apaga o nome de quem já está na lista (RF-22). */
  cadastrarRelatos: (demandaId: string, numerosAlm: string[], testerNome = "") =>
    chamar<RespostaLote>({ acao: "cadastrar_relatos", demandaId, numerosAlm, testerNome }),
  atualizarRelato: (demandaId: string, numeroAlm: string) =>
    chamar<RespostaAtualizarRelato>({ acao: "atualizar_relato", demandaId, numeroAlm }),
  atualizarTodos: (demandaId?: string) =>
    chamar<RespostaAtualizarTodos>(
      demandaId ? { acao: "atualizar_todos", demandaId } : { acao: "atualizar_todos" },
    ),
  editarRelato: (numeroAlm: string, anotacoes: string, observacoes: string, testerNome: string) =>
    chamar<RespostaEditar>({ acao: "editar_relato", numeroAlm, anotacoes, observacoes, testerNome }),
  excluirRelato: (numeroAlm: string) => chamar<RespostaExcluir>({ acao: "excluir_relato", numeroAlm }),
  abrirNoAlm: (numeroAlm: string) => chamar<RespostaAbrirNoAlm>({ acao: "abrir_no_alm", numeroAlm }),
};

/** Extrai só o estado do envelope (a resposta traz também campos da ação). */
export function estadoDe(envelope: Estado): Estado {
  return {
    demandas: envelope.demandas,
    relatos: envelope.relatos,
    ultimaPersistencia: envelope.ultimaPersistencia,
  };
}
