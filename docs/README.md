# Documentação do frontend — Monitora Relatos ALM

SPA React do operador RFB, aberta no e-Navegador (CEF) pelo script `MonitoraRelatosAlm.py`
(Python/JEP) do ContÁgil. Estes documentos descrevem **a SPA**. O produto, o backend e o contrato da
ponte ficam no repositório **vsrun**, que é a fonte da verdade:

| Tema | Onde está | Quem manda |
|------|-----------|------------|
| Produto, RFs, critérios de aceite | `vsrun/repo/scripts-docs/monitora-relatos-alm/SPEC.md` | vsrun |
| Contrato da ponte (ações, eventos, erros) | `vsrun/.../frontend-integration.md` | vsrun |
| Modelo de dados e sync | `vsrun/.../domain-and-sync.md` | vsrun |
| Fases e rodadas medidas | `vsrun/.../roadmap.md` (§P5, §P5+) | vsrun |
| Telas, estados de UI e requisitos de UI (RUI) | [SPEC-frontend.md](./SPEC-frontend.md) | este repo |
| Camadas e fluxo de dados da SPA | [architecture.md](./architecture.md) | este repo |
| Catálogo de componentes | [components.md](./components.md) | este repo |
| Mock, testes e roteiro manual | [testing.md](./testing.md) | este repo |
| Versões da SPA × fases | [roadmap-frontend.md](./roadmap-frontend.md) | este repo |

## Ordem de leitura

1. `SPEC.md` do vsrun (§1, §3, §4) — o que o produto faz.
2. [SPEC-frontend.md](./SPEC-frontend.md) — como a tela entrega isso.
3. `frontend-integration.md` do vsrun (§2, §4, §6) — o contrato.
4. [architecture.md](./architecture.md) → [components.md](./components.md) → [testing.md](./testing.md).
5. [roadmap-frontend.md](./roadmap-frontend.md) — em que fase estamos.

## Regras que não mudam

- A spec vem antes do código. Mudança de contrato segue esta ordem: `frontend-integration.md` (vsrun) →
  `src/@types/backend.ts` → `src/bridge/mock.ts` + teste do mock, no mesmo commit.
- O backend é acessado **só** por `pedir()`. Não há `fetch`, `window.get_*` nem `adicionarFuncoes`.
- No ALM a aplicação só lê. Editar e excluir mexem apenas no JSON local.
- Estes docs não copiam o contrato. Eles apontam para ele. Se um campo mudar, só o vsrun muda.
