import { Badge } from "nfse-ds";
import type { Relato } from "@/@types/backend";
import { CATEGORIAS, contarCategorias, ORDEM_CATEGORIAS } from "@/lib/categorias";

/** Quantos relatos da demanda há em cada categoria (RUI-24). Categorias vazias não aparecem. */
export function ResumoCategorias({ relatos }: { relatos: Relato[] }) {
  if (relatos.length === 0) return null;
  const contagem = contarCategorias(relatos);
  return (
    <ul aria-label="Relatos por situação no ALM" className="flex flex-wrap gap-2">
      {ORDEM_CATEGORIAS.filter((c) => contagem[c] > 0).map((c) => (
        <li key={c} title={CATEGORIAS[c].descricao}>
          <Badge variant={CATEGORIAS[c].variante} size="sm">
            {contagem[c]} {CATEGORIAS[c].plural}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
