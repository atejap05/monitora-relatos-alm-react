import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Demanda } from "@/@types/backend";
import { DialogExcluirDemanda } from "./DialogExcluirDemanda";
import { MenuAcoesDemanda } from "./MenuAcoesDemanda";

const DEMANDA: Demanda = {
  id: "homologacao-marco",
  nome: "Homologação Março",
  abaSheets: "",
  descricao: "Objetivo da rodada",
  totalMonitorados: 2,
  totalCandidatos: 0,
};

async function abrirMenu() {
  screen.getByRole("button", { name: "Ações da demanda Homologação Março" }).focus();
  await userEvent.keyboard("{Enter}");
  return screen.findByRole("menu");
}

describe("MenuAcoesDemanda", () => {
  it("chama Editar, Exportar e Excluir com a demanda da aba", async () => {
    const onEditar = vi.fn();
    const onExportar = vi.fn();
    const onExcluir = vi.fn();
    render(
      <MenuAcoesDemanda
        demanda={DEMANDA}
        podeEditarLocal
        onEditar={onEditar}
        onExportar={onExportar}
        onExcluir={onExcluir}
      />,
    );
    await userEvent.click(within(await abrirMenu()).getByRole("menuitem", { name: "Editar" }));
    expect(onEditar).toHaveBeenCalledWith(DEMANDA);
    await userEvent.click(within(await abrirMenu()).getByRole("menuitem", { name: "Exportar" }));
    expect(onExportar).toHaveBeenCalledWith(DEMANDA);
    await userEvent.click(within(await abrirMenu()).getByRole("menuitem", { name: "Excluir" }));
    expect(onExcluir).toHaveBeenCalledWith(DEMANDA);
  });

  it("fica desabilitado quando a tela está ocupada", () => {
    render(
      <MenuAcoesDemanda
        demanda={DEMANDA}
        podeEditarLocal={false}
        onEditar={vi.fn()}
        onExportar={vi.fn()}
        onExcluir={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Ações da demanda Homologação Março" })).toBeDisabled();
  });
});

describe("DialogExcluirDemanda", () => {
  const montar = (demanda: Demanda, onExportar = vi.fn(), onClose = vi.fn()) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DialogExcluirDemanda demanda={demanda} onClose={onClose} onExcluida={vi.fn()} onExportar={onExportar} />
      </QueryClientProvider>,
    );

  it("mostra quantos relatos saem e oferece exportar quando nunca exportou (RF-27)", async () => {
    const onExportar = vi.fn();
    const onClose = vi.fn();
    montar(DEMANDA, onExportar, onClose);
    expect(screen.getByText("Excluir a demanda Homologação Março?")).toBeInTheDocument();
    expect(screen.getByText("2 relatos saem da lista local.")).toBeInTheDocument();
    expect(screen.getByText("Exporte antes, se precisar do histórico")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Exportar" }));
    expect(onClose).toHaveBeenCalled();
    expect(onExportar).toHaveBeenCalledWith(DEMANDA);
  });

  it("demanda já exportada mostra a data no lugar do aviso", () => {
    montar({ ...DEMANDA, exportadaEm: "2026-09-25T16:00:00-03:00" });
    expect(screen.getByText(/^Exportada em 25\/09\/2026/)).toBeInTheDocument();
    expect(screen.queryByText("Exporte antes, se precisar do histórico")).not.toBeInTheDocument();
  });

  it("demanda vazia não pede exportação", () => {
    montar({ ...DEMANDA, totalMonitorados: 0 });
    expect(screen.getByText("Nenhum relato sai da lista local.")).toBeInTheDocument();
    expect(screen.queryByText("Exporte antes, se precisar do histórico")).not.toBeInTheDocument();
  });
});
