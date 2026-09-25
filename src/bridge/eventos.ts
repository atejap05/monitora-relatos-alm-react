import type { Evento } from "@/@types/backend";

type Ouvinte = (evento: Evento) => void;

const ouvintes = new Set<Ouvinte>();

export function ouvirEventos(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function emitirEvento(evento: Evento): void {
  for (const ouvinte of ouvintes) {
    try {
      ouvinte(evento);
    } catch (e) {
      console.error("ouvinte de evento falhou", e);
    }
  }
}
