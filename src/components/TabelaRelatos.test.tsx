import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "nfse-ds";
import { describe, expect, it, vi } from "vitest";
import type { Relato } from "@/@types/backend";
import { TabelaRelatos, type TabelaRelatosProps } from "./TabelaRelatos";

const RELATOS: Relato[] = [
  {
    demandaId: "a",
    numeroAlm: "5483739",
    titulo: "Emissão falha",
    status: "Liberado para Teste",
    categoriaStatus: "aguardando-rfb",
    situacaoConsulta: "ok",
  },
  {
    demandaId: "a",
    numeroAlm: "5477222",
    titulo: "Cálculo ISS",
    status: "Concluído",
    categoriaStatus: "concluido",
    situacaoConsulta: "ok",
    anotacoes: "Cobrar retorno",
    ultimaConsultaAlm: "2026-09-23T10:00:00-03:00",
    testerNome: "Maria Souza",
  },
  {
    demandaId: "a",
    numeroAlm: "5489614",
    titulo: "Retenção",
    status: "Aberto",
    categoriaStatus: "aberto",
    situacaoConsulta: "sessao-caiu",
    ultimaConsultaAlm: "2026-09-22T09:00:00-03:00",
  },
];

function montar(extra: Partial<TabelaRelatosProps> = {}) {
  const props: TabelaRelatosProps = {
    relatos: RELATOS,
    filtro: "",
    onFiltroChange: vi.fn(),
    podeConsultarAlm: true,
    podeEditarLocal: true,
    onAtualizar: vi.fn(),
    onEditar: vi.fn(),
    onExcluir: vi.fn(),
    onAbrirNoAlm: vi.fn(),
    ...extra,
  };
  render(
    <TooltipProvider>
      <TabelaRelatos {...props} />
    </TooltipProvider>,
  );
  return props;
}

/** Abre o menu hambúrguer da linha (Radix abre pelo teclado de forma estável no jsdom). */
async function abrirMenu(numero: string) {
  const gatilho = screen.getByRole("button", { name: `Ações do relato ${numero}` });
  gatilho.focus();
  await userEvent.keyboard("{Enter}");
  return screen.findByRole("menu");
}

const numerosNaTela = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((linha) => within(linha).getAllByRole("cell")[0].textContent);

describe("TabelaRelatos", () => {
  it("ordena por número ALM e mostra anotações", () => {
    montar();
    expect(numerosNaTela()).toEqual(["5477222", "5483739", "5489614"]);
    expect(screen.getByText("Cobrar retorno")).toBeInTheDocument();
  });

  it("filtra pelo texto", () => {
    montar({ filtro: "emissão" });
    expect(numerosNaTela()).toEqual(["5483739"]);
  });

  it("status vira badge com a categoria e ordena pelo fluxo", async () => {
    montar();
    const badge = (texto: string) => screen.getByText(texto).closest("[data-categoria]");
    expect(badge("Aberto")).toHaveAttribute("data-categoria", "aberto");
    expect(badge("Liberado para Teste")).toHaveAttribute("data-categoria", "aguardando-rfb");
    expect(badge("Concluído")).toHaveAttribute("data-categoria", "concluido");

    await userEvent.click(screen.getByRole("button", { name: /Status ALM/ }));
    // aberto → aguardando RFB → concluído
    expect(numerosNaTela()).toEqual(["5489614", "5483739", "5477222"]);
  });

  it("coluna Tester entre Título e Status ALM; sem tester fica no fim nas duas ordens", async () => {
    const relatos: Relato[] = [
      ...RELATOS.slice(0, 2),
      { ...RELATOS[2], testerNome: "Ana Lima" },
    ];
    montar({ relatos });
    const cabecalhos = screen.getAllByRole("columnheader").map((th) => th.textContent?.replace(/[▲▼]/g, ""));
    expect(cabecalhos.slice(1, 4)).toEqual(["Título", "Tester", "Status ALM"]);
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();

    const botao = screen.getByRole("button", { name: /^Tester/ });
    await userEvent.click(botao);
    expect(numerosNaTela()).toEqual(["5489614", "5477222", "5483739"]);
    await userEvent.click(botao);
    expect(numerosNaTela()).toEqual(["5477222", "5489614", "5483739"]);
  });

  it("filtra pelo nome do tester", () => {
    montar({ filtro: "souza" });
    expect(numerosNaTela()).toEqual(["5477222"]);
  });

  it("não tem mais a coluna Situação", () => {
    montar();
    const cabecalhos = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(cabecalhos.some((c) => c?.includes("Situação"))).toBe(false);
    expect(cabecalhos.some((c) => c?.includes("Ações"))).toBe(true);
  });

  it("situação diferente de ok vira alerta na Última consulta", () => {
    montar();
    expect(screen.getByRole("img", { name: "Sessão expirada na última consulta" })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByText("Não consultado")).toBeInTheDocument();
  });

  it("aciona as ações pelo menu da linha", async () => {
    const props = montar();
    await userEvent.click(within(await abrirMenu("5477222")).getByRole("menuitem", { name: "Editar" }));
    expect(props.onEditar).toHaveBeenCalledWith(RELATOS[1]);

    await userEvent.click(within(await abrirMenu("5483739")).getByRole("menuitem", { name: "Excluir" }));
    expect(props.onExcluir).toHaveBeenCalledWith(RELATOS[0]);

    await userEvent.click(within(await abrirMenu("5477222")).getByRole("menuitem", { name: "Atualizar" }));
    expect(props.onAtualizar).toHaveBeenCalledWith(RELATOS[1]);
  });

  it("o número abre o relato no ALM, também pelo menu, mesmo sem sessão", async () => {
    const props = montar({ podeConsultarAlm: false });
    await userEvent.click(screen.getByRole("button", { name: "Abrir o relato 5483739 no ALM" }));
    expect(props.onAbrirNoAlm).toHaveBeenCalledWith(RELATOS[0]);
    await userEvent.click(within(await abrirMenu("5477222")).getByRole("menuitem", { name: "Abrir no ALM" }));
    expect(props.onAbrirNoAlm).toHaveBeenLastCalledWith(RELATOS[1]);
  });

  it("ocupado, o link do número fica desabilitado", () => {
    montar({ podeConsultarAlm: false, podeEditarLocal: false });
    expect(screen.getByRole("button", { name: "Abrir o relato 5477222 no ALM" })).toBeDisabled();
  });

  it("sem sessão ALM, Atualizar fica desabilitado e Editar não", async () => {
    montar({ podeConsultarAlm: false });
    const menu = await abrirMenu("5477222");
    expect(within(menu).getByRole("menuitem", { name: "Atualizar" })).toHaveAttribute("aria-disabled", "true");
    expect(within(menu).getByRole("menuitem", { name: "Editar" })).not.toHaveAttribute("aria-disabled");
  });

  it("ocupado (nada permitido), o menu nem abre", () => {
    montar({ podeConsultarAlm: false, podeEditarLocal: false });
    expect(screen.getByRole("button", { name: "Ações do relato 5477222" })).toBeDisabled();
  });

  it("lista vazia orienta o cadastro", () => {
    montar({ relatos: [] });
    expect(screen.getByText(/Nenhum relato monitorado/)).toBeInTheDocument();
  });
});
