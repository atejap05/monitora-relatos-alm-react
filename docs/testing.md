# Testes

## 1. Automatizados (Vitest + Testing Library, jsdom)

`npm test`. O pool é `threads` (com `forks` a inicialização estoura o tempo limite nesta estação). Setup em `src/test/setup.ts`.

| Arquivo | Cobre |
|---------|-------|
| `src/bridge/fila.test.ts` | Ponte invertida: entrega ao pedido certo, serialização, `fechar` furando a fila, reenvio só com item na fila, `__notificar` |
| `src/bridge/mock.test.ts` | Mock com paridade ao backend: semeadura A/B/C, recusa sem sessão, fases da auth, lote (ok / 404 / id inválido), editar+varredura preserva, eventos de varredura, 401, criar demanda, abrir no ALM (URL do itemName, faixa) |
| `src/components/TabelaRelatos.test.tsx` | Ordenação, filtro, sem a coluna Situação, alerta de situação, ações pelo menu, abrir no ALM pelo número e pelo menu (sem sessão), link desabilitado quando ocupado, item desabilitado sem sessão, menu desabilitado quando ocupado, lista vazia. O menu Radix é aberto pelo teclado (`focus` + Enter), que é estável no jsdom |
| `src/lib/categorias.test.ts` | Paridade com `STORE.categoria_estado`: os 11 estados, IDs medidos, normalização, comparação exata, estado novo |
| `src/lib/numeros.test.ts` | Paridade com `STORE.validar_numero_alm` e `normalizar_id_demanda`, parsing de lote |

Regras:

- Toda regra nova do backend entra no `mock.ts` **e** no `mock.test.ts` no mesmo commit.
- Toda regra replicada do STORE ganha um teste de paridade com os mesmos casos de `scripts/test_store_modelo.py` (vsrun).
- Antes de concluir: `npm run lint && npm test && npm run build`.

## 2. Mock (`npm run dev:mock`)

`.env.mock` define `VITE_BACKEND=mock`. O backend fica em memória com estado no `sessionStorage` (sobrevive ao F5).

| Entrada | Efeito |
|---------|--------|
| `999999999` ou começando por `9999` | `nao-encontrado` (404), não entra na lista |
| `401` | `sessao-caiu`: a sessão cai e o lote para |
| Fora de `1..2147483647` / não numérico | `id-invalido` sem consulta |

O mock emite as fases da auth (`autenticando` → `aquecendo_ccm` → `autenticado`), o progresso e
o fim de varredura, como o script.

## 3. Roteiro manual (mock)

1. Abrir → lista antes da auth, demandas A/B/C.
2. Autenticar → fases no badge e a varredura ao abrir com a barra.
3. Cadastrar `5477222, 5483739, 5489614, 999999999` → 3 entram, o 404 avisa.
4. Menu ☰ de uma linha → Atualizar → toast. Atualizar todas → barra `N de M`, com só o Fechar ativo.
5. Menu ☰ → Editar as anotações → tooltip na tabela. Menu ☰ → Excluir (vermelho) → some da lista.
   Cadastrar `401` → a linha mostra o alerta laranja em Última consulta.
6. Clicar num número (antes e depois da auth) → toast "abrindo no navegador do sistema". O mock não abre
   o navegador: só o script faz isso.
7. Badges: o mock usa Aberto / Em Atendimento / Liberado para Teste / Concluído. Conferir as cores, o resumo
   acima da tabela e a ordenação por Status ALM.
8. Nova demanda → aba nova. F5 → o estado se mantém.

Cada fase da P5+ acrescenta passos a este roteiro (ver `roadmap.md` §P5+ no vsrun).

## 4. ContÁgil (aceite de verdade)

- Dev: parâmetro `producao = false` no cenário + `npm run dev` (porta 5174), com HMR e backend real.
- Produção: `npm run deploy` → `FRONTEND.zip` como blob `FRONTEND`, parâmetro `producao = true`.
- A rodada é registrada em `vsrun/.../roadmap.md` com o relatório do ContÁgil (0 erros) e as hipóteses marcadas.
