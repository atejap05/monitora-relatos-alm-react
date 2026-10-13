import {
  columnFilteringFeature,
  constructSortFn,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "nfse-ds";
import { useMemo } from "react";
import type { Relato } from "@/@types/backend";
import { formatarDataHora } from "@/lib/formato";
import { infoCategoria } from "@/lib/categorias";
import { descreverSituacao } from "@/lib/situacao";
import { BadgeStatus } from "./BadgeStatus";
import { MenuAcoesRelato } from "./MenuAcoesRelato";

/** Status ALM ordena pelo fluxo (aberto → com a TI → aguardando RFB → concluído) e depois pelo texto. */
const sortFn_categoria = constructSortFn({
  sort: (_a, _b, rowA, rowB) => {
    const a = rowA.original as Relato;
    const b = rowB.original as Relato;
    return (
      infoCategoria(a.categoriaStatus).ordem - infoCategoria(b.categoriaStatus).ordem ||
      (a.status ?? "").localeCompare(b.status ?? "", "pt-BR")
    );
  },
});

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, categoria: sortFn_categoria },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
});

const helper = createColumnHelper<typeof features, Relato>();
const SEM_FILTRO_GLOBAL = new Set(["acoes", "ultimaConsultaAlm"]);

export interface TabelaRelatosProps {
  relatos: Relato[];
  filtro: string;
  onFiltroChange: (valor: string) => void;
  podeConsultarAlm: boolean;
  podeEditarLocal: boolean;
  onAtualizar: (relato: Relato) => void;
  onEditar: (relato: Relato) => void;
  onExcluir: (relato: Relato) => void;
  onAbrirNoAlm: (relato: Relato) => void;
}

const COR_ALERTA = {
  error: "text-[var(--nfse-color-error)]",
  warning: "text-[var(--nfse-color-warning)]",
} as const;

/** Data da última consulta ok; se a última consulta falhou, alerta com a situação (RF-19). */
function UltimaConsulta({ relato }: { relato: Relato }) {
  const { ultimaConsultaAlm, situacaoConsulta } = relato;
  const data = ultimaConsultaAlm ? (
    <span className="whitespace-nowrap">{formatarDataHora(ultimaConsultaAlm)}</span>
  ) : (
    <span className="whitespace-nowrap text-gray-500">Não consultado</span>
  );
  if (!situacaoConsulta || situacaoConsulta === "ok") return data;

  const { rotulo, variante } = descreverSituacao(situacaoConsulta);
  const cor = variante === "error" ? COR_ALERTA.error : COR_ALERTA.warning;
  return (
    <span className="inline-flex items-center gap-1.5">
      {data}
      <Tooltip>
        <TooltipTrigger asChild>
          <span role="img" aria-label={rotulo} tabIndex={0} className={`cursor-help ${cor}`}>
            <TriangleAlert aria-hidden="true" className="size-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{rotulo}</TooltipContent>
      </Tooltip>
    </span>
  );
}

export function TabelaRelatos(props: TabelaRelatosProps) {
  const {
    relatos,
    filtro,
    onFiltroChange,
    podeConsultarAlm,
    podeEditarLocal,
    onAtualizar,
    onEditar,
    onExcluir,
    onAbrirNoAlm,
  } = props;

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((r) => Number(r.numeroAlm), {
          id: "numeroAlm",
          header: "Nº ALM",
          cell: (info) => {
            const r = info.row.original;
            // RF-20: o número abre o relato no navegador do sistema (o script monta a URL).
            return (
              <button
                type="button"
                disabled={!podeEditarLocal}
                aria-label={`Abrir o relato ${r.numeroAlm} no ALM`}
                title="Abrir no ALM (navegador do sistema)"
                className="inline-flex items-center gap-1 font-mono text-[var(--nfse-color-primary)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
                onClick={() => onAbrirNoAlm(r)}
              >
                {r.numeroAlm}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </button>
            );
          },
        }),
        helper.accessor((r) => r.titulo ?? "", {
          id: "titulo",
          header: "Título",
          sortFn: "text",
          cell: (info) => info.getValue() || <span className="text-gray-500">—</span>,
        }),
        // RF-22: undefined (sem tester) fica no fim nas duas direções da ordenação.
        helper.accessor((r) => r.testerNome || undefined, {
          id: "testerNome",
          header: "Tester",
          sortFn: "text",
          sortUndefined: "last",
          cell: (info) => info.getValue() ?? <span className="text-gray-500">—</span>,
        }),
        helper.accessor((r) => r.status ?? "", {
          id: "status",
          header: "Status ALM",
          sortFn: "categoria",
          cell: (info) => <BadgeStatus relato={info.row.original} />,
        }),
        helper.accessor((r) => r.ultimaConsultaAlm ?? "", {
          id: "ultimaConsultaAlm",
          header: "Última consulta",
          sortFn: "text",
          cell: (info) => <UltimaConsulta relato={info.row.original} />,
        }),
        helper.accessor((r) => r.anotacoes ?? "", {
          id: "anotacoes",
          header: "Anotações",
          enableSorting: false,
          cell: (info) => {
            const texto = info.getValue();
            if (!texto) return <span className="text-gray-500">—</span>;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="line-clamp-2 max-w-64 cursor-help whitespace-pre-line text-sm">
                    {texto}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-96 whitespace-pre-line">{texto}</TooltipContent>
              </Tooltip>
            );
          },
        }),
        helper.display({
          id: "acoes",
          header: "Ações",
          cell: ({ row }) => (
            <MenuAcoesRelato
              relato={row.original}
              podeConsultarAlm={podeConsultarAlm}
              podeEditarLocal={podeEditarLocal}
              onAtualizar={onAtualizar}
              onEditar={onEditar}
              onExcluir={onExcluir}
              onAbrirNoAlm={onAbrirNoAlm}
            />
          ),
        }),
      ]),
    [podeConsultarAlm, podeEditarLocal, onAtualizar, onEditar, onExcluir, onAbrirNoAlm],
  );

  const table = useTable({
    features,
    columns,
    data: relatos,
    getRowId: (r) => r.numeroAlm,
    initialState: { sorting: [{ id: "numeroAlm", desc: false }] },
    state: { globalFilter: filtro },
    onGlobalFilterChange: (valor) => onFiltroChange(typeof valor === "function" ? valor(filtro) : String(valor ?? "")),
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => !SEM_FILTRO_GLOBAL.has(column.id),
  });

  const linhas = table.getRowModel().rows;

  return (
    <div className="overflow-x-auto rounded border border-gray-300">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id}>
              {grupo.headers.map((header) => {
                const ordem = header.column.getIsSorted();
                const ordenavel = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={ordem === "asc" ? "ascending" : ordem === "desc" ? "descending" : undefined}
                    className="border-b border-gray-300 px-3 py-2 font-semibold"
                  >
                    {header.isPlaceholder ? null : ordenavel ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <span aria-hidden="true">{ordem === "asc" ? "▲" : ordem === "desc" ? "▼" : ""}</span>
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-600">
                {relatos.length === 0
                  ? "Nenhum relato monitorado nesta demanda. Use “Cadastrar relatos”."
                  : "Nenhum relato corresponde ao filtro."}
              </td>
            </tr>
          ) : (
            linhas.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 align-top last:border-b-0 hover:bg-gray-50">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
