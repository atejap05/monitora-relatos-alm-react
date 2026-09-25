import { CircleCheck, Download, FolderPlus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Alert, Button, Input, Spinner, Tabs, TabsContent, TabsList, TabsTrigger, Typography } from "nfse-ds";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { Demanda, Relato } from "@/@types/backend";
import { DialogCadastro } from "@/components/DialogCadastro";
import { DialogEditar } from "@/components/DialogEditar";
import { DialogExcluir } from "@/components/DialogExcluir";
import { DialogDemanda } from "@/components/DialogDemanda";
import { DialogExcluirDemanda } from "@/components/DialogExcluirDemanda";
import { DialogExportar } from "@/components/DialogExportar";
import { MenuAcoesDemanda } from "@/components/MenuAcoesDemanda";
import { ResumoCategorias } from "@/components/ResumoCategorias";
import { TabelaRelatos } from "@/components/TabelaRelatos";
import { useAbrirNoAlm, useAtualizarRelato, useAtualizarTodos } from "@/hooks/useAcoes";
import { useBloqueios } from "@/hooks/useBloqueios";
import { useEstado } from "@/hooks/useEstado";
import { demandaConcluida } from "@/lib/categorias";
import { formatarDataHora } from "@/lib/formato";
import { sugestoesTester } from "@/lib/tester";

const SEM_RELATOS: Relato[] = [];

