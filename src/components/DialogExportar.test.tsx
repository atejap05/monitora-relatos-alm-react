import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Demanda, Relato, RespostaExportar } from "@/@types/backend";
import { DialogExportar } from "./DialogExportar";

const exportarDemanda = vi.fn();
vi.mock("@/service/backend", async (original) => {
  const real = await original<typeof import("@/service/backend")>();
  return { ...real, backend: { ...real.backend, exportarDemanda: (id: string) => exportarDemanda(id) } };
});

const DEMANDA: Demanda = {
  id: "homologacao-marco",
  nome: "Homologação Março",
  abaSheets: "",
  totalMonitorados: 1,
  totalCandidatos: 0,
};
const RELATOS: Relato[] = [{ demandaId: DEMANDA.id, numeroAlm: "5477222", categoriaStatus: "concluido" }];
const ARQUIVOS: [string, string] = [
  "C:\\Downloads\\monitora-alm_homologacao-marco_20260925-160000.json",
  "C:\\Downloads\\monitora-alm_homologacao-marco_20260925-160000.csv",
];

function resposta(): RespostaExportar {
  return {
    ok: true,
    demandas: [{ ...DEMANDA, exportadaEm: "2026-09-25T16:00:00-03:00" }],
    relatos: RELATOS,
    demanda: { ...DEMANDA, exportadaEm: "2026-09-25T16:00:00-03:00" },
    arquivos: ARQUIVOS,
    pasta: "C:\\Downloads",
    resumo: {
      total: 1,
      porCategoria: { aberto: 0, "em-atendimento": 0, "aguardando-rfb": 0, concluido: 1, desconhecido: 0 },
      concluida: true,
    },
  };
}

function montar(onExcluir = vi.fn(), onClose = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DialogExportar demanda={DEMANDA} relatos={RELATOS} onClose={onClose} onExcluir={onExcluir} />
    </QueryClientProvider>,
  );
  return { onExcluir, onClose };
}

describe("DialogExportar", () => {
  beforeEach(() => exportarDemanda.mockReset());

  it("mostra o resumo e que nunca exportou, antes de gravar", () => {
    montar();
    expect(screen.getByText("Exportar a demanda Homologação Março")).toBeInTheDocument();
    expect(screen.getByText("1 concluídos")).toBeInTheDocument();
    expect(screen.getByText(/Esta demanda ainda não foi exportada/)).toBeInTheDocument();
    expect(exportarDemanda).not.toHaveBeenCalled();
  });

  it("exporta, lista os caminhos e oferece excluir em seguida (RF-27)", async () => {
    exportarDemanda.mockResolvedValue(resposta());
    const { onExcluir, onClose } = montar();
    await userEvent.click(screen.getByRole("button", { name: "Exportar" }));
    expect(exportarDemanda).toHaveBeenCalledWith(DEMANDA.id);
    expect(await screen.findByText(ARQUIVOS[0])).toBeInTheDocument();
    expect(screen.getByText(ARQUIVOS[1])).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Copiar o caminho ${ARQUIVOS[1]}` })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Excluir demanda" }));
    expect(onClose).toHaveBeenCalled();
    expect(onExcluir).toHaveBeenCalledWith(expect.objectContaining({ exportadaEm: "2026-09-25T16:00:00-03:00" }));
  });
});
