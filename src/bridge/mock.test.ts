import { describe, expect, it, vi } from "vitest";
import type { Evento } from "@/@types/backend";
import { MockBackend } from "./mock";

type Resp = Record<string, unknown> & { ok: boolean; erro?: string };

function criar(opcoes: { varreduraAoAbrir?: boolean } = {}) {
  const eventos: Evento[] = [];
  const mock = new MockBackend({
    latenciaMs: 0,
    consultaMs: 0,
    passoAuthMs: 0,
    storage: null,
    emitir: (e) => eventos.push(e),
    ...opcoes,
  });
  const pedir = (p: Parameters<MockBackend["pedir"]>[0]) => mock.pedir(p) as Promise<Resp>;
  const autenticar = async () => {
    await pedir({ acao: "autenticar" });
    await vi.waitFor(async () => {
      const s = await pedir({ acao: "status_sessao" });
      expect(s.autenticado).toBe(true);
    });
  };
  return { mock, eventos, pedir, autenticar };
}

describe("MockBackend", () => {
  it("semeia A/B/C e carrega antes da auth", async () => {
    const { pedir } = criar();
    const r = await pedir({ acao: "carregar_estado" });
    expect((r.demandas as { id: string }[]).map((d) => d.id)).toEqual(["demanda-a", "demanda-b", "demanda-c"]);
  });

  it("recusa ações ALM sem sessão", async () => {
    const { pedir } = criar();
    const r = await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-a", numerosAlm: ["5477222"] });
    expect(r).toMatchObject({ ok: false, erro: "nao-autenticado" });
  });

  it("autentica emitindo as fases na ordem", async () => {
    const { eventos, autenticar } = criar();
    await autenticar();
    const fases = eventos.filter((e) => e.tipo === "fase").map((e) => (e as { fase: string }).fase);
    expect(fases).toEqual(["autenticando", "aquecendo_ccm", "autenticado"]);
  });

  it("cadastra lote: ok, 404 fora da lista, id inválido sem consulta", async () => {
    const { pedir, autenticar } = criar();
    await autenticar();
    const r = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5477222", "999999999", "2147483648"],
    });
    const resultados = r.resultados as { numeroAlm: string; ok: boolean; erro?: string }[];
    expect(resultados.map((x) => [x.numeroAlm, x.ok, x.erro ?? null])).toEqual([
      ["5477222", true, null],
      ["999999999", false, "nao-encontrado"],
      ["2147483648", false, "id-invalido"],
    ]);
    expect((r.relatos as { numeroAlm: string }[]).map((x) => x.numeroAlm)).toEqual(["5477222"]);
  });

  it("edita anotações, preserva na varredura e exclui", async () => {
    const { pedir, autenticar } = criar();
    await autenticar();
    await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-b", numerosAlm: ["5483739"] });

    const editado = await pedir({ acao: "editar_relato", numeroAlm: "5483739", anotacoes: " nota " });
    expect(editado.relato).toMatchObject({ anotacoes: "nota" });
    expect(editado.relato).not.toHaveProperty("observacoes");

    const longo = await pedir({ acao: "editar_relato", numeroAlm: "5483739", anotacoes: "x".repeat(2001) });
    expect(longo).toMatchObject({ ok: false, erro: "texto-longo" });

    const varrido = await pedir({ acao: "atualizar_todos", demandaId: "demanda-b" });
    expect(varrido).toMatchObject({ ok: true, total: 1, okCount: 1 });
    expect((varrido.relatos as { anotacoes: string }[])[0].anotacoes).toBe("nota");

    const excluido = await pedir({ acao: "excluir_relato", numeroAlm: "5483739" });
    expect(excluido).toMatchObject({ ok: true, removido: "5483739", relatos: [] });
    const deNovo = await pedir({ acao: "excluir_relato", numeroAlm: "5483739" });
    expect(deNovo).toMatchObject({ ok: false, erro: "relato-desconhecido" });
  });

  it("varredura emite progresso e fim com o estado", async () => {
    const { pedir, eventos, autenticar } = criar();
    await autenticar();
    await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-a", numerosAlm: ["11", "22"] });
    eventos.length = 0;
    await pedir({ acao: "atualizar_todos" });
    const tipos = eventos.map((e) => e.tipo);
    expect(tipos).toEqual(["varredura", "varredura", "varredura", "varredura-fim"]);
    const fim = eventos.at(-1) as Extract<Evento, { tipo: "varredura-fim" }>;
    expect(fim.relatos).toHaveLength(2);
  });

  it("401 derruba a sessão e para o lote", async () => {
    const { pedir, eventos, autenticar } = criar();
    await autenticar();
    const r = await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-a", numerosAlm: ["401", "5477222"] });
    expect(r.sessaoCaiu).toBe(true);
    expect((r.resultados as unknown[]).length).toBe(1);
    expect(eventos.some((e) => e.tipo === "sessao-caiu")).toBe(true);
    const status = await pedir({ acao: "status_sessao" });
    expect(status.autenticado).toBe(false);
  });

  it("relatos saem com a categoria do estado, que não vai para o storage", async () => {
    const { pedir, autenticar } = criar({ varreduraAoAbrir: false });
    await autenticar();
    const r = await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-a", numerosAlm: ["5477222", "5477223"] });
    const relatos = r.relatos as { status: string; categoriaStatus: string }[];
    for (const relato of relatos) {
      expect(relato.categoriaStatus).not.toBe("desconhecido");
      expect(["aberto", "em-atendimento", "aguardando-rfb", "concluido"]).toContain(relato.categoriaStatus);
    }
    const lote = r.resultados as { relato: { categoriaStatus: string } }[];
    expect(lote[0].relato.categoriaStatus).toBe(relatos[0].categoriaStatus);
  });

  it("abrir no ALM: sem sessão, qualquer número válido, URL do itemName", async () => {
    const { pedir } = criar();
    expect(await pedir({ acao: "abrir_no_alm", numeroAlm: "5477222" })).toEqual({
      ok: true,
      url: "https://alm.serpro/ccm/resource/itemName/com.ibm.team.workitem.WorkItem/5477222",
    });
    expect(await pedir({ acao: "abrir_no_alm", numeroAlm: "2147483648" })).toMatchObject({ erro: "id-invalido" });
  });

  it("tester: vale para o lote, recadastro sem nome preserva, edição limpa, nome longo recusa o lote", async () => {
    const { pedir, autenticar } = criar({ varreduraAoAbrir: false });
    await autenticar();
    type Lista = { numeroAlm: string; testerNome?: string | null }[];
    const nomes = (r: Resp) => Object.fromEntries((r.relatos as Lista).map((x) => [x.numeroAlm, x.testerNome ?? null]));

    const lote = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5477222", "5483739", "999999999"],
      testerNome: "  Fulano   de Tal ",
    });
    expect(nomes(lote)).toEqual({ "5477222": "Fulano de Tal", "5483739": "Fulano de Tal" });

    const recadastro = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5477222"],
      testerNome: "",
    });
    expect(nomes(recadastro)["5477222"]).toBe("Fulano de Tal");

    const longo = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5489614"],
      testerNome: "x".repeat(121),
    });
    expect(longo).toMatchObject({ ok: false, erro: "texto-longo" });
    expect(Object.keys(nomes(await pedir({ acao: "carregar_estado" })))).not.toContain("5489614");

    const limpo = await pedir({ acao: "editar_relato", numeroAlm: "5483739", testerNome: "" });
    expect(limpo.relato).toMatchObject({ testerNome: null });
    const mantido = await pedir({ acao: "editar_relato", numeroAlm: "5477222", anotacoes: "nota" });
    expect(mantido.relato).toMatchObject({ testerNome: "Fulano de Tal", anotacoes: "nota" });
    const editadoLongo = await pedir({ acao: "editar_relato", numeroAlm: "5477222", testerNome: "x".repeat(121) });
    expect(editadoLongo).toMatchObject({ ok: false, erro: "texto-longo" });

    const varrido = await pedir({ acao: "atualizar_todos" });
    expect(nomes(varrido)["5477222"]).toBe("Fulano de Tal");
  });

  it("anotação no cadastro: vale para o lote, vazia preserva, longa recusa o lote", async () => {
    const { pedir, autenticar } = criar({ varreduraAoAbrir: false });
    await autenticar();
    type Lista = { numeroAlm: string; anotacoes?: string | null; anotacoesAtualizadasEm?: string | null }[];
    const notas = (r: Resp) => Object.fromEntries((r.relatos as Lista).map((x) => [x.numeroAlm, x.anotacoes ?? null]));

    const lote = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5477222", "5483739"],
      anotacoes: "  cobrar retorno ",
    });
    expect(notas(lote)).toEqual({ "5477222": "cobrar retorno", "5483739": "cobrar retorno" });
    expect((lote.relatos as Lista).every((x) => Boolean(x.anotacoesAtualizadasEm))).toBe(true);

    const recadastro = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5477222"],
      anotacoes: "",
    });
    expect(notas(recadastro)["5477222"]).toBe("cobrar retorno");

    const longo = await pedir({
      acao: "cadastrar_relatos",
      demandaId: "demanda-a",
      numerosAlm: ["5489614"],
      anotacoes: "x".repeat(2001),
    });
    expect(longo).toMatchObject({ ok: false, erro: "texto-longo" });
    expect(Object.keys(notas(await pedir({ acao: "carregar_estado" })))).not.toContain("5489614");
  });

  it("cria demanda com slug e recusa nome vazio", async () => {
    const { pedir } = criar();
    const r = await pedir({ acao: "registrar_demanda", nome: "Demanda D" });
    expect(r.demanda).toMatchObject({ id: "demanda-d", nome: "Demanda D" });
    expect(await pedir({ acao: "registrar_demanda", nome: "  " })).toMatchObject({ erro: "demanda-invalida" });
  });

  it("cria com acento e descrição, recusa duplicada e usa sufixo depois de renomear (RF-23/24)", async () => {
    const { pedir } = criar();
    const r = await pedir({ acao: "registrar_demanda", nome: " Homologação  Março ", descricao: " Objetivo\nlinha 2 " });
    expect(r.demanda).toMatchObject({
      id: "homologacao-marco",
      nome: "Homologação Março",
      descricao: "Objetivo\nlinha 2",
      totalMonitorados: 0,
    });
    expect((r.demanda as { criadaEm: string }).criadaEm).toBeTruthy();
    expect(await pedir({ acao: "registrar_demanda", nome: "HOMOLOGACAO marco" })).toMatchObject({
      ok: false,
      erro: "demanda-duplicada",
    });
    expect(await pedir({ acao: "registrar_demanda", nome: "x".repeat(81) })).toMatchObject({ erro: "texto-longo" });
    expect(await pedir({ acao: "registrar_demanda", nome: "D", descricao: "y".repeat(501) })).toMatchObject({
      erro: "texto-longo",
    });

    const editada = await pedir({ acao: "editar_demanda", demandaId: "homologacao-marco", nome: "Homologação Abril" });
    expect(editada.demanda).toMatchObject({ id: "homologacao-marco", nome: "Homologação Abril", descricao: "Objetivo\nlinha 2" });
    const limpa = await pedir({ acao: "editar_demanda", demandaId: "homologacao-marco", nome: "Homologação Abril", descricao: "" });
    expect(limpa.demanda).toMatchObject({ descricao: null });
    expect(await pedir({ acao: "editar_demanda", demandaId: "homologacao-marco", nome: "Demanda A" })).toMatchObject({
      erro: "demanda-duplicada",
    });
    expect(await pedir({ acao: "editar_demanda", demandaId: "nao-existe", nome: "X" })).toMatchObject({
      erro: "demanda-desconhecida",
    });

    const denovo = await pedir({ acao: "registrar_demanda", nome: "Homologação Março" });
    expect(denovo.demanda).toMatchObject({ id: "homologacao-marco-2" });
  });

  it("exclui em cascata e não ressemeia A/B/C ao reabrir (RF-25, RF-17)", async () => {
    const memoria = new Map<string, string>();
    const storage = {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => void memoria.set(k, v),
    } as unknown as Storage;
    const opcoes = { latenciaMs: 0, consultaMs: 0, passoAuthMs: 0, storage, emitir: () => undefined };
    const mock = new MockBackend({ ...opcoes, varreduraAoAbrir: false });
    const pedir = (p: Parameters<MockBackend["pedir"]>[0]) => mock.pedir(p) as Promise<Resp>;
    await pedir({ acao: "autenticar" });
    await vi.waitFor(async () => expect((await pedir({ acao: "status_sessao" })).autenticado).toBe(true));
    await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-a", numerosAlm: ["5477222", "5483739"] });
    await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-b", numerosAlm: ["5489614"] });

    const r = await pedir({ acao: "excluir_demanda", demandaId: "demanda-a" });
    expect(r).toMatchObject({ ok: true, removida: "demanda-a", relatosRemovidos: 2 });
    expect((r.relatos as { numeroAlm: string }[]).map((x) => x.numeroAlm)).toEqual(["5489614"]);
    expect(await pedir({ acao: "excluir_demanda", demandaId: "demanda-a" })).toMatchObject({
      erro: "demanda-desconhecida",
    });
    await pedir({ acao: "excluir_demanda", demandaId: "demanda-b" });
    await pedir({ acao: "excluir_demanda", demandaId: "demanda-c" });

    const reaberto = new MockBackend(opcoes);
    const estado = (await reaberto.pedir({ acao: "carregar_estado" })) as Resp;
    expect(estado.demandas).toEqual([]);
    expect(estado.relatos).toEqual([]);
  });

  it("lista antiga sem a marca só recebe a marca", async () => {
    const memoria = new Map<string, string>([
      [
        "monitora-relatos-alm-mock",
        JSON.stringify({
          demandas: [{ id: "demanda-a", nome: "Demanda A", abaSheets: "" }],
          relatos: [],
          atualizadoEm: null,
          consultas: {},
        }),
      ],
    ]);
    const storage = {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => void memoria.set(k, v),
    } as unknown as Storage;
    const mock = new MockBackend({ latenciaMs: 0, storage, emitir: () => undefined });
    const estado = (await mock.pedir({ acao: "carregar_estado" })) as Resp;
    expect(estado.demandas).toEqual([
      expect.objectContaining({ id: "demanda-a", descricao: null, criadaEm: null }),
    ]);
    expect(JSON.parse(memoria.get("monitora-relatos-alm-mock") ?? "{}").demandasSemeadas).toBe(true);
  });

  it("exporta sem sessão, com resumo e exportadaEm; falha simulada não marca (RF-26)", async () => {
    const { pedir, autenticar } = criar({ varreduraAoAbrir: false });
    await autenticar();
    await pedir({ acao: "cadastrar_relatos", demandaId: "demanda-a", numerosAlm: ["5477222", "5483739"] });

    const r = await pedir({ acao: "exportar_demanda", demandaId: "demanda-a" });
    expect(r.ok).toBe(true);
    const arquivos = r.arquivos as string[];
    expect(arquivos[0]).toMatch(/\\monitora-alm_demanda-a_\d{8}-\d{6}\.json$/);
    expect(arquivos[1]).toMatch(/\.csv$/);
    expect(r.resumo).toMatchObject({ total: 2 });
    const exportadaEm = (r.demanda as { exportadaEm: string }).exportadaEm;
    expect(exportadaEm).toBeTruthy();
    const estado = await pedir({ acao: "carregar_estado" });
    expect((estado.demandas as { id: string; exportadaEm: string }[])[0].exportadaEm).toBe(exportadaEm);

    expect(await pedir({ acao: "exportar_demanda", demandaId: "nao-existe" })).toMatchObject({
      erro: "demanda-desconhecida",
    });
    await pedir({ acao: "registrar_demanda", nome: "Falha exportacao" });
    expect(await pedir({ acao: "exportar_demanda", demandaId: "falha-exportacao" })).toMatchObject({
      ok: false,
      erro: "exportacao-falhou",
    });
  });
});
