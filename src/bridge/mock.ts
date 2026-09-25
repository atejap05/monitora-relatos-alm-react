// Backend em memória para `npm run dev:mock` e testes. Imita as regras de
// MonitoraRelatosAlm.py 0.9.0 + STORE: fases, ocupado-*, eventos, faixa do ID, 404 sem gravar, tester,
// CRUD de demandas com semeadura única, exportação (caminhos simulados; id com "falha-exportacao" falha).
//
// Números especiais:
//   999999999 e qualquer um começando por 9999 -> nao-encontrado (404)
//   401 -> sessao-caiu (a sessão ALM cai)

import type {
  Demanda,
  Estado,
  Evento,
  Fase,
  Payload,
  Relato,
  ResultadoLote,
  SituacaoConsulta,
} from "@/@types/backend";
import { categoriaEstado, contarCategorias, demandaConcluida } from "@/lib/categorias";
import {
  MAX_DESCRICAO_DEMANDA,
  MAX_NOME_DEMANDA,
  normalizarDescricao,
  normalizarNomeDemanda,
} from "@/lib/demandas";
import { MAX_TEXTO_ANOTACAO, normalizarIdDemanda, validarNumeroAlm } from "@/lib/numeros";
import { MAX_TEXTO_TESTER, normalizarTester } from "@/lib/tester";
import { emitirEvento } from "./eventos";

const CHAVE_STORAGE = "monitora-relatos-alm-mock";
// Igual a OSLC.url_web_relato (itemName do work item).
const URL_ITEM_NAME = "https://alm.serpro/ccm/resource/itemName/com.ibm.team.workitem.WorkItem/";
// Estados reais do Relato no ALM, um de cada categoria (domain-and-sync.md §5.3).
const STATUS_FALSOS = ["Aberto", "Em Atendimento", "Liberado para Teste", "Concluído"];
const DEMANDAS_PADRAO: [string, string][] = [
  ["demanda-a", "Demanda A"],
  ["demanda-b", "Demanda B"],
  ["demanda-c", "Demanda C"],
];

interface DemandaGuardada {
  id: string;
  nome: string;
  abaSheets: string;
  descricao?: string | null;
  criadaEm?: string | null;
  atualizadaEm?: string | null;
  exportadaEm?: string | null;
}

const PASTA_DOWNLOADS = "C:\\Users\\operador\\Downloads";

/** AAAAMMDD-HHMMSS na hora local, como STORE.prefixo_exportacao. */
function carimbo(data: Date): string {
  const d = (n: number) => String(n).padStart(2, "0");
  return (
    `${data.getFullYear()}${d(data.getMonth() + 1)}${d(data.getDate())}-` +
    `${d(data.getHours())}${d(data.getMinutes())}${d(data.getSeconds())}`
  );
}

interface Guardado {
  demandas: DemandaGuardada[];
  /** Como config.demandasSemeadas: A/B/C uma vez só (RF-17). */
  demandasSemeadas?: boolean;
  relatos: Relato[];
  atualizadoEm: string | null;
  consultas: Record<string, number>;
}

export interface OpcoesMock {
  latenciaMs?: number;
  consultaMs?: number;
  passoAuthMs?: number;
  varreduraAoAbrir?: boolean;
  storage?: Storage | null;
  emitir?: (evento: Evento) => void;
}

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const agora = () => new Date().toISOString();

function erro(codigo: string, mensagem?: string, extra?: Partial<Estado>) {
  return { ok: false as const, erro: codigo, ...(mensagem ? { mensagem } : {}), ...extra };
}

function testerLongo(nome: string | null | undefined): boolean {
  return nome != null && normalizarTester(nome).length > MAX_TEXTO_TESTER;
}

function erroTester() {
  return erro("texto-longo", `O nome do tester aceita ate ${MAX_TEXTO_TESTER} caracteres`);
}

