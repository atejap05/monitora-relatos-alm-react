# Especificação da SPA — Monitora Relatos ALM

**Versão do documento:** 1.0 (2026-09-24)
**SPA atual:** `monitora-relatos-alm-react` 0.1.0 (P5 medida em 2026-09-23)
**Requisitos de produto:** `vsrun/.../SPEC.md` — cada RUI abaixo cita o RF que atende.

---

## 1. Público e ambiente

- **Usuário:** o operador RFB da homologação NFSe. Os testers municipais não usam a SPA.
- **Ambiente:** a janela CEF do e-Navegador (`nav_ui`) aberta pelo script. Ela carrega de `file://`
  (blob `FRONTEND`) ou de `localhost:5174`/`4174` (desenvolvimento). A tela é de desktop e nunca é
  pública.
- **Idioma:** pt-BR com acentos (os logs do Python ficam em ASCII, e a SPA não tem essa restrição).

## 2. Telas

A SPA tem uma rota com conteúdo, `#/demanda/:demandaId`. Qualquer outra rota redireciona para a primeira demanda.

```
┌ Cabeçalho ─────────────────────────────────────────────────────────────┐
│ Monitora Relatos ALM · script x.y.z   [badge fase] [Persona] [Fechar]  │
├────────────────────────────────────────────────────────────────────────┤
│ PainelSessao (convite / autenticando / sessão expirada)                │
│ BarraVarredura (só durante varredura)                                  │
│ Abas de demanda (Nome (n))                          [Nova demanda]     │
│   [Cadastrar relatos] [Atualizar esta demanda] [Atualizar todas] [🔍] │
│   TabelaRelatos                                                        │
│ Arquivo local gravado em dd/mm/aaaa hh:mm                              │
├────────────────────────────────────────────────────────────────────────┤
│ Rodapé: "Somente leitura no ALM"                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Cabeçalho (`Cabecalho`)

| RUI | Requisito | RF |
|-----|-----------|----|
| RUI-01 | O nome e o CPF da Persona aparecem sempre. Sem Persona, a tela mostra "Usuário não identificado" / "CPF indisponível" | RF-12 |
| RUI-02 | Badge da fase: neutro (não autenticado), info (autenticando/preparando), success (sessão ativa) e error (sessão expirada) | RF-01, RF-14 |
| RUI-03 | **Fechar** fica ativo em qualquer fase, inclusive na varredura e na auth. Ele só é desabilitado depois de enviado | RF-13 |

### 2.2 Painel de sessão (`PainelSessao`)

| RUI | Requisito | RF |
|-----|-----------|----|
| RUI-04 | Em `nao_autenticado`: convite com o botão **Autenticar no ALM** e o texto sobre PIN e ações locais | RF-01 |
| RUI-05 | Em `autenticando`/`aquecendo_ccm`: spinner, o texto do evento `status` e o aviso de que o X não responde (usar Fechar) | RF-01, SPEC §11 |
| RUI-06 | Sessão expirada: alerta de erro com **Reautenticar**, e a lista local continua visível | RF-14 |

### 2.3 Demanda (`PaginaDemanda`)

| RUI | Requisito | RF |
|-----|-----------|----|
| RUI-07 | Uma aba por demanda com o total de monitorados. **Nova demanda** abre o diálogo com validação de slug único | RF-05, RF-17 |
| RUI-08 | **Cadastrar relatos**: um ou vários números (linha, vírgula, `;` ou espaço), com validação local `1..2147483647` igual à do STORE e o resultado por número em toast | RF-03, RF-04 |
| RUI-09 | **Atualizar esta demanda** / **Atualizar todas**: dispara a varredura; o progresso vem por evento | RF-06 |
| RUI-10 | Filtro de texto (número, título, status, anotações) e ordenação por coluna | RF-05 |
| RUI-11 | A lista do JSON aparece **antes** da auth. As ações ALM ficam desabilitadas sem sessão | RF-11 |

### 2.4 Tabela de relatos (`TabelaRelatos`) — com M2 (RF-19)

Colunas: Nº ALM · Título · Status ALM · Última consulta · Anotações · Ações.

- **Status ALM (M4, RF-21):** badge com o texto do ALM na cor de `categoriaStatus` (vem pronto do
  STORE): vermelho = aberto, laranja = com a TI, azul = aguardando a RFB, verde = concluído, cinza =
  desconhecido. O tooltip explica a categoria. A ordenação segue o fluxo (aberto → TI → RFB →
  concluído) e depois o texto. Acima da tabela, `ResumoCategorias` conta os relatos por categoria.

- **Nº ALM (M3, RF-20):** botão com aparência de link (cor primária + `ExternalLink`) que pede
  `abrir_no_alm`. O script abre o relato no navegador do sistema. Funciona sem sessão e fica
  desabilitado só quando a tela está ocupada (`podeEditarLocal`). Toast "abrindo no navegador do sistema".
  O navegador tem sessão própria e pede o PIN na primeira abertura (medido em 2026-09-24).

- **Última consulta:** a data da última consulta `ok`, ou "Não consultado". Se a última consulta falhou
  (`situacaoConsulta ≠ ok`), um ícone de alerta (vermelho para erro, laranja para aviso) com tooltip e
  `aria-label` com o rótulo de `src/lib/situacao.ts`.
- **Ações:** um botão hambúrguer por linha (`aria-label="Ações do relato N"`) abre um menu com Atualizar
  (azul, precisa de `podeConsultarAlm`), Editar, Abrir no ALM e, depois de um separador, Excluir (vermelho),
  estes três com `podeEditarLocal`. Quando nada é permitido, o botão fica desabilitado. O menu é `modal={false}` para
  não deixar o `body` travado quando Editar ou Excluir abrem um diálogo.

| RUI | Requisito | RF |
|-----|-----------|----|
| RUI-12 | Atualizar um relato consulta o ALM e mostra toast "atualizado" / "sem mudanças" / erro | RF-07 |
| RUI-13 | **Editar**: anotações e observações (até 2000 caracteres cada, com contador, e vazio limpa). Funciona sem sessão | RF-15 |
| RUI-14 | **Excluir**: confirmação dizendo que o relato continua no ALM e avisando se há anotações que serão perdidas | RF-16 |

### 2.5 Varredura (`BarraVarredura`)

| RUI | Requisito | RF |
|-----|-----------|----|
| RUI-15 | Barra "Consultando o ALM: N de M · relato X", alimentada pelos eventos `varredura` | RF-06, SPEC §7.1 |
| RUI-16 | Durante a varredura só **Fechar** fica ativo. Depois do evento `varredura-fim`, a tabela é substituída pelo estado que veio no evento | RF-06 |

## 3. Estados de bloqueio (`useBloqueios`)

O backend é serial. A SPA espelha isso para não gerar `ocupado-*` à toa.

| Condição | `podeConsultarAlm` | `podeEditarLocal` | `podeAutenticar` |
|----------|--------------------|-------------------|------------------|
| Mutação em curso, varredura, auth ou encerrando (`ocupado`) | não | não | não |
| Não autenticado | não | sim | sim |
| Autenticado | sim | sim | não |
| Sessão expirada | não | sim | sim |

`podeConsultarAlm` controla Cadastrar, Atualizar (um/demanda/todas). `podeEditarLocal` controla Editar,
Excluir e Nova demanda.

## 4. Mensagens e feedback

- Um erro da ponte vira toast com o texto de `src/lib/mensagens.ts` (um código por entrada de
  `frontend-integration.md` §4.5). Código novo → mensagem nova no mesmo commit.
- Um sucesso vira um toast curto que diz o que mudou. Uma recusa que alterou a lista (404 que remove) aplica o
  estado que veio junto antes do toast.
- Falha no boot: alerta "Sem resposta do script" com **Tentar de novo**.

## 5. P5+ — requisitos de UI previstos (M1–M7)

Detalhe em `vsrun/.../SPEC.md` §3.3 e `roadmap.md` §P5+. Resumo do lado da tela:

| RUI | Fase | Requisito | RF |
|-----|------|-----------|----|
| RUI-20 | M1 ✅ | Ícones `lucide-react` (`aria-hidden` nos decorativos) nos botões de Cadastrar, Atualizar, Nova demanda, Fechar e Autenticar | RF-18 |
| RUI-21 | M2 ✅ | A coluna Situação sai. Situação ≠ `ok` vira ícone de alerta com tooltip em Última consulta | RF-19 |
| RUI-22 | M2 ✅ | Ações por linha num menu hambúrguer (`DropdownMenu`): Atualizar (azul), Editar e, depois de um separador, Excluir (vermelho) | RF-19 |
| RUI-23 | M3 ✅ | O número do relato é um link (botão) que abre o work item no navegador do sistema, e o menu ganha "Abrir no ALM" | RF-20 |
| RUI-24 | M4 ✅ | Status ALM como badge colorido por categoria, com ordenação por categoria e contagem por categoria na aba | RF-21 |
| RUI-25 | M5 | Coluna Tester e campo tester no cadastro e na edição, com sugestões (`TextField` + `<datalist>`; o `Combobox` do nfse-ds não aceita texto livre) | RF-22 |
| RUI-26 | M6 | Menu da demanda (Editar · Exportar · Excluir), descrição abaixo das abas e exclusão em cascata com contagem | RF-23..RF-25 |
| RUI-27 | M7 | Diálogo Exportar (resumo, caminhos gravados, copiar), selo "Homologação concluída" e "Exportar e excluir" | RF-26, RF-27 |

## 6. Critérios de aceite da SPA

1. `npm run lint`, `npm test` e `npm run build` verdes.
2. O roteiro de [testing.md](./testing.md) §3 passa no `dev:mock`.
3. O roteiro da fase passa no ContÁgil (dev e blob `FRONTEND`), com a rodada registrada em `roadmap.md` no vsrun.
