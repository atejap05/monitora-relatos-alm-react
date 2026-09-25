# Roadmap da SPA

Visão da SPA dentro das fases do produto. O status oficial e as rodadas medidas ficam em
`vsrun/.../roadmap.md`. Esta tabela só liga versões da SPA às fases.

| Versão SPA | Script | Fase | Conteúdo | Status |
|------------|--------|------|----------|--------|
| 0.1.0 | 0.4.x | P5b/P5c | MVP: auth, demandas A/B/C + nova, cadastrar/atualizar/editar/excluir relato, varredura com progresso | **Medida** (2026-09-23) |
| — | — | P5+ M0 | `docs/` (este diretório) + spec P5+ no vsrun | **Feita** (2026-09-24) |
| 0.2.0 | 0.4.2 | P5+ M1 | `lucide-react` e ícones nos botões. O script para de fixar a janela na frente | **Medida** (2026-09-24): ícones nos botões; `lucide-react` entrou na M2. Janela medida (script 0.4.2). Versão pulada: a SPA foi direto para 0.3.0 |
| 0.3.0 | — | P5+ M2 | Tabela sem a coluna Situação e menu hambúrguer de ações | **Medida** (2026-09-24): lint, 41 testes, build; menu ok na CEF (relato do operador) |
| 0.4.0 | 0.5.0 | P5+ M3 | Número do relato abre no ALM (navegador do sistema) | **Medida** (2026-09-24): abre no navegador padrão, que pede o PIN e vai direto à página do relato |
| 0.5.0 | 0.6.0 | P5+ M4 | Badges por categoria de status | **Medida** (2026-09-24): lint, 61 testes, build; ContÁgil ok (relato do operador). O `package.json` ficou em 0.4.0 nessa fase |
| 0.6.0 | 0.7.0 | P5+ M5 | Tester responsável | **Medida** (2026-09-24): lint, 69 testes, build, `FRONTEND.zip` 189,1 KB; ContÁgil ok, `<datalist>` funciona na CEF (relato do operador) |
| 0.7.0 | 0.8.0 | P5+ M6 | CRUD de demandas | **Código** (2026-09-25): lint, 80 testes, build, `FRONTEND.zip` ~190 KB; roteiro conferido no `dev:mock`. **Medida** no ContÁgil (2026-09-25, relato do operador) |
| 0.8.0 | 0.9.0 | P5+ M7 | Exportação JSON/CSV e ciclo de homologação | **Código** (2026-09-25): lint, 86 testes, build, `FRONTEND.zip` 192,3 KB; roteiro conferido no `dev:mock`. **Medida** no ContÁgil (2026-09-25, relato do operador) |
| — | — | P6 | Sheets (colunas admin, candidatos, tester vindo da planilha) | Prevista |

Ao fechar uma fase: atualizar esta tabela, `package.json` (`version`), o `roadmap.md` do vsrun e
gerar um novo `FRONTEND.zip`.
