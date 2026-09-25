import { Download, Pencil, Settings2, Trash2 } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "nfse-ds";
import type { Demanda } from "@/@types/backend";

export interface MenuAcoesDemandaProps {
  demanda: Demanda;
  podeEditarLocal: boolean;
  onEditar: (demanda: Demanda) => void;
  onExportar: (demanda: Demanda) => void;
  onExcluir: (demanda: Demanda) => void;
}

/** Ações da demanda da aba atual (RF-24, RF-26, RF-25). */
export function MenuAcoesDemanda({ demanda, podeEditarLocal, onEditar, onExportar, onExcluir }: MenuAcoesDemandaProps) {
  return (
    // modal={false}: Editar/Excluir abrem um diálogo e o body não pode ficar travado (igual à M2).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild disabled={!podeEditarLocal}>
        <Button size="sm" variant="ghost" aria-label={`Ações da demanda ${demanda.nome}`}>
          <Settings2 aria-hidden="true" className="size-4" />
          Demanda
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={`Ações da demanda ${demanda.nome}`}>
        <DropdownMenuItem onSelect={() => onEditar(demanda)}>
          <Pencil aria-hidden="true" className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExportar(demanda)}>
          <Download aria-hidden="true" className="size-4" />
          Exportar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-[var(--nfse-color-error)] data-[highlighted]:bg-[var(--nfse-color-error-bg)] data-[highlighted]:text-[var(--nfse-color-error)]"
          onSelect={() => onExcluir(demanda)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