/** Como STORE._validar_demanda. Devolve o erro ou os textos normalizados. */
function validarDemanda(
  demandas: DemandaGuardada[],
  nome: string | null | undefined,
  descricao: string | null | undefined,
  ignorarId?: string,
): ReturnType<typeof erro> | { nome: string; descricao: string | null | undefined } {
  const texto = normalizarNomeDemanda(nome ?? "");
  const desc = descricao == null ? descricao : normalizarDescricao(descricao);
  if (texto.length > MAX_NOME_DEMANDA || (desc != null && desc.length > MAX_DESCRICAO_DEMANDA)) {
    return erro(
      "texto-longo",
      `O nome da demanda aceita ate ${MAX_NOME_DEMANDA} caracteres e a descricao ate ${MAX_DESCRICAO_DEMANDA}`,
    );
  }
  const slug = normalizarIdDemanda(texto);
  if (!slug) return erro("demanda-invalida", "Demanda exige nome com letra ou digito");
  const outra = demandas.find((d) => d.id !== ignorarId && normalizarIdDemanda(d.nome) === slug);
  if (outra) return erro("demanda-duplicada", `Ja existe a demanda ${outra.nome}`);
  return { nome: texto, descricao: desc };
}

/** Como STORE._vista_relato: cópia com a categoria derivada, que não vai para o storage. */
function vista(relato: Relato): Relato {
  return { ...relato, categoriaStatus: categoriaEstado(relato.estadoId, relato.estadoTitulo ?? relato.status) };
}

export class MockBackend {
  private fase: Fase = "nao_autenticado";
  private sessaoAtiva = false;
  private varrendo = false;
  private parar = false;
  private varreuAoAbrir = false;
  private dados: Guardado;
  private readonly op: Required<Omit<OpcoesMock, "storage">> & { storage: Storage | null };

  constructor(opcoes: OpcoesMock = {}) {
    this.op = {
      latenciaMs: opcoes.latenciaMs ?? 250,
      consultaMs: opcoes.consultaMs ?? 500,
      passoAuthMs: opcoes.passoAuthMs ?? 900,
      varreduraAoAbrir: opcoes.varreduraAoAbrir ?? true,
      storage: opcoes.storage === undefined ? sessionStorageSeguro() : opcoes.storage,
      emitir: opcoes.emitir ?? emitirEvento,
    };
    this.dados = this.ler();
    this.semear();
  }

  // ---------- persistência ----------

  private ler(): Guardado {
    try {
      const texto = this.op.storage?.getItem(CHAVE_STORAGE);
      if (texto) return JSON.parse(texto) as Guardado;
    } catch {
      // storage indisponível ou corrompido: começa vazio
    }
    return { demandas: [], relatos: [], atualizadoEm: null, consultas: {} };
  }

  private gravar(): void {
    this.dados.atualizadoEm = agora();
    try {
      this.op.storage?.setItem(CHAVE_STORAGE, JSON.stringify(this.dados));
    } catch {
      // sem storage o mock segue só em memória
    }
  }

  /** Como STORE.semear_demandas: com a marca não faz nada; lista antiga só recebe a marca. */
  private semear(): void {
    if (this.dados.demandasSemeadas) return;
    if (!this.dados.demandas.length) {
      for (const [id, nome] of DEMANDAS_PADRAO) this.dados.demandas.push({ id, nome, abaSheets: "" });
    }
    this.dados.demandasSemeadas = true;
    this.gravar();
  }

  // ---------- visões ----------

  private estado(): Estado {
    const demandas: Demanda[] = this.dados.demandas.map((d) => ({
      ...d,
      descricao: d.descricao ?? null,
      criadaEm: d.criadaEm ?? null,
      atualizadaEm: d.atualizadaEm ?? null,
      exportadaEm: d.exportadaEm ?? null,
      totalMonitorados: this.dados.relatos.filter((r) => r.demandaId === d.id).length,
      totalCandidatos: 0,
    }));
    const relatos = [...this.dados.relatos]
      .map(vista)
      .sort((a, b) => Number(a.numeroAlm) - Number(b.numeroAlm));
    return { demandas, relatos, ultimaPersistencia: this.dados.atualizadoEm };
  }

  private envelope(extra: object = {}) {
    return { ok: true as const, ...this.estado(), ...extra };
  }

  private acharRelato(numero: string): Relato | undefined {
    return this.dados.relatos.find((r) => r.numeroAlm === numero);
  }

  // ---------- OSLC falso ----------

  private async consultar(numero: string): Promise<{ situacao: SituacaoConsulta; titulo?: string; status?: string }> {
    await esperar(this.op.consultaMs);
    if (numero === "401") {
      this.sessaoAtiva = false;
      this.op.emitir({ tipo: "sessao-caiu" });
      return { situacao: "sessao-caiu" };
    }
    if (numero === "999999999" || numero.startsWith("9999")) return { situacao: "nao-encontrado" };
    const n = (this.dados.consultas[numero] ?? 0) + 1;
    this.dados.consultas[numero] = n;
    const indice = (Number(numero) + Math.floor(n / 2)) % STATUS_FALSOS.length;
    return { situacao: "ok", titulo: `Relato de teste ${numero}`, status: STATUS_FALSOS[indice] };
  }

