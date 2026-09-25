import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Evento } from "@/@types/backend";
import { ouvirEventos } from "./eventos";
import { instalarFila, pedirReal, REENVIO_MS } from "./fila";

// Simula o Python: tira o próximo item da fila e responde como `entregar` (JSON duplo).
function pythonAtende(resposta: (payload: unknown) => unknown) {
  const item = window.__fila.shift();
  if (!item) throw new Error("fila vazia");
  window.__entregar(item.id, JSON.stringify(resposta(item.payload)));
}

describe("ponte invertida", () => {
  beforeEach(() => {
    // @ts-expect-error reinicia os globais entre testes
    delete window.__fila;
    instalarFila();
    window.transferirControleParaScript = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("entrega a resposta ao pedido certo", async () => {
    const p = pedirReal({ acao: "status_sessao" });
    await vi.waitFor(() => expect(window.__fila).toHaveLength(1));
    expect(window.transferirControleParaScript).toHaveBeenCalledTimes(1);
    pythonAtende(() => ({ ok: true, fase: "nao_autenticado" }));
    await expect(p).resolves.toEqual({ ok: true, fase: "nao_autenticado" });
  });

  it("serializa: o segundo pedido só entra depois da resposta do primeiro", async () => {
    const p1 = pedirReal({ acao: "carregar_estado" });
    const p2 = pedirReal({ acao: "status_sessao" });
    await vi.waitFor(() => expect(window.__fila).toHaveLength(1));
    expect(window.__fila[0].payload.acao).toBe("carregar_estado");
    pythonAtende(() => ({ ok: true, n: 1 }));
    await p1;
    await vi.waitFor(() => expect(window.__fila).toHaveLength(1));
    expect(window.__fila[0].payload.acao).toBe("status_sessao");
    pythonAtende(() => ({ ok: true, n: 2 }));
    await expect(p2).resolves.toEqual({ ok: true, n: 2 });
  });

  it("fechar fura a fila (interrompe varredura em curso)", async () => {
    const varredura = pedirReal({ acao: "atualizar_todos" });
    await vi.waitFor(() => expect(window.__fila).toHaveLength(1));
    const itemVarredura = window.__fila.shift()!; // Python pegou a varredura e está no loop
    const fechar = pedirReal({ acao: "fechar" });
    await vi.waitFor(() => expect(window.__fila.map((i) => i.payload.acao)).toEqual(["fechar"]));
    pythonAtende(() => ({ ok: true, fase: "encerrando" }));
    await expect(fechar).resolves.toMatchObject({ fase: "encerrando" });
    // A varredura responde com o parcial (interrompido); libera a fila serial para os próximos testes.
    window.__entregar(itemVarredura.id, JSON.stringify({ ok: true, interrompido: true }));
    await expect(varredura).resolves.toMatchObject({ interrompido: true });
  });

  it("reenvia o sinal só enquanto o item está na fila", async () => {
    vi.useFakeTimers();
    const p = pedirReal({ acao: "status_sessao" });
    await vi.advanceTimersByTimeAsync(0);
    expect(window.transferirControleParaScript).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(REENVIO_MS);
    expect(window.transferirControleParaScript).toHaveBeenCalledTimes(2);
    window.__fila.shift(); // Python pegou, ainda processando
    await vi.advanceTimersByTimeAsync(REENVIO_MS * 3);
    expect(window.transferirControleParaScript).toHaveBeenCalledTimes(2);
    window.__entregar(1, JSON.stringify({ ok: true }));
    await expect(p).resolves.toEqual({ ok: true });
  });

  it("__notificar repassa o evento aos ouvintes", () => {
    const recebidos: Evento[] = [];
    const parar = ouvirEventos((e) => recebidos.push(e));
    window.__notificar(JSON.stringify({ tipo: "fase", fase: "autenticado" }));
    parar();
    window.__notificar(JSON.stringify({ tipo: "sessao-caiu" }));
    expect(recebidos).toEqual([{ tipo: "fase", fase: "autenticado" }]);
  });
});