export function PaginaDemanda() {
  const { demandaId } = useParams();
  const estado = useEstado();
  const navigate = useNavigate();
  const { podeEditarLocal } = useBloqueios();
  // Diálogo de demanda: fechado, criar (null) ou editar (a demanda).
  const [dialogo, setDialogo] = useState<{ demanda: Demanda | null } | null>(null);
  const [excluindo, setExcluindo] = useState<Demanda | null>(null);
  const [exportando, setExportando] = useState<Demanda | null>(null);

  if (estado.isPending) {
    return <Spinner block label="Carregando a lista local…" />;
  }
  if (estado.isError) {
    return (
      <Alert variant="error" title="Não foi possível carregar a lista local">
        <div className="flex flex-wrap items-center gap-3">
          <span>{estado.error.message}</span>
          <Button size="sm" onClick={() => void estado.refetch()}>
            Tentar de novo
          </Button>
        </div>
      </Alert>
    );
  }

  const { demandas, relatos, ultimaPersistencia } = estado.data;
  const atual = demandas.find((d) => d.id === demandaId);
  const novaDemanda = <NovaDemandaBotao disabled={!podeEditarLocal} onClick={() => setDialogo({ demanda: null })} />;
  const dialogos = (
    <>
      <DialogDemanda
        aberto={dialogo !== null}
        onOpenChange={(aberto) => !aberto && setDialogo(null)}
        demandas={demandas}
        demanda={dialogo?.demanda}
        onGravada={(id) => navigate(`/demanda/${id}`)}
      />
      {/* A rota da demanda excluída deixa de existir: PaginaDemanda vai para a primeira ou SemDemandas. */}
      <DialogExcluirDemanda
        demanda={excluindo}
        onClose={() => setExcluindo(null)}
        onExcluida={() => navigate("/", { replace: true })}
        onExportar={setExportando}
      />
      {/* RF-27: exportar e, em seguida, excluir a demanda encerrada. */}
      <DialogExportar
        demanda={exportando}
        relatos={exportando ? relatos.filter((r) => r.demandaId === exportando.id) : SEM_RELATOS}
        onClose={() => setExportando(null)}
        onExcluir={setExcluindo}
      />
    </>
  );
  const concluidas = new Set(
    demandas.filter((d) => demandaConcluida(relatos.filter((r) => r.demandaId === d.id))).map((d) => d.id),
  );

  if (!atual && demandas.length) return <Navigate to={`/demanda/${demandas[0].id}`} replace />;
  if (!atual) {
    return (
      <>
        <SemDemandas acao={novaDemanda} />
        {dialogos}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={atual.id} onValueChange={(id) => navigate(`/demanda/${id}`)}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <TabsList aria-label="Demandas">
            {demandas.map((d) => (
              <TabsTrigger key={d.id} value={d.id}>
                <span className="inline-flex items-center gap-1">
                  {concluidas.has(d.id) && (
                    <CircleCheck
                      role="img"
                      aria-label="Homologação concluída"
                      className="size-4 shrink-0 text-[var(--nfse-color-success)]"
                    />
                  )}
                  {d.nome} ({d.totalMonitorados})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1">
            {novaDemanda}
            <MenuAcoesDemanda
              demanda={atual}
              podeEditarLocal={podeEditarLocal}
              onEditar={(demanda) => setDialogo({ demanda })}
              onExportar={setExportando}
              onExcluir={setExcluindo}
            />
          </div>
        </div>
        {atual.descricao && (
          <Typography variant="body" className="mt-2 block whitespace-pre-line text-[var(--nfse-color-text-muted)]">
            {atual.descricao}
          </Typography>
        )}
        <TabsContent value={atual.id} className="pt-4">
          {concluidas.has(atual.id) && (
            <HomologacaoConcluida
              demanda={atual}
              podeEditarLocal={podeEditarLocal}
              onExportar={setExportando}
              onExcluir={setExcluindo}
            />
          )}
          <ConteudoDemanda key={atual.id} demanda={atual} relatos={relatos} />
        </TabsContent>
      </Tabs>
      <Typography variant="caption">Arquivo local gravado em {formatarDataHora(ultimaPersistencia)}.</Typography>
      {dialogos}
    </div>
  );
}

function NovaDemandaBotao({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" size="sm" disabled={disabled} onClick={onClick}>
      <FolderPlus aria-hidden="true" className="size-4" />
      Nova demanda
    </Button>
  );
}

/** RF-27: todos os relatos concluídos. Oferece exportar e depois excluir (próxima homologação). */
function HomologacaoConcluida({
  demanda,
  podeEditarLocal,
  onExportar,
  onExcluir,
}: {
  demanda: Demanda;
  podeEditarLocal: boolean;
  onExportar: (demanda: Demanda) => void;
  onExcluir: (demanda: Demanda) => void;
}) {
  return (
    <Alert variant="success" title="Homologação concluída" className="mb-3">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Todos os {demanda.totalMonitorados} relatos estão concluídos no ALM.{" "}
          {demanda.exportadaEm
            ? `Exportada em ${formatarDataHora(demanda.exportadaEm)}.`
            : "Exporte o registro e exclua a demanda para liberar a próxima homologação."}
        </span>
        <Button size="sm" variant="secondary" disabled={!podeEditarLocal} onClick={() => onExportar(demanda)}>
          <Download aria-hidden="true" className="size-4" />
          Exportar
        </Button>
        <Button size="sm" variant="ghost" disabled={!podeEditarLocal} onClick={() => onExcluir(demanda)}>
          <Trash2 aria-hidden="true" className="size-4" />
          Excluir demanda
        </Button>
      </div>
    </Alert>
  );
}

function SemDemandas({ acao }: { acao: ReactNode }) {
  return (
    <Alert variant="info" title="Nenhuma demanda">
      <div className="flex flex-wrap items-center gap-3">
        <span>Crie uma demanda para cadastrar os relatos da próxima homologação.</span>
        {acao}
      </div>
    </Alert>
  );
}

function ConteudoDemanda({ demanda, relatos }: { demanda: Demanda; relatos: Relato[] }) {
  const { podeConsultarAlm, podeEditarLocal } = useBloqueios();
  const [filtro, setFiltro] = useState("");
  const [cadastro, setCadastro] = useState(false);
  const [editando, setEditando] = useState<Relato | null>(null);
  const [excluindo, setExcluindo] = useState<Relato | null>(null);
  const atualizarRelato = useAtualizarRelato();
  const atualizarTodos = useAtualizarTodos();
  const abrirNoAlm = useAbrirNoAlm();

  const daDemanda = useMemo(() => {
    const lista = relatos.filter((r) => r.demandaId === demanda.id);
    return lista.length ? lista : SEM_RELATOS;
  }, [relatos, demanda.id]);
  // Sugestões de todas as demandas: o mesmo tester costuma aparecer em mais de uma.
  const sugestoesTesterLista = useMemo(() => sugestoesTester(relatos), [relatos]);

  const onAtualizar = useCallback(
    (r: Relato) => atualizarRelato.mutate({ demandaId: demanda.id, numeroAlm: r.numeroAlm }),
    [atualizarRelato, demanda.id],
  );
  const onAbrirNoAlm = useCallback((r: Relato) => abrirNoAlm.mutate(r.numeroAlm), [abrirNoAlm]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!podeConsultarAlm} onClick={() => setCadastro(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Cadastrar relatos
        </Button>
        <Button
          variant="secondary"
          disabled={!podeConsultarAlm || daDemanda.length === 0}
          onClick={() => atualizarTodos.mutate(demanda.id)}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar esta demanda
        </Button>
        <Button
          variant="secondary"
          disabled={!podeConsultarAlm || relatos.length === 0}
          onClick={() => atualizarTodos.mutate(undefined)}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar todas
        </Button>
        <div className="ml-auto w-full sm:w-72">
          <Input
            type="search"
            placeholder="Filtrar por número, título, status…"
            aria-label="Filtrar relatos"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <ResumoCategorias relatos={daDemanda} />

      <TabelaRelatos
        relatos={daDemanda}
        filtro={filtro}
        onFiltroChange={setFiltro}
        podeConsultarAlm={podeConsultarAlm}
        podeEditarLocal={podeEditarLocal}
        onAtualizar={onAtualizar}
        onEditar={setEditando}
        onExcluir={setExcluindo}
        onAbrirNoAlm={onAbrirNoAlm}
      />

      <DialogCadastro
        aberto={cadastro}
        onOpenChange={setCadastro}
        demandaId={demanda.id}
        demandaNome={demanda.nome}
        sugestoesTester={sugestoesTesterLista}
      />
      <DialogEditar relato={editando} onClose={() => setEditando(null)} sugestoesTester={sugestoesTesterLista} />
      <DialogExcluir relato={excluindo} onClose={() => setExcluindo(null)} />
    </div>
  );
}
