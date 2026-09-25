import { describe, expect, it } from "vitest";
import { analisarLote, normalizarIdDemanda, separarNumeros, validarNumeroAlm } from "./numeros";

describe("validarNumeroAlm (paridade com STORE.validar_numero_alm)", () => {
  it.each([
    ["5477222", "5477222"],
    [" 5477222 ", "5477222"],
    ["0005477222", "5477222"],
    ["2147483647", "2147483647"],
    ["1", "1"],
  ])("aceita %s", (bruto, canonico) => {
    expect(validarNumeroAlm(bruto)).toEqual({ ok: true, numero: canonico });
  });

  it.each(["0", "2147483648", "11111111111", "abc", "", "12a", "-5", "5.0"])("recusa %s", (bruto) => {
    expect(validarNumeroAlm(bruto).ok).toBe(false);
  });
});

describe("lote", () => {
  it("separa por linha, vírgula, ponto e vírgula e espaço, sem repetir", () => {
    expect(separarNumeros("5477222\n5483739, 5489614;5477222  11")).toEqual([
      "5477222",
      "5483739",
      "5489614",
      "11",
    ]);
  });

  it("separa válidos de inválidos e junta equivalentes", () => {
    const r = analisarLote("5477222 005477222 abc 2147483648");
    expect(r.validos).toEqual(["5477222"]);
    expect(r.invalidos.map((i) => i.bruto)).toEqual(["abc", "2147483648"]);
  });
});

describe("normalizarIdDemanda (paridade com STORE.normalizar_id_demanda)", () => {
  it.each([
    ["NFSe local", "nfse-local"],
    ["Demanda D", "demanda-d"],
    ["  API -- Calc!  ", "api-calc"],
    ["Homologação", "homologacao"],
    ["***", ""],
  ])("%s -> %s", (nome, id) => {
    expect(normalizarIdDemanda(nome)).toBe(id);
  });
});
