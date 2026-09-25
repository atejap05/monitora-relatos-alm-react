import type { BadgeVariant } from "nfse-ds";
import type { SituacaoConsulta } from "@/@types/backend";

// Situação da última consulta OSLC (frontend-integration.md §3). Na tabela, só aparece quando
// não é "ok": ícone de alerta com este rótulo na coluna Última consulta (RF-19).
const ROTULO: Record<SituacaoConsulta, [string, BadgeVariant]> = {
  ok: ["Consultado", "success"],
  "nao-encontrado": ["Não encontrado no ALM", "error"],
  "sessao-caiu": ["Sessão expirada na última consulta", "warning"],
  "erro-rede": ["Erro de rede na última consulta", "error"],
  "erro-http": ["O ALM respondeu com erro", "error"],
  "formato-inesperado": ["Resposta inesperada do ALM", "warning"],
  "sem-estado": ["O ALM não informou o estado", "warning"],
  "id-invalido": ["Número ALM inválido", "error"],
};

export interface Situacao {
  rotulo: string;
  variante: BadgeVariant;
}

export function descreverSituacao(situacao: SituacaoConsulta | string): Situacao {
  const [rotulo, variante] = ROTULO[situacao as SituacaoConsulta] ?? [situacao, "neutral"];
  return { rotulo, variante };
}
