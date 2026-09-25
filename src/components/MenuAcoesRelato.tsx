import { ExternalLink, Menu, Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "nfse-ds";
import type { Relato } from "@/@types/backend";

export interface MenuAcoesRelatoProps {
  relato: Relato;
  podeConsultarAlm: boolean;
  podeEditarLocal: boolean;
  onAtualizar: (relato: Relato) => void;
  onEditar: (relato: Relato) => void;
  onExcluir: (relato: Relato) => void;
  onAbrirNoAlm: (relato: Relato) => void;
}

/** Ações de uma linha (RF-19): Atualizar consulta o ALM; Editar, Abrir no ALM (RF-20) e Excluir são locais. */
export function MenuAcoesRelato(props: MenuAcoesRelatoProps) {
  const { relato, podeConsultarAlm, podeEditarLocal, onAtualizar, onEditar, onExcluir, onAbrirNoAlm } = props;
  const numero = relato.numeroAlm;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={!podeConsultarAlm && !podeEditarLocal}>
        <Button size="sm" variant="ghost" aria-label={`Ações do relato ${numero}`}>
          <Menu aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={`Ações do relato ${numero}`}>
        <DropdownMenuItem
          disabled={!podeConsultarAlm}
          className="text-[var(--nfse-color-info)]"
          onSelect={() => onAtualizar(relato)}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!podeEditarLocal} onSelect={() => onEditar(relato)}>
          <Pencil aria-hidden="true" className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!podeEditarLocal} onSelect={() => onAbrirNoAlm(relato)}>
          <ExternalLink aria-hidden="true" className="size-4" />
          Abrir no ALM
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!podeEditarLocal}
          className="text-[var(--nfse-color-error)] data-[highlighted]:bg-[var(--nfse-color-error-bg)] data-[highlighted]:text-[var(--nfse-color-error)]"
          onSelect={() => onExcluir(relato)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
