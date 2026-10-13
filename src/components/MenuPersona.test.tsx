import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pedir } from "@/bridge/pedir";
import { useSessao } from "@/state/sessao";
import { MenuPersona } from "./MenuPersona";

vi.mock("@/bridge/pedir", () => ({
  pedir: vi.fn(),
  usandoMock: false,
}));

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MenuPersona />
    </QueryClientProvider>,
  );
}

async function abrirMenu() {
  screen.getByRole("button", { name: "Menu do usuário" }).focus();
  await userEvent.keyboard("{Enter}");
  return screen.findByRole("menu");
}

describe("MenuPersona", () => {
  beforeEach(() => {
    useSessao.setState({
      carregado: true,
      fase: "nao_autenticado",
      autenticado: false,
      sessaoCaiu: false,
      persona: { nome: "Fulana de Tal", cpf: "CPF 000.***.***-00", iniciais: "FT" },
      versaoScript: "0.11.0",
      varreduraAoAbrir: true,
      statusTexto: "",
      varredura: null,
      encerrado: false,
    });
    vi.mocked(pedir).mockReset();
    vi.mocked(pedir).mockImplementation(async (payload) => {
      if (payload.acao === "criar_atalho") return { ok: true, recriado: false };
      if (payload.acao === "fechar") return { ok: true, fase: "encerrando" };
      return { ok: false, erro: "acao-desconhecida" };
    });
  });

  it("mostra a persona e pede o atalho e o Fechar", async () => {
    montar();
    expect(screen.getByText("Fulana de Tal")).toBeInTheDocument();
    expect(screen.getByText("FT")).toBeInTheDocument();

    const menu = await abrirMenu();
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Criar atalho na área de trabalho" }));
    expect(pedir).toHaveBeenCalledWith({ acao: "criar_atalho" });

    const menuDeNovo = await abrirMenu();
    await userEvent.click(within(menuDeNovo).getByRole("menuitem", { name: "Fechar" }));
    expect(pedir).toHaveBeenCalledWith({ acao: "fechar" });
  });

  it("desabilita o atalho com a tela ocupada e mantém o Fechar", async () => {
    useSessao.setState({ fase: "autenticando" });
    montar();
    const menu = await abrirMenu();
    expect(within(menu).getByRole("menuitem", { name: "Criar atalho na área de trabalho" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(menu).getByRole("menuitem", { name: "Fechar" })).not.toHaveAttribute("aria-disabled", "true");
  });
});
