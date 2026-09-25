const FORMATO = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? iso : FORMATO.format(data);
}

export const ROTULO_FASE: Record<string, string> = {
  nao_autenticado: "Não autenticado",
  autenticando: "Autenticando…",
  aquecendo_ccm: "Preparando sessão…",
  autenticado: "Sessão ALM ativa",
};
