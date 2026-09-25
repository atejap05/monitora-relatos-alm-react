import { useMutation } from "@tanstack/react-query";
import { toast } from "nfse-ds";
import type { Estado } from "@/@types/backend";
import { mensagemErro } from "@/lib/mensagens";
import { definirEstado } from "@/lib/queryClient";
import { backend, ErroBackend, estadoDe } from "@/service/backend";
import { useSessao } from "@/state/sessao";

function aoErrar(erro: Error) {
  if (erro instanceof ErroBackend) {
    if (erro.estado) definirEstado(erro.estado);
    if (erro.codigo === "sessao-caiu" || erro.codigo === "nao-autenticado") {
      useSessao.getState().marcarSessaoCaiu();
    }
  }
  toast.error(erro.message);
}

function aplicar(resposta: Estado & { sessaoCaiu?: boolean }) {
  definirEstado(estadoDe(resposta));
  if (resposta.sessaoCaiu) useSessao.getState().marcarSessaoCaiu();
}

export function useAutenticar() {
  return useMutation({ mutationFn: backend.autenticar, onError: aoErrar });
}

export function useFechar() {
  return useMutation({
    mutationFn: backend.fechar,
    onMutate: () => useSessao.getState().marcarEncerrado(),
    onError: aoErrar,
  });
}

export function useRegistrarDemanda() {
  return useMutation({
    mutationFn: (v: { nome: string; descricao: string }) => backend.registrarDemanda(v.nome, v.descricao),
    onSuccess: (r) => {
      aplicar(r);
      toast.success(`Demanda "${r.demanda.nome}" criada.`);
    },
    onError: aoErrar,
  });
}

export function useEditarDemanda() {
  return useMutation({
    mutationFn: (v: { demandaId: string; nome: string; descricao: string }) =>
      backend.editarDemanda(v.demandaId, v.nome, v.descricao),
    onSuccess: (r) => {
      aplicar(r);
      toast.success(`Demanda "${r.demanda.nome}": alterações gravadas.`);
    },
    onError: aoErrar,
  });
}

/** O diálogo de exportação mostra o resultado; o toast só confirma. */
export function useExportarDemanda() {
  return useMutation({
    mutationFn: (demandaId: string) => backend.exportarDemanda(demandaId),
    onSuccess: (r) => {
      aplicar(r);
      toast.success(`Demanda "${r.demanda.nome}" exportada para a pasta Downloads.`);
    },
    onError: aoErrar,
  });
}

/** Cascata só na lista local (RF-25): os relatos continuam no ALM. */
export function useExcluirDemanda() {
  return useMutation({
    mutationFn: (demandaId: string) => backend.excluirDemanda(demandaId),
    onSuccess: (r) => {
      aplicar(r);
      const n = r.relatosRemovidos;
      if (n === 0) toast.success("Demanda excluída.");
      else toast.success(`Demanda excluída; ${n === 1 ? "1 relato saiu" : `${n} relatos saíram`} da lista (continuam no ALM).`);
    },
    onError: aoErrar,
  });
}

export function useCadastrar() {
  return useMutation({
    mutationFn: ({ demandaId, numeros, testerNome }: { demandaId: string; numeros: string[]; testerNome?: string }) =>
      backend.cadastrarRelatos(demandaId, numeros, testerNome),
    onSuccess: (r) => {
      aplicar(r);
      const ok = r.resultados.filter((x) => x.ok);
      const falhas = r.resultados.filter((x) => !x.ok);
      if (ok.length) toast.success(`${ok.length} relato(s) cadastrado(s): ${ok.map((x) => x.numeroAlm).join(", ")}`);
      for (const f of falhas) toast.error(`${f.numeroAlm}: ${mensagemErro(f.erro, f.mensagem)}`);
    },
    onError: aoErrar,
  });
}

export function useAtualizarRelato() {
  return useMutation({
    mutationFn: ({ demandaId, numeroAlm }: { demandaId: string; numeroAlm: string }) =>
      backend.atualizarRelato(demandaId, numeroAlm),
    onSuccess: (r) => {
      aplicar(r);
      const situacao = r.relato?.situacaoConsulta;
      if (situacao && situacao !== "ok") toast.error(`${r.relato?.numeroAlm}: ${mensagemErro(situacao)}`);
      else toast.success(r.alterado ? `${r.relato?.numeroAlm}: atualizado.` : `${r.relato?.numeroAlm}: sem mudanças.`);
    },
    onError: aoErrar,
  });
}

export function useAtualizarTodos() {
  return useMutation({
    mutationFn: (demandaId?: string) => backend.atualizarTodos(demandaId),
    onSuccess: (r) => {
      aplicar(r);
      const resumo = `${r.okCount}/${r.total} ok, ${r.alterados} alterado(s)`;
      if (r.interrompido) toast.warning(`Varredura interrompida: ${resumo}.`);
      else if (r.erros.length) toast.error(`Varredura com ${r.erros.length} erro(s): ${resumo}.`);
      else toast.success(`Varredura concluída: ${resumo}.`);
    },
    onError: aoErrar,
  });
}

export function useEditarRelato() {
  return useMutation({
    mutationFn: (v: { numeroAlm: string; anotacoes: string; observacoes: string; testerNome: string }) =>
      backend.editarRelato(v.numeroAlm, v.anotacoes, v.observacoes, v.testerNome),
    onSuccess: (r) => {
      aplicar(r);
      toast.success(`${r.relato.numeroAlm}: alterações gravadas.`);
    },
    onError: aoErrar,
  });
}

/** Abre o relato no navegador do sistema. Não muda a lista: sem definirEstado. */
export function useAbrirNoAlm() {
  return useMutation({
    mutationFn: (numeroAlm: string) => backend.abrirNoAlm(numeroAlm),
    onSuccess: (_r, numeroAlm) => toast.info(`${numeroAlm}: abrindo no navegador do sistema.`),
    onError: aoErrar,
  });
}

export function useExcluirRelato() {
  return useMutation({
    mutationFn: (numeroAlm: string) => backend.excluirRelato(numeroAlm),
    onSuccess: (r) => {
      aplicar(r);
      toast.success(`${r.removido}: removido da lista (continua no ALM).`);
    },
    onError: aoErrar,
  });
}
