# Componentes

Estado da SPA 0.4.0 + M4 (badges de status). Ícones: `lucide-react` 1.x (na v1, `AlertTriangle` chama-se `TriangleAlert`). Os componentes do design system vêm de `nfse-ds` (`file:../NFSe/nfse-ds`), que
também oferece `Combobox`, `Select`, `Sheet`, `Popover`, `Accordion` e `Collapsible`, ainda
não usados. Antes de criar um componente próprio, procure no `nfse-ds`.

## Páginas

### `pages/PaginaDemanda.tsx`

| Parte | Função |
|-------|--------|
| `PaginaDemanda` | Carrega `useEstado`, trata pendente/erro, resolve `:demandaId` (senão redireciona à 1ª) e desenha `Tabs` + menu da demanda + descrição abaixo das abas. Guarda o estado de `DialogDemanda` (criar/editar), `DialogExportar` e `DialogExcluirDemanda`; depois de excluir volta para `/` (1ª demanda ou `SemDemandas`) |
| `NovaDemandaBotao` | Botão secundário, habilitado por `podeEditarLocal` |
| `SemDemandas` | Alerta quando não há demandas (todas excluídas; a semeadura não as recria) com o botão "Nova demanda" (M6) |
| `HomologacaoConcluida` | M7 (RF-27). Aviso acima da tabela quando `demandaConcluida`: Exportar · Excluir demanda; mostra "Exportada em" se houver. A aba ganha o selo `CircleCheck` |
| `ConteudoDemanda` | Barra de ações (Cadastrar, Atualizar esta, Atualizar todas, filtro), `TabelaRelatos` e os diálogos por relato |

## Componentes

| Componente | Props | Usa (`nfse-ds`) | Observações |
|------------|-------|-----------------|-------------|
| `Cabecalho` | — | `Header*`, `Persona*`, `Badge`, `Button` | Lê `useSessao`. Fechar via `useFechar` |
| `PainelSessao` | — | `Alert`, `Card`, `Spinner`, `Button`, `Typography` | Três estados: convite, autenticando e sessão expirada |
| `BarraVarredura` | — | `Progress`, `Typography` | `role="status"`, `aria-live="polite"` |
| `TabelaRelatos` | `relatos`, `filtro`, `onFiltroChange`, `podeConsultarAlm`, `podeEditarLocal`, `onAtualizar`, `onEditar`, `onExcluir`, `onAbrirNoAlm` | `Tooltip*` | TanStack Table v9 (ordenação, filtro global). `getRowId = numeroAlm`. `UltimaConsulta` interno: data + alerta de situação. Nº ALM é um botão-link (RF-20). Coluna Tester (M5) com `sortUndefined: "last"` |
| `MenuAcoesRelato` | `relato`, `podeConsultarAlm`, `podeEditarLocal`, `onAtualizar`, `onEditar`, `onExcluir`, `onAbrirNoAlm` | `DropdownMenu*`, `Button` | Gatilho `Menu` (lucide). `modal={false}`. Itens: Atualizar, Editar, Abrir no ALM, Excluir |
| `BadgeStatus` | `relato` | `Badge`, `Tooltip*` | Cor por `categoriaStatus` (`lib/categorias.ts`); `data-categoria` para teste |
| `ResumoCategorias` | `relatos` | `Badge` | Contagem por categoria (`contarCategorias`); oculta categorias vazias. Reuso previsto na M7 |
| `DialogCadastro` | `aberto`, `onOpenChange`, `demandaId`, `demandaNome`, `sugestoesTester` | `Dialog*`, `TextArea`, `Button` | TanStack Form. Valida o lote com `analisarLote`; tester opcional para o lote (M5) |
| `DialogEditar` | `relato \| null`, `onClose`, `sugestoesTester` | `Dialog*`, `TextArea` | Monta o form só com o relato (valores iniciais corretos). Tester e anotações |
| `CampoTester` | `value`, `onChange`, `onBlur?`, `sugestoes`, `erro?`, `dica?` | `TextField` | M5. Texto livre + `<datalist>` nativo (o `Combobox` do nfse-ds só aceita valores da lista). Contador pelo texto normalizado (`lib/tester.ts`) |
| `DialogExcluir` | `relato \| null`, `onClose` | `Dialog*` | Avisa que o relato continua no ALM |
| `DialogDemanda` | `aberto`, `onOpenChange`, `demandas`, `demanda?`, `onGravada?` | `Dialog*`, `TextField`, `TextArea` | M6. Criar (sem `demanda`) ou editar. Nome até 80 e descrição até 500 com contador; duplicada pelo slug do **nome** das outras demandas (`lib/demandas.ts`). Substitui `DialogNovaDemanda` |
| `DialogExcluirDemanda` | `demanda \| null`, `onClose`, `onExcluida`, `onExportar` | `Dialog*`, `Alert` | M6/M7. Mostra quantos relatos saem (`totalMonitorados`); com relatos, "Exportada em …" (`exportadaEm`) ou aviso com botão Exportar |
| `DialogExportar` | `demanda \| null`, `relatos`, `onClose`, `onExcluir` | `Dialog*`, `Alert`, `ResumoCategorias` | M7. Resumo e última exportação; depois, os caminhos com copiar (`lib/copiar.ts`) e "Excluir demanda" (RF-27) |
| `MenuAcoesDemanda` | `demanda`, `podeEditarLocal`, `onEditar`, `onExcluir` | `DropdownMenu*`, `Button` | M6. Gatilho `Settings2` + "Demanda" ao lado de "Nova demanda"; `modal={false}`. Itens: Editar, Exportar (M7), Excluir |

## Convenções

- Diálogo com formulário: `form` com `id` + botão submit no `footer` do `DialogContent`
  (`form={ID_FORM}`). O diálogo não fecha enquanto a mutação está pendente.
- Erro de mutação: o toast sai no hook (`aoErrar`), e o diálogo só captura para ficar aberto.
- Acessibilidade: `aria-label` com o número do relato nos controles de linha e `aria-sort` nos
  cabeçalhos. Ícone decorativo com `aria-hidden`. Ícone que carrega informação (alerta de situação) tem `role="img"` + `aria-label`.
- Cores: use só as variantes do `nfse-ds` (`neutral | success | warning | error | info`) e não crie
  hex novo. Laranja = `warning`.

