import type { BadgeVariant } from "nfse-ds";
import type { Relato } from "@/@types/backend";

// Categoria do estado ALM = com quem está a ação (RF-21; vsrun domain-and-sync.md §5.3).
// A fonte da verdade é o STORE, que manda `categoriaStatus` pronto. Este mapa existe para o mock
// e para o teste de paridade: mudou lá, muda aqui no mesmo commit.

export type CategoriaStatus = "aberto" | "em-atendimento" | "aguardando-rfb" | "concluido" | "desconhecido";

export interface InfoCategoria {
  /** Ordem do fluxo, usada na ordenação da coluna Status ALM. */
  ordem: number;
  variante: BadgeVariant;
  /** Rótulo curto no plural, para a contagem por demanda. */
  plural: string;
  /** Explicação no tooltip do badge. */
  descricao: string;
}

export const CATEGORIAS: Record<CategoriaStatus, InfoCategoria> = {
  aberto: { ordem: 0, variante: "error", plural: "abertos", descricao: "Aberto: ainda não atendido pela TI" },
  "em-atendimento": {
    ordem: 1,
    variante: "warning",
    plural: "com a TI",
    descricao: "Com a TI: em atendimento, teste ou liberação",
  },
  "aguardando-rfb": {
    ordem: 2,
    variante: "info",
    plural: "aguardando RFB",
    descricao: "Aguardando a RFB: testar ou homologar",
  },
  concluido: { ordem: 3, variante: "success", plural: "concluídos", descricao: "Concluído" },
  desconhecido: {
    ordem: 4,
    variante: "neutral",
    plural: "sem categoria",
    descricao: "Estado não mapeado ou relato ainda não consultado",
  },
};

export const ORDEM_CATEGORIAS = (Object.keys(CATEGORIAS) as CategoriaStatus[]).sort(
  (a, b) => CATEGORIAS[a].ordem - CATEGORIAS[b].ordem,
);

const PREFIXO_ESTADO_RELATO = "br.gov.serpro.alm.fluxo.Relato.state.";
const POR_ESTADO_ID: Record<string, CategoriaStatus> = {
  [`${PREFIXO_ESTADO_RELATO}s4`]: "aberto",
  [`${PREFIXO_ESTADO_RELATO}s13`]: "aguardando-rfb",
  [`${PREFIXO_ESTADO_RELATO}s1`]: "concluido",
};
const POR_TITULO: Record<string, CategoriaStatus> = {
  rascunho: "aberto",
  aberto: "aberto",
  preparado: "em-atendimento",
  "em atendimento": "em-atendimento",
  atendido: "em-atendimento",
  "em teste": "em-atendimento",
  testado: "em-atendimento",
  liberado: "em-atendimento",
  "liberado para teste": "aguardando-rfb",
  "em homologacao": "aguardando-rfb",
  concluido: "concluido",
};

function normalizarTitulo(titulo: string | null | undefined): string {
  return (titulo ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Mesma regra do STORE.categoria_estado: estadoId medido, senão título normalizado (exato). */
export function categoriaEstado(estadoId: string | null | undefined, estadoTitulo: string | null | undefined): CategoriaStatus {
  return POR_ESTADO_ID[(estadoId ?? "").trim()] ?? POR_TITULO[normalizarTitulo(estadoTitulo)] ?? "desconhecido";
}

export function infoCategoria(categoria: string | null | undefined): InfoCategoria {
  return CATEGORIAS[(categoria ?? "desconhecido") as CategoriaStatus] ?? CATEGORIAS.desconhecido;
}

/** Quantos relatos há em cada categoria (resumo da demanda; exportação na M7). */
export function contarCategorias(relatos: Relato[]): Record<CategoriaStatus, number> {
  const contagem = Object.fromEntries(ORDEM_CATEGORIAS.map((c) => [c, 0])) as Record<CategoriaStatus, number>;
  for (const r of relatos) {
    const c = (r.categoriaStatus ?? "desconhecido") as CategoriaStatus;
    contagem[c in contagem ? c : "desconhecido"] += 1;
  }
  return contagem;
}

/** Rótulo no singular, igual à coluna Categoria do CSV exportado (STORE.ROTULOS_CATEGORIA). */
export const ROTULO_CATEGORIA: Record<CategoriaStatus, string> = {
  aberto: "Aberto",
  "em-atendimento": "Em atendimento (TI)",
  "aguardando-rfb": "Aguardando RFB",
  concluido: "Concluído",
  desconhecido: "Desconhecido",
};

/** RF-27, igual a STORE.resumo_demanda: pelo menos um relato e todos em `concluido`. */
export function demandaConcluida(relatos: Relato[]): boolean {
  return relatos.length > 0 && relatos.every((r) => r.categoriaStatus === "concluido");
}
