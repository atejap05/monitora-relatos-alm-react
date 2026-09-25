// Ponte invertida (frontend-integration.md §1–§2). O Python faz shift em window.__fila e
// responde por window.__entregar; eventos chegam por window.__notificar.
//
// Regras que o backend impõe:
// - Um pedido por vez. Na fase ociosa, o Python atende UM pedido a cada
//   transferirControleParaScript e, se a fila estiver vazia, conclui que o X foi clicado.
//   Por isso nunca chamar transferirControleParaScript sem item na fila.
// - Nas fases de poll (auth, CCM, varredura) a chamada falha ou é ignorada; o poll faz o shift.

import type { Evento, Payload } from "@/@types/backend";
import { emitirEvento } from "./eventos";

interface ItemFila {
  id: number;
  payload: Payload;
}

type Resolver = (resposta: unknown) => void;

declare global {
  interface Window {
    __fila: ItemFila[];
    __resp: Record<number, Resolver>;
    __seq: number;
    __entregar: (id: number, json: string) => void;
    __notificar: (json: string) => void;
    transferirControleParaScript?: () => void;
  }
}

/** Reenvio do sinal se o Python ainda não pegou o item (ele pode não ter voltado a esperar). */
export const REENVIO_MS = 1500;

export function instalarFila(w: Window = window): void {
  if (Array.isArray(w.__fila)) return;
  w.__fila = [];
  w.__resp = {};
  w.__seq = 0;
  w.__entregar = (id, json) => {
    const resolver = w.__resp[id];
    delete w.__resp[id];
    if (resolver) resolver(JSON.parse(json));
  };
  w.__notificar = (json) => {
    emitirEvento(JSON.parse(json) as Evento);
  };
}

function naFila(w: Window, id: number): boolean {
  return w.__fila.some((item) => item.id === id);
}

function sinalizar(w: Window): void {
  try {
    w.transferirControleParaScript?.();
  } catch {
    // Python em poll: ele mesmo fará o shift.
  }
}

function enviar(w: Window, payload: Payload): Promise<unknown> {
  const id = ++w.__seq;
  const resposta = new Promise<unknown>((resolve) => {
    w.__resp[id] = resolve;
  });
  w.__fila.push({ id, payload });
  sinalizar(w);
  const reenvio = w.setInterval(() => {
    if (!(id in w.__resp)) {
      w.clearInterval(reenvio);
      return;
    }
    if (naFila(w, id)) sinalizar(w);
  }, REENVIO_MS);
  return resposta.finally(() => w.clearInterval(reenvio));
}

let cauda: Promise<unknown> = Promise.resolve();

/**
 * Serializa: o próximo pedido só entra na fila depois da resposta do anterior.
 * Exceção: `fechar` entra na hora — é o que interrompe uma varredura em curso, cujo
 * pedido ainda está sem resposta.
 */
export function pedirReal(payload: Payload, w: Window = window): Promise<unknown> {
  instalarFila(w);
  if (payload.acao === "fechar") return enviar(w, payload);
  const vez = cauda.then(() => enviar(w, payload));
  cauda = vez.catch(() => undefined);
  return vez;
}
