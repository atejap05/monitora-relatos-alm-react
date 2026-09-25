import { QueryClientProvider } from "@tanstack/react-query";
import { Alert, Button, Container, NfseToaster, Spinner, TooltipProvider, Typography } from "nfse-ds";
import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router";
import { BarraVarredura } from "@/components/BarraVarredura";
import { Cabecalho } from "@/components/Cabecalho";
import { PainelSessao } from "@/components/PainelSessao";
import { ouvirEventos } from "@/bridge/eventos";
import { instalarFila } from "@/bridge/fila";
import { definirEstado, queryClient } from "@/lib/queryClient";
import { PaginaDemanda } from "@/pages/PaginaDemanda";
import { backend } from "@/service/backend";
import { useSessao } from "@/state/sessao";

// Globais da ponte antes de qualquer render: o Python pode chamar __notificar a qualquer momento.
instalarFila();

function useBoot() {
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () =>
      ouvirEventos((evento) => {
        useSessao.getState().aplicarEvento(evento);
        if (evento.tipo === "varredura-fim") definirEstado(evento);
      }),
    [],
  );

  useEffect(() => {
    let vivo = true;
    backend
      .statusSessao()
      .then((status) => vivo && useSessao.getState().aplicarStatus(status))
      .catch((e: Error) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [tentativa]);

  return {
    erro,
    tentarDeNovo: () => {
      setErro(null);
      setTentativa((n) => n + 1);
    },
  };
}

function Conteudo() {
  const carregado = useSessao((s) => s.carregado);
  const encerrado = useSessao((s) => s.encerrado);
  const { erro, tentarDeNovo } = useBoot();

  if (encerrado) {
    return (
      <Alert variant="info" title="Encerrando">
        O script foi avisado e está fechando o navegador. Se a janela não fechar, pode fechá-la pelo X.
      </Alert>
    );
  }
  if (erro) {
    return (
      <Alert variant="error" title="Sem resposta do script">
        <div className="flex flex-wrap items-center gap-3">
          <span>{erro}</span>
          <Button size="sm" onClick={tentarDeNovo}>
            Tentar de novo
          </Button>
        </div>
      </Alert>
    );
  }
  if (!carregado) return <Spinner block label="Conectando ao script do ContÁgil…" />;

  return (
    <div className="space-y-4">
      <PainelSessao />
      <BarraVarredura />
      <Routes>
        <Route path="/demanda/:demandaId" element={<PaginaDemanda />} />
        {/* '#/' e rotas desconhecidas: PaginaDemanda redireciona para a primeira demanda. */}
        <Route path="*" element={<PaginaDemanda />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <div className="min-h-screen bg-gray-50">
            <Cabecalho />
            <Container className="py-6">
              <Conteudo />
            </Container>
            <footer className="pb-6">
              <Container>
                <Typography variant="caption">
                  Somente leitura no ALM: o aplicativo consulta relatos, nunca os altera.
                </Typography>
              </Container>
            </footer>
          </div>
          <NfseToaster position="bottom-right" />
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
