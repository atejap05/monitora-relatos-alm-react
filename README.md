# monitora-relatos-alm-react

SPA do **Monitora Relatos ALM**: o operador RFB acompanha, no e-Navegador do ContÁgil, os relatos
já abertos no ALM SERPRO (homologação NFSe). Fase **P5** do produto.

Documentação da SPA (telas, arquitetura, componentes, testes): [`docs/`](./docs/README.md).

A spec é a fonte da verdade e fica no repositório **vsrun**:
`vsrun/repo/scripts-docs/monitora-relatos-alm/` (`SPEC.md`, `frontend-integration.md`, `roadmap.md` §P5).
O backend é o script `MonitoraRelatosAlm.py` (Python/JEP) + anexos `AUTH`/`OSLC`/`STORE`.

## O que a tela faz (MVP)

- Demandas **A, B e C** (placeholders até a P6 trazer as abas da planilha) e **Nova demanda**.
- Por relato: **Cadastrar** (um ou vários), **Atualizar** (um, a demanda ou todas), **Editar**
  anotações/observações (só no JSON local) e **Excluir** da lista. No ALM é só leitura (GET).
- Autenticação ALM com status ao vivo, varredura ao abrir com barra de progresso, Persona e **Fechar**.

## Stack

React 19, Vite, TypeScript, Tailwind v4, TanStack Query/Table (v9)/Form, Zustand, React Router
(`HashRouter`), `nfse-ds` (`file:../NFSe/nfse-ds` — rode `npm run build` lá antes, se o `dist` faltar).

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run dev:mock` | Navegador comum, backend **mock** em memória (sem ContÁgil) |
| `npm run dev` | Vite em `:5174` — cenário com `producao = false` (backend real do ContÁgil) |
| `npm run preview` | `dist` em `:4174` — cenário com `producao = false` e `preview = true` |
| `npm run lint` / `npm test` / `npm run build` | Qualidade e build |
| `npm run deploy` | Build + `FRONTEND.zip` na raiz (blob do cenário) |

### Mock (`VITE_BACKEND=mock`, arquivo `.env.mock`)

Simula fases da auth, eventos de varredura e erros. Estado em `sessionStorage` (sobrevive ao F5).
Números especiais: `999999999` ou começando por `9999` → não encontrado (404); `401` → sessão expira.

## Publicar no ContÁgil

1. `npm run deploy`.
2. No cenário **MonitoraRelatosAlm** (Python/JEP), anexar `FRONTEND.zip` como blob **`FRONTEND`**.
3. Republicar junto o script (0.4.x) e os blobs `AUTH`, `OSLC`, `STORE`. Git não é produção.
4. Parâmetro `producao = true` (ou `PRODUCAO_PADRAO = True` no script). Sem o blob, o script
   encerra com `frontend-ausente` e a instrução no log — não há mais UI HTML de reserva.

## Testar no ContÁgil sem publicar o ZIP

Como no Painel NFSe: no cenário, parâmetro `producao = false` (e `preview = false`), depois
`npm run dev` aqui e execute o script. A SPA abre do `localhost:5174` com HMR e fala com o
backend real. Para testar o build: `npm run build && npm run preview` com `preview = true`.

## Integração (resumo)

- Único caminho: `pedir(payload)` em `src/bridge/` — **ponte invertida** (`window.__fila`,
  `__entregar`). Nunca `fetch`, `window.get_*` ou `adicionarFuncoes`.
- Um pedido por vez (fila serial); só `fechar` fura a fila, para interromper varredura.
- Nunca chamar `transferirControleParaScript` com a fila vazia: o script lê isso como X clicado.
- Eventos do Python chegam por `window.__notificar` (`fase`, `status`, `varredura`,
  `varredura-fim`, `sessao-caiu`) → Zustand (`src/state/sessao.ts`) e cache do Query.
- Contrato tipado em `src/@types/backend.ts`; mudou lá, mude antes em `frontend-integration.md`.

## Estrutura

```
src/
  @types/backend.ts   contrato da ponte
  bridge/             fila (ponte real), mock, eventos, pedir
  service/backend.ts  chamadas tipadas + ErroBackend
  state/sessao.ts     fase, persona, progresso, sessão caída (Zustand)
  hooks/              useEstado (Query), useAcoes (mutações), useBloqueios
  pages/PaginaDemanda.tsx
  components/         Cabecalho, PainelSessao, BarraVarredura, TabelaRelatos, diálogos
  lib/                numeros (faixa 1..2147483647, igual ao STORE), mensagens, formato
```
