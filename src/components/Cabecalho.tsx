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
  Persona,
  PersonaAvatar,
  PersonaDescription,
  PersonaName,
  PersonaText,
} from "nfse-ds";
import { usandoMock } from "@/bridge/pedir";
import { useFechar } from "@/hooks/useAcoes";
import { ROTULO_FASE } from "@/lib/formato";
import { useSessao } from "@/state/sessao";

export function Cabecalho() {
  const persona = useSessao((s) => s.persona);
  const fase = useSessao((s) => s.fase);
  const sessaoCaiu = useSessao((s) => s.sessaoCaiu);
  const encerrado = useSessao((s) => s.encerrado);
  const versao = useSessao((s) => s.versaoScript);
  const fechar = useFechar();

  const variante = sessaoCaiu ? "error" : fase === "autenticado" ? "success" : fase === "nao_autenticado" ? "neutral" : "info";
  const rotulo = sessaoCaiu ? "Sessão ALM expirada" : ROTULO_FASE[fase];

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
            <Persona>
              <PersonaAvatar>{persona?.iniciais || "?"}</PersonaAvatar>
              <PersonaText>
                <PersonaName>{persona?.nome || "Usuário não identificado"}</PersonaName>
                <PersonaDescription>{persona?.cpf || "CPF indisponível"}</PersonaDescription>
              </PersonaText>
            </Persona>
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
