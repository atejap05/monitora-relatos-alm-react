// Regras de nome e descrição da demanda (RF-23/RF-24), iguais às do STORE
// (_texto_nome_demanda, _texto_descricao, _validar_demanda). O script confere de novo.
import type { Demanda } from "@/@types/backend";
import { normalizarIdDemanda } from "./numeros";

export const MAX_NOME_DEMANDA = 80;
export const MAX_DESCRICAO_DEMANDA = 500;

/** Espaços únicos, como o STORE grava o nome. */
export function normalizarNomeDemanda(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).join(" ");
}

/** Pontas aparadas; as quebras de linha internas ficam. */
export function normalizarDescricao(descricao: string): string {
  return descricao.trim();
}

/**
 * Nome único pelo slug do **nome** das outras demandas (não pelo `id`: uma demanda renomeada
 * libera o nome antigo). `ignorarId` é a própria demanda na edição.
 */
export function validarNomeDemanda(nome: string, demandas: Demanda[], ignorarId?: string): string | undefined {
  const normalizado = normalizarNomeDemanda(nome);
  if (normalizado.length > MAX_NOME_DEMANDA) return `Máximo de ${MAX_NOME_DEMANDA} caracteres.`;
  const slug = normalizarIdDemanda(normalizado);
  if (!slug) return "Informe um nome com letras ou números.";
  const existente = demandas.find((d) => d.id !== ignorarId && normalizarIdDemanda(d.nome) === slug);
  if (existente) return `Já existe a demanda "${existente.nome}".`;
  return undefined;
}

export function validarDescricao(descricao: string): string | undefined {
  return normalizarDescricao(descricao).length > MAX_DESCRICAO_DEMANDA
    ? `Máximo de ${MAX_DESCRICAO_DEMANDA} caracteres.`
    : undefined;
}
