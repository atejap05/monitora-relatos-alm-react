import { QueryClient } from "@tanstack/react-query";
import type { Estado } from "@/@types/backend";

export const CHAVE_ESTADO = ["estado"] as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    // O backend é serial e só muda por ação da própria SPA ou por evento: nada de refetch automático.
    queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

export function definirEstado(estado: Estado): void {
  queryClient.setQueryData<Estado>(CHAVE_ESTADO, {
    demandas: estado.demandas,
    relatos: estado.relatos,
    ultimaPersistencia: estado.ultimaPersistencia,
  });
}