  private aplicar(relato: Relato, r: Awaited<ReturnType<MockBackend["consultar"]>>): boolean {
    const antes = JSON.stringify([relato.titulo, relato.status, relato.situacaoConsulta]);
    relato.situacaoConsulta = r.situacao;
    if (r.situacao === "ok") {
      relato.titulo = r.titulo;
      relato.status = r.status;
      relato.estadoTitulo = r.status;
      relato.ultimaConsultaAlm = agora();
    }
    return antes !== JSON.stringify([relato.titulo, relato.status, relato.situacaoConsulta]);
  }

  // ---------- fluxos longos ----------

  /** Fechar no meio da auth muda a fase; o fluxo assíncrono confere antes de cada passo. */
  private segue(esperada: Fase): boolean {
    return this.fase === esperada;
  }

  private async autenticar(): Promise<void> {
    const passo = (fase: Fase) => {
      this.fase = fase;
      this.op.emitir({ tipo: "fase", fase });
    };
    passo("autenticando");
    this.op.emitir({ tipo: "status", texto: "Autenticando em segundo plano... (mock)" });
    await esperar(this.op.passoAuthMs);
    if (!this.segue("autenticando")) return;
    this.op.emitir({ tipo: "status", texto: "Certificado digital selecionado (1x). Aguardando PIN..." });
    await esperar(this.op.passoAuthMs);
    if (!this.segue("autenticando")) return;
    passo("aquecendo_ccm");
    this.op.emitir({ tipo: "status", texto: "Preparando sessao CCM (/ccm/web)..." });
    await esperar(this.op.passoAuthMs);
    if (!this.segue("aquecendo_ccm")) return;
    this.sessaoAtiva = true;
    passo("autenticado");
    if (this.op.varreduraAoAbrir && !this.varreuAoAbrir) {
      this.varreuAoAbrir = true;
      const numeros = this.estado().relatos.map((r) => r.numeroAlm);
      if (numeros.length) await this.varrer(numeros);
    }
  }

  private async varrer(numeros: string[]) {
    this.varrendo = true;
    this.parar = false;
    const erros: { numeroAlm: string; erro: string }[] = [];
    let okCount = 0;
    let alterados = 0;
    let sessaoCaiu = false;
    let interrompido = false;
    this.op.emitir({ tipo: "varredura", atual: 0, total: numeros.length, numeroAlm: null });
    try {
      for (let i = 0; i < numeros.length; i++) {
        if (this.parar) {
          interrompido = true;
          break;
        }
        const numero = numeros[i];
        this.op.emitir({ tipo: "varredura", atual: i + 1, total: numeros.length, numeroAlm: numero });
        const relato = this.acharRelato(numero);
        if (!relato) {
          erros.push({ numeroAlm: numero, erro: "relato-ausente" });
          continue;
        }
        const r = await this.consultar(numero);
        if (this.aplicar(relato, r)) alterados++;
        if (r.situacao === "ok") okCount++;
        else erros.push({ numeroAlm: numero, erro: r.situacao });
        this.gravar();
        if (r.situacao === "sessao-caiu") {
          sessaoCaiu = true;
          break;
        }
      }
    } finally {
      this.varrendo = false;
    }
    const fim = { total: numeros.length, okCount, erros, alterados, interrompido, sessaoCaiu };
    this.op.emitir({ tipo: "varredura-fim", ...fim, ...this.estado() });
    return fim;
  }

  // ---------- ponte ----------

