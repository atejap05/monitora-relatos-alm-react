import { describe, expect, it } from "vitest";
import type { Relato } from "@/@types/backend";
import { categoriaEstado, demandaConcluida, infoCategoria, ROTULO_CATEGORIA } from "./categorias";

// Mesmos casos de scripts/test_store_modelo.py (test_categoria_estado) no vsrun.
const ESTADOS_RELATO_ALM: [string, string][] = [
  ["Rascunho", "aberto"],
  ["Aberto", "aberto"],
  ["Preparado", "em-atendimento"],
  ["Em Atendimento", "em-atendimento"],
  ["Atendido", "em-atendimento"],
  ["Em Teste", "em-atendimento"],
  ["Testado", "em-atendimento"],
  ["Liberado", "em-atendimento"],
  ["Liberado para Teste", "aguardando-rfb"],
  ["Em Homologação", "aguardando-rfb"],
  ["Concluído", "concluido"],
];
const PREFIXO = "br.gov.serpro.alm.fluxo.Relato.state.";

describe("categoriaEstado (paridade com STORE.categoria_estado)", () => {
  it.each(ESTADOS_RELATO_ALM)("%s → %s", (titulo, esperada) => {
    expect(categoriaEstado(null, titulo)).toBe(esperada);
  });

  it("normaliza acento, caixa e espaços", () => {
    expect(categoriaEstado(null, "  em   HOMOLOGACAO ")).toBe("aguardando-rfb");
  });

  it("estadoId medido prevalece sobre o título", () => {
    expect(categoriaEstado(`${PREFIXO}s1`, "Outro nome")).toBe("concluido");
    expect(categoriaEstado(`${PREFIXO}s13`, null)).toBe("aguardando-rfb");
    expect(categoriaEstado(`${PREFIXO}s4`, "")).toBe("aberto");
  });

  it("comparação exata, estado novo e nunca consultado", () => {
    expect(categoriaEstado(null, "Liberado")).not.toBe(categoriaEstado(null, "Liberado para Teste"));
    expect(categoriaEstado(null, "Cancelado")).toBe("desconhecido");
    expect(categoriaEstado(null, null)).toBe("desconhecido");
  });

  it("categoria fora do contrato cai em desconhecido", () => {
    expect(infoCategoria("inventada").variante).toBe("neutral");
  });
});

describe("demandaConcluida (RF-27, paridade com STORE.resumo_demanda)", () => {
  const relato = (categoriaStatus: Relato["categoriaStatus"]): Relato => ({
    demandaId: "d",
    numeroAlm: "1",
    categoriaStatus,
  });

  it("exige pelo menos um relato e todos concluídos", () => {
    expect(demandaConcluida([])).toBe(false);
    expect(demandaConcluida([relato("concluido"), relato("concluido")])).toBe(true);
    expect(demandaConcluida([relato("concluido"), relato("aguardando-rfb")])).toBe(false);
    expect(demandaConcluida([relato(null)])).toBe(false);
  });

  it("rótulos iguais aos da coluna Categoria do CSV", () => {
    // STORE.ROTULOS_CATEGORIA no vsrun.
    expect(ROTULO_CATEGORIA).toEqual({
      aberto: "Aberto",
      "em-atendimento": "Em atendimento (TI)",
      "aguardando-rfb": "Aguardando RFB",
      concluido: "Concluído",
      desconhecido: "Desconhecido",
    });
  });
});
