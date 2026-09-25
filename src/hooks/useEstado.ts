import { useQuery } from "@tanstack/react-query";
import type { Estado } from "@/@types/backend";
import { CHAVE_ESTADO } from "@/lib/queryClient";
import { backend, ErroBackend, estadoDe } from "@/service/backend";
import { emAutenticacao, useSessao } from "@/state/sessao";

const MAX_TENTATIVAS_OCUPADO = 10;

/** Lista do JSON (demandas + relatos). Carrega antes da auth; eventos e mutações a mantêm em dia. */
export function useEstado() {
  const carregado = useSessao((s) => s.carregado);
  const fase = useSessao((s) => s.fase);
  return useQuery<Estado, Error>({
    queryKey: CHAVE_ESTADO,
    queryFn: async () => estadoDe(await backend.carregarEstado()),
    enabled: carregado && !emAutenticacao(fase),
    // Varredura ao abrir: o backend responde ocupado-varredura; tenta de novo em seguida.
    retry: (tentativas, erro) =>
      erro instanceof ErroBackend && erro.codigo.startsWith("ocupado") && tentativas < MAX_TENTATIVAS_OCUPADO,
    retryDelay: 1500,
  });
}
