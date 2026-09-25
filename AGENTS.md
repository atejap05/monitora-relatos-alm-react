# Guia para agentes — monitora-relatos-alm-react

1. A spec manda: `vsrun/repo/scripts-docs/monitora-relatos-alm/` — leia `SPEC.md`,
   `frontend-integration.md` e `roadmap.md` §P5 antes de mudar comportamento. Mudança de
   contrato começa lá, depois `src/@types/backend.ts`, depois o mock.
2. Backend só por `pedir()` (`src/bridge/pedir.ts`). Proibido `fetch`, `window.get_*`,
   `adicionarFuncoes`.
3. Ponte serial. Não chamar `transferirControleParaScript` sem item na fila (o script
   interpreta como X e encerra). Só `fechar` fura a fila.
4. O mock (`src/bridge/mock.ts`) imita `MonitoraRelatosAlm.py` + `STORE`: toda regra nova do
   backend entra no mock e no teste do mock no mesmo commit.
5. No ALM é só leitura. Editar/excluir mexem apenas no JSON local.
6. Validação de número ALM igual à do STORE: dígitos, faixa `1..2147483647` (`src/lib/numeros.ts`).
7. TanStack Table é **v9** (`useTable`, `tableFeatures`, `table.FlexRender`) — não use a API v8.
   As skills do pacote ficam em `node_modules/@tanstack/*/skills`.
8. Antes de concluir: `npm run lint`, `npm test`, `npm run build`. Em testes no Windows o pool
   é `threads` (forks estoura timeout nesta estação).
9. Teste de verdade é no ContÁgil (P5c); registrar rodadas no `roadmap.md` do vsrun.
10. Documentação da SPA em `docs/` (comece por `docs/README.md`). Mudou tela, componente ou fluxo:
    atualize `docs/SPEC-frontend.md` / `components.md` no mesmo commit. O contrato não é copiado lá.