  async pedir(payload: Payload): Promise<unknown> {
    await esperar(this.op.latenciaMs);
    const acao = payload.acao;

    if (acao === "fechar") {
      this.parar = true;
      this.fase = "nao_autenticado";
      return { ok: true, fase: "encerrando" };
    }
    if (this.varrendo) return erro("ocupado-varredura");
    if (acao === "status_sessao") {
      return {
        ok: true,
        fase: this.fase,
        autenticado: this.fase === "autenticado" && this.sessaoAtiva,
        persona: { nome: "Operador de Teste (mock)", cpf: "CPF 000.***.***-00", iniciais: "OT" },
        versaoScript: "mock",
        varreduraAoAbrir: this.op.varreduraAoAbrir,
      };
    }
    if (this.fase === "autenticando") return erro("ocupado-autenticando");
    if (this.fase === "aquecendo_ccm") return erro("ocupado-aquecendo-ccm");

    switch (acao) {
      case "carregar_estado":
        return this.envelope();
      case "autenticar":
        void this.autenticar();
        return { ok: true, fase: "autenticando" };
      case "registrar_demanda": {
        // Como STORE.criar_demanda: nome único pelo slug; id = slug, com -2, -3... se ocupado.
        const v = validarDemanda(this.dados.demandas, payload.nome, payload.descricao);
        if ("ok" in v) return v;
        const slug = normalizarIdDemanda(v.nome);
        let id = slug;
        for (let n = 2; this.dados.demandas.some((d) => d.id === id); n++) id = `${slug}-${n}`;
        const quando = agora();
        this.dados.demandas.push({
          id,
          nome: v.nome,
          abaSheets: "",
          descricao: v.descricao || null,
          criadaEm: quando,
          atualizadaEm: quando,
        });
        this.gravar();
        return this.envelope({ demanda: this.estado().demandas.find((d) => d.id === id) });
      }
      case "editar_demanda": {
        const alvo = this.dados.demandas.find((d) => d.id === payload.demandaId);
        if (!alvo) return erro("demanda-desconhecida", "Demanda desconhecida");
        const v = validarDemanda(this.dados.demandas, payload.nome, payload.descricao, alvo.id);
        if ("ok" in v) return v;
        alvo.nome = v.nome;
        if (v.descricao != null) alvo.descricao = v.descricao || null;
        alvo.atualizadaEm = agora();
        this.gravar();
        return this.envelope({ demanda: this.estado().demandas.find((d) => d.id === alvo.id) });
      }
      case "excluir_demanda": {
        if (!this.dados.demandas.some((d) => d.id === payload.demandaId)) {
          return erro("demanda-desconhecida", "Demanda desconhecida");
        }
        const antes = this.dados.relatos.length;
        this.dados.demandas = this.dados.demandas.filter((d) => d.id !== payload.demandaId);
        this.dados.relatos = this.dados.relatos.filter((r) => r.demandaId !== payload.demandaId);
        this.gravar();
        return this.envelope({
          removida: payload.demandaId,
          relatosRemovidos: antes - this.dados.relatos.length,
        });
      }
      case "exportar_demanda": {
        // O script grava JSON + CSV em Downloads; o mock só devolve os caminhos que ele montaria.
        const alvo = this.dados.demandas.find((d) => d.id === payload.demandaId);
        if (!alvo) return erro("demanda-desconhecida", "Demanda desconhecida");
        if (alvo.id.includes("falha-exportacao")) {
          return erro("exportacao-falhou", "Pasta Downloads nao encontrada");
        }
        const relatos = this.estado().relatos.filter((r) => r.demandaId === alvo.id);
        const quando = new Date();
        const prefixo = `monitora-alm_${alvo.id}_${carimbo(quando)}`;
        alvo.exportadaEm = quando.toISOString();
        this.gravar();
        return this.envelope({
          demanda: this.estado().demandas.find((d) => d.id === alvo.id),
          arquivos: [`${PASTA_DOWNLOADS}\\${prefixo}.json`, `${PASTA_DOWNLOADS}\\${prefixo}.csv`],
          pasta: PASTA_DOWNLOADS,
          resumo: { total: relatos.length, porCategoria: contarCategorias(relatos), concluida: demandaConcluida(relatos) },
        });
      }
      case "editar_relato": {
        const v = validarNumeroAlm(String(payload.numeroAlm ?? ""));
        if (!v.ok) return erro("id-invalido", v.mensagem);
        const relato = this.acharRelato(v.numero);
        if (!relato) return erro("relato-desconhecido", "Relato nao esta na lista");
        const textos = [payload.anotacoes, payload.observacoes];
        if (textos.some((t) => t != null && t.trim().length > MAX_TEXTO_ANOTACAO)) {
          return erro("texto-longo", `Anotacoes e observacoes aceitam ate ${MAX_TEXTO_ANOTACAO} caracteres`);
        }
        if (testerLongo(payload.testerNome)) return erroTester();
        if (payload.testerNome != null) relato.testerNome = normalizarTester(payload.testerNome) || null;
        if (payload.anotacoes != null) relato.anotacoes = payload.anotacoes.trim() || null;
        if (payload.observacoes != null) relato.observacoes = payload.observacoes.trim() || null;
        relato.anotacoesAtualizadasEm = agora();
        this.gravar();
        return this.envelope({ relato: vista(relato) });
      }
      case "abrir_no_alm": {
        // O script abre o navegador do sistema; o mock só devolve a URL que ele montaria.
        const v = validarNumeroAlm(String(payload.numeroAlm ?? ""));
        if (!v.ok) return erro("id-invalido", v.mensagem);
        return { ok: true, url: `${URL_ITEM_NAME}${v.numero}` };
      }
      case "excluir_relato": {
        const v = validarNumeroAlm(String(payload.numeroAlm ?? ""));
        if (!v.ok) return erro("id-invalido", v.mensagem);
        if (!this.acharRelato(v.numero)) return erro("relato-desconhecido", "Relato nao esta na lista");
        this.dados.relatos = this.dados.relatos.filter((r) => r.numeroAlm !== v.numero);
        this.gravar();
        return this.envelope({ removido: v.numero });
      }
    }

    // Daqui para baixo: ações que consultam o ALM.
    if (this.fase !== "autenticado" || !this.sessaoAtiva) return erro("nao-autenticado");

    switch (acao) {
      case "cadastrar_relatos": {
        if (!this.dados.demandas.some((d) => d.id === payload.demandaId)) {
          return erro("demanda-desconhecida", "Demanda desconhecida");
        }
        // Como o STORE: nome longo recusa o lote antes de qualquer consulta.
        if (testerLongo(payload.testerNome)) return erroTester();
        const tester = normalizarTester(payload.testerNome ?? "");
        const resultados: ResultadoLote[] = [];
        for (const bruto of payload.numerosAlm) {
          const r = await this.cadastrarUm(payload.demandaId, bruto, tester);
          resultados.push(r);
          if (r.situacao === "sessao-caiu") break;
        }
        const sessaoCaiu = resultados.some((r) => r.situacao === "sessao-caiu");
        return this.envelope({ resultados, sessaoCaiu });
      }
      case "atualizar_relato": {
        const v = validarNumeroAlm(String(payload.numeroAlm ?? ""));
        if (!v.ok) return erro("id-invalido", v.mensagem);
        if (!this.acharRelato(v.numero)) return erro("relato-ausente");
        const antes = JSON.stringify(this.acharRelato(v.numero));
        const fim = await this.varrer([v.numero]);
        const relato = this.acharRelato(v.numero);
        return this.envelope({
          relato: relato && vista(relato),
          alterado: antes !== JSON.stringify(relato),
          sessaoCaiu: fim.sessaoCaiu,
          interrompido: fim.interrompido,
        });
      }
      case "atualizar_todos": {
        const numeros = this.estado()
          .relatos.filter((r) => !payload.demandaId || r.demandaId === payload.demandaId)
          .map((r) => r.numeroAlm);
        const fim = await this.varrer(numeros);
        return this.envelope(fim);
      }
    }
    return erro("acao-desconhecida");
  }

