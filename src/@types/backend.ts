// Contrato da ponte invertida — espelho de
// vsrun/repo/scripts-docs/monitora-relatos-alm/frontend-integration.md §2.5 e §4.

import type { CategoriaStatus } from "@/lib/categorias";

export type { CategoriaStatus };

export type Fase = "nao_autenticado" | "autenticando" | "aquecendo_ccm" | "autenticado";

export type SituacaoConsulta =
  | "ok"
  | "id-invalido"
  | "erro-rede"
  | "sessao-caiu"
  | "nao-encontrado"
  | "erro-http"
  | "formato-inesperado"
  | "sem-estado";

export interface Demanda {
  id: string;
  nome: string;
  abaSheets: string;
  /** Resumo e objetivo (RF-23), até 500 caracteres. `null` em demanda sem descrição. */
  descricao?: string | null;
  /** ISO 8601. `null` em demanda gravada antes da M6. */
  criadaEm?: string | null;
  atualizadaEm?: string | null;
  /** ISO 8601 da última exportação (RF-26); `null` se nunca foi exportada. */
  exportadaEm?: string | null;
  totalMonitorados: number;
  totalCandidatos: number;
}

export interface Relato {
  demandaId: string;
  numeroAlm: string;
  titulo?: string | null;
  status?: string | null;
  estadoId?: string | null;
  estadoTitulo?: string | null;
  situacaoConsulta?: SituacaoConsulta | null;
  /** Derivada pelo STORE a partir do estado (RF-21); não é persistida. */
  categoriaStatus?: CategoriaStatus | null;
  ultimaConsultaAlm?: string | null;
  ultimaSincronizacaoSheets?: string | null;
  linhaSheets?: number | null;
  anotacoes?: string | null;
  anotacoesAtualizadasEm?: string | null;
  /** Tester responsável (RF-22), normalizado pelo STORE. Na P6 a planilha prevalece. */
  testerNome?: string | null;
}

export interface Estado {
  demandas: Demanda[];
  relatos: Relato[];
  ultimaPersistencia?: string | null;
}

export interface Persona {
  nome: string;
  cpf: string;
  iniciais: string;
}

export interface StatusSessao {
  ok: true;
  fase: Fase;
  autenticado: boolean;
  persona: Persona;
  versaoScript: string;
  varreduraAoAbrir: boolean;
}

export interface ResultadoLote {
  numeroAlm: string;
  ok: boolean;
  erro?: string | null;
  mensagem?: string | null;
  situacao?: SituacaoConsulta;
  relato?: Relato;
}

export interface ErroVarredura {
  numeroAlm: string;
  erro: string;
}

export type Envelope = { ok: true } & Estado;

export type RespostaLote = Envelope & { resultados: ResultadoLote[]; sessaoCaiu: boolean };
export type RespostaAtualizarRelato = Envelope & {
  relato?: Relato;
  alterado: boolean;
  sessaoCaiu?: boolean;
  interrompido?: boolean;
};
export type RespostaAtualizarTodos = Envelope & {
  total: number;
  okCount: number;
  erros: ErroVarredura[];
  alterados: number;
  interrompido: boolean;
  sessaoCaiu: boolean;
};
export type RespostaEditar = Envelope & { relato: Relato };
export type RespostaExcluir = Envelope & { removido: string };
export type RespostaDemanda = Envelope & { demanda: Demanda };
export type RespostaExcluirDemanda = Envelope & { removida: string; relatosRemovidos: number };
export interface ResumoExportacao {
  total: number;
  porCategoria: Record<CategoriaStatus, number>;
  /** RF-27: pelo menos um relato e todos concluídos. */
  concluida: boolean;
}
/** `arquivos`: caminhos completos do JSON e do CSV, nessa ordem, na pasta Downloads. */
export type RespostaExportar = Envelope & {
  demanda: Demanda;
  arquivos: [string, string];
  pasta: string;
  resumo: ResumoExportacao;
};
/** Não muda o estado: sem envelope. A URL é montada pelo script (RF-20). */
export interface RespostaAbrirNoAlm {
  ok: true;
  url: string;
}

/** Não muda o estado: sem envelope. O caminho do .lnk não volta (RF-28). */
export interface RespostaCriarAtalho {
  ok: true;
  recriado: boolean;
}

/** Recusa ou falha. Quando a recusa mudou a lista (404 que remove), o estado vem junto. */
export interface RespostaErro extends Partial<Estado> {
  ok: false;
  erro: string;
  mensagem?: string;
  detalhe?: string;
}

export type Payload =
  | { acao: "status_sessao" }
  | { acao: "carregar_estado" }
  | { acao: "autenticar" }
  | { acao: "fechar" }
  | { acao: "registrar_demanda"; nome: string; descricao?: string | null }
  /** `descricao` ausente ou `null` mantém; `""` limpa. */
  | { acao: "editar_demanda"; demandaId: string; nome: string; descricao?: string | null }
  | { acao: "excluir_demanda"; demandaId: string }
  | { acao: "exportar_demanda"; demandaId: string }
  | {
      acao: "cadastrar_relatos";
      demandaId: string;
      numerosAlm: string[];
      testerNome?: string | null;
      anotacoes?: string | null;
    }
  | { acao: "atualizar_relato"; demandaId?: string; numeroAlm: string }
  | { acao: "atualizar_todos"; demandaId?: string }
  | {
      acao: "editar_relato";
      numeroAlm: string;
      anotacoes?: string | null;
      testerNome?: string | null;
    }
  | { acao: "excluir_relato"; numeroAlm: string }
  | { acao: "abrir_no_alm"; numeroAlm: string }
  | { acao: "criar_atalho" };

export type Evento =
  | { tipo: "fase"; fase: Fase }
  | { tipo: "status"; texto: string }
  | { tipo: "varredura"; atual: number; total: number; numeroAlm: string | null }
  | ({
      tipo: "varredura-fim";
      total: number;
      okCount: number;
      erros: ErroVarredura[];
      alterados: number;
      interrompido: boolean;
      sessaoCaiu: boolean;
    } & Estado)
  | { tipo: "sessao-caiu" };
