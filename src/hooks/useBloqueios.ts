import { useIsMutating } from "@tanstack/react-query";
import { emAutenticacao, useSessao } from "@/state/sessao";

/**
 * O que a UI pode oferecer agora. O backend é serial: com um pedido em curso, uma varredura
 * ou a autenticação andando, só o Fechar fica ativo.
 */
export function useBloqueios() {
  const fase = useSessao((s) => s.fase);
  const autenticado = useSessao((s) => s.autenticado);
  const sessaoCaiu = useSessao((s) => s.sessaoCaiu);
  const varrendo = useSessao((s) => s.varredura !== null);
  const encerrado = useSessao((s) => s.encerrado);
  const pedidos = useIsMutating();

  const ocupado = pedidos > 0 || varrendo || emAutenticacao(fase) || encerrado;
  return {
    ocupado,
    varrendo,
    /** Ações que consultam o ALM (cadastrar, atualizar). */
    podeConsultarAlm: autenticado && !sessaoCaiu && !ocupado,
    /** Ações só locais (editar, excluir, nova demanda). */
    podeEditarLocal: !ocupado,
    podeAutenticar: !ocupado && (fase === "nao_autenticado" || sessaoCaiu),
  };
}
