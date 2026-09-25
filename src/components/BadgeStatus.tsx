import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "nfse-ds";
import type { Relato } from "@/@types/backend";
import { infoCategoria } from "@/lib/categorias";

/** Status ALM com a cor da categoria (RF-21). O texto é o do ALM; a categoria vai no tooltip. */
export function BadgeStatus({ relato }: { relato: Relato }) {
  const status = relato.status || relato.estadoTitulo;
  if (!status) return <span className="text-gray-500">—</span>;
  const { variante, descricao } = infoCategoria(relato.categoriaStatus);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex cursor-help" data-categoria={relato.categoriaStatus ?? "desconhecido"}>
          <Badge variant={variante} size="sm">
            {status}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent>{descricao}</TooltipContent>
    </Tooltip>
  );
}
