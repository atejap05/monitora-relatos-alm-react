// Tester responsável (RF-22). Mesma regra do STORE._texto_tester: pontas aparadas e espaços internos
// únicos; o limite vale depois de normalizar.
import type { Relato } from "@/@types/backend";

export const MAX_TEXTO_TESTER = 120;

export function normalizarTester(texto: string): string {
  return texto.split(/\s+/).filter(Boolean).join(" ");
}

export function validarTester(texto: string): string | undefined {
  return normalizarTester(texto).length > MAX_TEXTO_TESTER ? `Máximo de ${MAX_TEXTO_TESTER} caracteres.` : undefined;
}

/** Nomes já usados em qualquer demanda, sem repetir por maiúsculas, em ordem alfabética pt-BR. */
export function sugestoesTester(relatos: Relato[]): string[] {
  const porChave = new Map<string, string>();
  for (const { testerNome } of relatos) {
    const nome = normalizarTester(testerNome ?? "");
    const chave = nome.toLocaleLowerCase("pt-BR");
    if (nome && !porChave.has(chave)) porChave.set(chave, nome);
  }
  return [...porChave.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
