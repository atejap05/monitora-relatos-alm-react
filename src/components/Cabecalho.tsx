import { useEffect } from "react";
import { X } from "lucide-react";
import {
  Badge,
  Button,
  Header,
  HeaderActions,
  HeaderBrand,
  HeaderInner,
  HeaderRow,
  HeaderSubtitle,
  HeaderTitle,
  HeaderTitles,
} from "nfse-ds";
import { usandoMock } from "@/bridge/pedir";
import { useFechar } from "@/hooks/useAcoes";
import { ROTULO_FASE } from "@/lib/formato";
import { useSessao } from "@/state/sessao";
import { MenuPersona } from "./MenuPersona";

export function Cabecalho() {
  const fase = useSessao((s) => s.fase);
  const sessaoCaiu = useSessao((s) => s.sessaoCaiu);
  const encerrado = useSessao((s) => s.encerrado);
  const versao = useSessao((s) => s.versaoScript);
  const fechar = useFechar();

  const variante = sessaoCaiu ? "error" : fase === "autenticado" ? "success" : fase === "nao_autenticado" ? "neutral" : "info";
  const rotulo = sessaoCaiu ? "Sessão ALM expirada" : ROTULO_FASE[fase];

  // #region agent log
  useEffect(() => {
    const sonda = "Homologação";
    const pontos = [...sonda].map((ch) => ch.codePointAt(0)?.toString(16));
    let ultimo = "";
    const varrer = (motivo: string) => {
      const t = document.body?.textContent ?? "";
      let fffd = 0;
      const janelas: string[] = [];
      for (let i = 0; i < t.length; i++) {
        if (t.charCodeAt(i) !== 0xfffd) continue;
        fffd++;
        if (janelas.length < 6) {
          janelas.push(
            [...t.slice(Math.max(0, i - 10), i + 6)].map((c) => c.charCodeAt(0).toString(16)).join(" "),
          );
        }
      }
      const assinatura = `${fffd}|${janelas.join("~")}`;
      if (motivo !== "mount" && (fffd === 0 || assinatura === ultimo)) return;
      ultimo = assinatura;
      fetch("http://127.0.0.1:7895/ingest/c2ad49b8-1f2d-4e14-964c-ddc5641374d0", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "959a57" },
        body: JSON.stringify({
          sessionId: "959a57",
          hypothesisId: "H2-H4",
          location: "Cabecalho.tsx:useEffect",
          message: "sonda estatica e DOM",
          data: { motivo, pontos, fffd, janelas, charset: document.characterSet, rotuloPontos: [...rotulo].map((ch) => ch.codePointAt(0)?.toString(16)) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    };
    varrer("mount");
    const obs = new MutationObserver(() => varrer("mut"));
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [rotulo]);
  // #endregion

  return (
    <Header variant="compact" sticky>
      <HeaderInner>
        <HeaderRow>
          <HeaderBrand>
            <HeaderTitles>
              <HeaderTitle>Monitora Relatos ALM</HeaderTitle>
              <HeaderSubtitle>
                Homologação NFSe · script {versao ?? "—"}
                {usandoMock ? " · backend mock" : ""}
              </HeaderSubtitle>
            </HeaderTitles>
          </HeaderBrand>
          <HeaderActions className="ml-auto flex items-center gap-3">
            <Badge variant={variante}>{rotulo}</Badge>
            <MenuPersona />
            <Button
              variant="secondary"
              size="sm"
              disabled={encerrado}
              title="Encerra o script e libera o navegador"
              onClick={() => fechar.mutate()}
            >
              <X aria-hidden="true" className="size-4" />
              Fechar
            </Button>
          </HeaderActions>
        </HeaderRow>
      </HeaderInner>
    </Header>
  );
}
