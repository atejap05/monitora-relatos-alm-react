import { describe, expect, it } from "vitest";
import type { Relato } from "@/@types/backend";
import { MAX_TEXTO_TESTER, normalizarTester, sugestoesTester, validarTester } from "./tester";

const relato = (numeroAlm: string, testerNome?: string | null): Relato => ({ demandaId: "a", numeroAlm, testerNome });

describe("tester", () => {
  it("normaliza como o STORE", () => {
    expect(normalizarTester("  Fulano   de\tTal ")).toBe("Fulano de Tal");
    expect(normalizarTester("   ")).toBe("");
  });

  it("limite vale depois de normalizar", () => {
    expect(validarTester(` ${"x".repeat(MAX_TEXTO_TESTER)} `)).toBeUndefined();
    expect(validarTester("x".repeat(MAX_TEXTO_TESTER + 1))).toMatch(/120/);
  });

  it("sugere nomes distintos de todas as demandas, em ordem alfabética", () => {
    const relatos = [
      relato("1", "Ângela"),
      relato("2", "bruno"),
      relato("3", "BRUNO"),
      relato("4", null),
      relato("5", "Ana"),
      relato("6"),
    ];
    expect(sugestoesTester(relatos)).toEqual(["Ana", "Ângela", "bruno"]);
  });
});