  private async cadastrarUm(demandaId: string, bruto: string, tester: string): Promise<ResultadoLote> {
    const v = validarNumeroAlm(String(bruto ?? ""));
    if (!v.ok) return { numeroAlm: String(bruto ?? "").trim(), ok: false, erro: "id-invalido", mensagem: v.mensagem };
    if (!this.dados.demandas.some((d) => d.id === demandaId)) {
      return { numeroAlm: v.numero, ok: false, erro: "demanda-desconhecida", mensagem: "Demanda desconhecida" };
    }
    const r = await this.consultar(v.numero);
    if (r.situacao === "nao-encontrado") {
      return {
        numeroAlm: v.numero,
        ok: false,
        erro: "nao-encontrado",
        mensagem: "Relato nao encontrado. Nao entrou na lista.",
      };
    }
    let relato = this.acharRelato(v.numero);
    if (!relato) {
      relato = { demandaId, numeroAlm: v.numero, anotacoes: null, observacoes: null, testerNome: null };
      this.dados.relatos.push(relato);
    }
    relato.demandaId = demandaId;
    if (tester) relato.testerNome = tester; // vazio preserva o nome já gravado
    this.aplicar(relato, r);
    this.gravar();
    return { numeroAlm: v.numero, ok: true, situacao: r.situacao, relato: vista(relato) };
  }
}

function sessionStorageSeguro(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

let instancia: MockBackend | null = null;

export function pedirMock(payload: Payload): Promise<unknown> {
  instancia ??= new MockBackend();
  return instancia.pedir(payload);
}
