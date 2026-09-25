import { create } from "zustand";
import type { Evento, Fase, Persona, StatusSessao } from "@/@types/backend";

export interface ProgressoVarredura {
  atual: number;
  total: number;
  numeroAlm: string | null;
}

interface SessaoState {
  carregado: boolean;
  fase: Fase;
  autenticado: boolean;
  sessaoCaiu: boolean;
  persona: Persona | null;
  versaoScript: string | null;
  varreduraAoAbrir: boolean;
  statusTexto: string;
  varredura: ProgressoVarredura | null;
  encerrado: boolean;
  aplicarStatus: (status: StatusSessao) => void;
  aplicarEvento: (evento: Evento) => void;
  marcarSessaoCaiu: () => void;
  marcarEncerrado: () => void;
}

export const useSessao = create<SessaoState>((set) => ({
  carregado: false,
  fase: "nao_autenticado",
  autenticado: false,
  sessaoCaiu: false,
  persona: null,
  versaoScript: null,
  varreduraAoAbrir: true,
  statusTexto: "",
  varredura: null,
  encerrado: false,

  aplicarStatus: (status) =>
    set({
      carregado: true,
      fase: status.fase,
      autenticado: status.autenticado,
      persona: status.persona,
      versaoScript: status.versaoScript,
      varreduraAoAbrir: status.varreduraAoAbrir,
    }),

  aplicarEvento: (evento) => {
    switch (evento.tipo) {
      case "fase":
        set(
          evento.fase === "autenticado"
            ? { fase: evento.fase, autenticado: true, sessaoCaiu: false, statusTexto: "" }
            : { fase: evento.fase, autenticado: false },
        );
        return;
      case "status":
        set({ statusTexto: evento.texto });
        return;
      case "varredura":
        set({ varredura: { atual: evento.atual, total: evento.total, numeroAlm: evento.numeroAlm } });
        return;
      case "varredura-fim":
        set(evento.sessaoCaiu ? { varredura: null, sessaoCaiu: true, autenticado: false } : { varredura: null });
        return;
      case "sessao-caiu":
        set({ sessaoCaiu: true, autenticado: false });
        return;
    }
  },

  marcarSessaoCaiu: () => set({ sessaoCaiu: true, autenticado: false }),
  marcarEncerrado: () => set({ encerrado: true, varredura: null }),
}));

/** Fase em que o backend recusa tudo menos Fechar. */
export function emAutenticacao(fase: Fase): boolean {
  return fase === "autenticando" || fase === "aquecendo_ccm";
}
