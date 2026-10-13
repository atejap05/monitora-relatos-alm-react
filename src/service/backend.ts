import type {
  Envelope,
  Estado,
  Payload,
  RespostaAbrirNoAlm,
  RespostaCriarAtalho,
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
  // #region agent log
  sondarResposta(payload.acao, resposta);
  // #endregion
  if (!resposta || !resposta.ok) throw new ErroBackend(resposta as RespostaErro);
  return resposta as T;
}

// #region agent log
function sondarResposta(acao: string, resposta: unknown): void {
  const achados: { caminho: string; len: number; fffd: number; naoAscii: string[] }[] = [];
  const visitar = (valor: unknown, caminho: string, profundidade: number) => {
    if (profundidade > 5 || achados.length > 25) return;
    if (typeof valor === "string") {
      if (/cpf|persona/i.test(caminho)) return;
      let fffd = 0;
      const naoAscii: string[] = [];
      for (const ch of valor) {
        const c = ch.codePointAt(0) ?? 0;
        if (c === 0xfffd) fffd++;
        else if (c > 127 && naoAscii.length < 10) naoAscii.push(c.toString(16));
      }
      if (fffd || naoAscii.length) achados.push({ caminho, len: valor.length, fffd, naoAscii });
      return;
    }
    if (Array.isArray(valor)) {
      valor.slice(0, 40).forEach((item, i) => visitar(item, `${caminho}[${i}]`, profundidade + 1));
      return;
    }
    if (valor && typeof valor === "object") {
      for (const [chave, item] of Object.entries(valor)) {
        if (/cpf|persona/i.test(chave)) continue;
        visitar(item, caminho ? `${caminho}.${chave}` : chave, profundidade + 1);
      }
    }
  };
  visitar(resposta, "", 0);
  fetch("http://127.0.0.1:7895/ingest/c2ad49b8-1f2d-4e14-964c-ddc5641374d0", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "959a57" },
    body: JSON.stringify({
      sessionId: "959a57",
      hypothesisId: "H1-H3-H5",
      location: "backend.ts:chamar",
      message: "textos da resposta",
      data: { acao, achados },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

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
  /** `testerNome` e `anotacoes` vazios não apagam o que já está gravado (RF-22, RF-15). */
  cadastrarRelatos: (demandaId: string, numerosAlm: string[], testerNome = "", anotacoes = "") =>
    chamar<RespostaLote>({ acao: "cadastrar_relatos", demandaId, numerosAlm, testerNome, anotacoes }),
  atualizarRelato: (demandaId: string, numeroAlm: string) =>
    chamar<RespostaAtualizarRelato>({ acao: "atualizar_relato", demandaId, numeroAlm }),
  atualizarTodos: (demandaId?: string) =>
    chamar<RespostaAtualizarTodos>(
      demandaId ? { acao: "atualizar_todos", demandaId } : { acao: "atualizar_todos" },
    ),
  editarRelato: (numeroAlm: string, anotacoes: string, testerNome: string) =>
    chamar<RespostaEditar>({ acao: "editar_relato", numeroAlm, anotacoes, testerNome }),
  excluirRelato: (numeroAlm: string) => chamar<RespostaExcluir>({ acao: "excluir_relato", numeroAlm }),
  abrirNoAlm: (numeroAlm: string) => chamar<RespostaAbrirNoAlm>({ acao: "abrir_no_alm", numeroAlm }),
  /** .lnk na área de trabalho (RF-28). Não muda a lista. */
  criarAtalho: () => chamar<RespostaCriarAtalho>({ acao: "criar_atalho" }),
};

/** Extrai só o estado do envelope (a resposta traz também campos da ação). */
export function estadoDe(envelope: Estado): Estado {
  return {
    demandas: envelope.demandas,
    relatos: envelope.relatos,
    ultimaPersistencia: envelope.ultimaPersistencia,
  };
}
