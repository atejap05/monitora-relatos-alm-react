import { describe, expect, it } from "vitest";
import type { Demanda } from "@/@types/backend";
import { normalizarNomeDemanda, validarDescricao, validarNomeDemanda } from "./demandas";
import { normalizarIdDemanda } from "./numeros";

const demanda = (id: string, nome: string): Demanda => ({
  id,
  nome,
  abaSheets: "",
  totalMonitorados: 0,
  totalCandidatos: 0,
});

describe("demandas", () => {
  it("slug sem acento, igual ao STORE (NFKD)", () => {
    expect(normalizarIdDemanda("Homologação Março")).toBe("homologacao-marco");
    expect(normalizarIdDemanda("NFSe local")).toBe("nfse-local");
    expect(normalizarIdDemanda(" -- ")).toBe("");
  });

  it("normaliza espaços do nome", () => {
    expect(normalizarNomeDemanda("  Homologação   Março ")).toBe("Homologação Março");
  });

  it("recusa nome duplicado pelo slug do nome, não pelo id", () => {
    // A demanda-a foi renomeada: "Demanda A" ficou livre, "Homologação" não.
    const lista = [demanda("demanda-a", "Homologação"), demanda("demanda-b", "Demanda B")];
    expect(validarNomeDemanda("demanda a", lista)).toBeUndefined();
    expect(validarNomeDemanda("HOMOLOGACAO", lista)).toBe('Já existe a demanda "Homologação".');
    expect(validarNomeDemanda("homologação", lista, "demanda-a")).toBeUndefined();
    expect(validarNomeDemanda("Demanda-B", lista, "demanda-a")).toBe('Já existe a demanda "Demanda B".');
  });

  it("limites de 80 e 500 caracteres depois de normalizar", () => {
    expect(validarNomeDemanda("x".repeat(80), [])).toBeUndefined();
    expect(validarNomeDemanda("x".repeat(81), [])).toBe("Máximo de 80 caracteres.");
    expect(validarNomeDemanda(`  ${"x".repeat(80)}  `, [])).toBeUndefined();
    expect(validarNomeDemanda("  ", [])).toBe("Informe um nome com letras ou números.");
    expect(validarDescricao("y".repeat(500))).toBeUndefined();
    expect(validarDescricao(` ${"y".repeat(500)}\n`)).toBeUndefined();
    expect(validarDescricao("y".repeat(501))).toBe("Máximo de 500 caracteres.");
  });
});
