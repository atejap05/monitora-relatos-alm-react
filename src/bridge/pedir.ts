import type { Payload } from "@/@types/backend";
import { pedirReal } from "./fila";
import { pedirMock } from "./mock";

export const usandoMock = import.meta.env.VITE_BACKEND === "mock";

/** Único caminho para o backend. Nunca usar fetch nem window.get_*. */
export function pedir(payload: Payload): Promise<unknown> {
  return usandoMock ? pedirMock(payload) : pedirReal(payload);
}
