import { ChevronDown, MonitorUp, X } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Persona,
  PersonaAvatar,
  PersonaDescription,
  PersonaName,
  PersonaText,
} from "nfse-ds";
import { useCriarAtalho, useFechar } from "@/hooks/useAcoes";
import { useBloqueios } from "@/hooks/useBloqueios";
import { useSessao } from "@/state/sessao";

/** Persona do cabeçalho vira menu: atalho na área de trabalho e Fechar (RF-28, RF-13). */
export function MenuPersona() {
  const persona = useSessao((s) => s.persona);
  const encerrado = useSessao((s) => s.encerrado);
  const { podeEditarLocal } = useBloqueios();
  const criarAtalho = useCriarAtalho();
  const fechar = useFechar();
  const nome = persona?.nome || "Usuário não identificado";
  const cpf = persona?.cpf || "CPF indisponível";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Menu do usuário" className="h-auto gap-1 px-2">
          <Persona>
            <PersonaAvatar>{persona?.iniciais || "?"}</PersonaAvatar>
            <PersonaText>
              <PersonaName>{nome}</PersonaName>
              <PersonaDescription>{cpf}</PersonaDescription>
            </PersonaText>
          </Persona>
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Menu do usuário">
        <DropdownMenuLabel>
          <span className="block font-medium">{nome}</span>
          <span className="block text-xs font-normal">{cpf}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!podeEditarLocal} onSelect={() => criarAtalho.mutate()}>
          <MonitorUp aria-hidden="true" className="size-4" />
          Criar atalho na área de trabalho
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={encerrado} onSelect={() => fechar.mutate()}>
          <X aria-hidden="true" className="size-4" />
          Fechar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
