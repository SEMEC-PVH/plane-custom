# Painel do projeto no estilo do Linear: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel lateral na lista de itens do projeto (Propriedades, Milestones, Progresso, Atividade) e propriedades novas nos cartões da aba Projetos do Plane.

**Architecture:** Backend num app Django nosso, `plane.semec`, com tabelas e migrations próprias, endpoints na API interna (sessão) e signals para a atividade. Frontend em `apps/web/core/{services,store,components}/semec/`, com encaixes mínimos nos arquivos do Plane. O filtro por clique usa o `WorkItemFilterStore` que já existe.

**Tech Stack:** Django 4 + DRF, pytest (Docker), React Router + MobX, `@plane/propel` (charts, tooltip), `@plane/i18n`.

**Spec:** `docs/superpowers/specs/2026-10-28-painel-projeto-design.md`

## Global Constraints

- Base: Plane CE `v1.4.2`, branch `semec`. Commits pequenos, mensagem com prefixo `semec:`, **sem** `Co-Authored-By` nem qualquer atribuição a IA.
- Não mexer em tabelas nem migrations do app `db` do Plane. Tabelas novas só no app `semec` (`db_table` com prefixo `semec_`).
- Arquivos do Plane alterados no backend: só `plane/settings/common.py` (registrar o app) e `plane/urls.py` (incluir as rotas). Nenhuma view do Plane é editada.
- Todo arquivo novo começa com o cabeçalho SPDX do Plane (`# Copyright (c) 2023-present Plane Software, Inc. and contributors` / `# SPDX-License-Identifier: AGPL-3.0-only` / `# See the LICENSE file for details.` — em TS, o mesmo dentro de `/** */`).
- Nenhuma chamada a serviço externo, telemetria ou analytics.
- Textos novos no namespace i18n `semec`, em `en` e `pt-BR`, seguindo a skill `translate`.
- Status do projeto: `backlog`, `planned`, `in-progress`, `paused`, `completed`, `cancelled` (padrão `backlog`). Prioridade: `urgent`, `high`, `medium`, `low`, `none` (padrão `none`).
- "Sem milestone", "Sem responsável" e "Sem label" mostram só a contagem, sem clique. Não estender o filtro do Plane.
- O gráfico usa as datas que estão no Plane, sem correção de dados migrados.
- Membros entrando ou saindo **não** geram atividade.

## Review Focus

1. Quem não é membro do projeto (ou é convidado num projeto com `guest_view_all_features = false`) não pode ver progresso, atividade nem o resumo do projeto na aba Projetos. Teste na Task 2, 3, 4 e 5.
2. Projeto sem registro de propriedades: o GET devolve os padrões e o PATCH cria o registro. Teste na Task 1.
3. Data alvo antes da data de início: 400, nada é gravado. Teste na Task 1.
4. Projeto sem itens e sem data de início: progresso devolve zeros e série vazia, sem erro de divisão. Teste na Task 2.
5. Módulo apagado (soft delete) ou vínculo item–módulo apagado: não conta no módulo, o item volta para "sem milestone", e a remoção aparece na atividade. Teste na Task 2 e Task 3.

---

### Task 0: Preparar o ambiente local

**Files:** nenhum arquivo do repositório.

- [ ] **Step 1:** Gerar `apps/api/.env`: `bash setup.sh` na raiz. Esperado: o arquivo existe (está no `.gitignore`).
- [ ] **Step 2:** Instalar o pnpm: `corepack enable` (ou `npm i -g pnpm@11.3.0`) e `pnpm install`. Esperado: `pnpm -v` mostra `11.3.0`.
- [ ] **Step 3:** Docker Desktop rodando (`%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe`). Rodar a suíte atual uma vez: `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit -q`. Esperado: passa (é a linha de base).

---

### Task 1: App `plane.semec` e propriedades do projeto

**Files:**
- Create: `apps/api/plane/semec/__init__.py`, `apps.py`, `models.py`, `serializers.py`, `urls.py`, `views/__init__.py`, `views/properties.py`, `migrations/__init__.py`, `migrations/0001_initial.py` (gerada)
- Create: `apps/api/plane/semec/tests/__init__.py`, `tests/conftest.py`, `tests/test_properties.py`
- Modify: `apps/api/plane/settings/common.py:113` (acrescentar `"plane.semec",` depois de `"plane.authentication",`)
- Modify: `apps/api/plane/urls.py` (acrescentar `path("api/", include("plane.semec.urls")),` logo depois da linha `path("api/", include("plane.app.urls")),`)

**Interfaces:**
- Produces:
  - `SemecConfig(AppConfig)`: `name = "plane.semec"`, `label = "semec"`. `ready()` importa `plane.semec.signals` (o módulo é criado na Task 3; até lá, `ready()` não importa nada).
  - `ProjectProperties(BaseModel)` (`from plane.db.models.base import BaseModel`): `project = OneToOneField("db.Project", CASCADE, related_name="semec_properties")`, `workspace = ForeignKey("db.Workspace", CASCADE, related_name="semec_project_properties")`, `status: CharField(max_length=20, choices=STATUS_CHOICES, default="backlog")`, `priority: CharField(max_length=20, choices=PRIORITY_CHOICES, default="none")`, `start_date: DateField(null=True)`, `target_date: DateField(null=True)`. `db_table = "semec_project_properties"`. `save()` copia `workspace` de `project.workspace`.
  - `get_or_default_properties(project) -> ProjectProperties` (não salvo quando não existe).
  - Rota `GET|PATCH /api/workspaces/<str:slug>/projects/<uuid:project_id>/semec/properties/`, resposta `{"project_id", "status", "priority", "start_date", "target_date"}` (datas `YYYY-MM-DD` ou `null`).
  - Fixtures em `tests/conftest.py`: `project` (projeto no `workspace` do conftest do Plane, com o `create_user` como `ProjectMember` role 20 e quatro `State`s: `Backlog`/backlog, `Todo`/unstarted, `Doing`/started, `Done`/completed, `Cancelled`/cancelled), `states` (dict grupo → State), `member_client` (sessão de um usuário role 15), `guest_client` (role 5), `outsider_client` (membro do workspace, não do projeto).

- [ ] **Step 1: Testes que falham** em `tests/test_properties.py` (`@pytest.mark.contract`, `@pytest.mark.django_db`):
  - `test_get_returns_defaults_without_row`: GET → 200, `{"status": "backlog", "priority": "none", "start_date": None, "target_date": None}`, e `ProjectProperties.objects.count() == 0`.
  - `test_patch_creates_row`: PATCH `{"status": "in-progress", "start_date": "2026-10-05", "target_date": "2026-11-09"}` → 200 com esses valores; uma linha no banco.
  - `test_patch_rejects_target_before_start`: PATCH `{"start_date": "2026-11-10", "target_date": "2026-11-09"}` → 400; nenhuma linha.
  - `test_patch_rejects_unknown_status`: `{"status": "done"}` → 400.
  - `test_member_can_patch` (200) / `test_guest_cannot_patch` (403) / `test_guest_can_get` (200) / `test_outsider_cannot_get` (403).
- [ ] **Step 2:** `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/semec -q`. Esperado: FAIL (módulo `plane.semec` não existe).
- [ ] **Step 3:** Implementar app, modelo, serializer e `ProjectPropertiesEndpoint(BaseAPIView)` (`plane.app.views.base`) com `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` no `get` e `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` no `patch` (`plane.app.permissions`). O PATCH valida datas com a data já gravada quando só uma vem no corpo.
- [ ] **Step 4:** Gerar a migration: `docker compose -f docker-compose-test.yml run --rm api-tests python manage.py makemigrations semec`. Esperado: `plane/semec/migrations/0001_initial.py` criado; cabeçalho SPDX acrescentado à mão.
- [ ] **Step 5:** Rodar os testes do Step 2. Esperado: PASS.
- [ ] **Step 6:** Commit: `semec: cria app semec com propriedades do projeto (status, prioridade, datas)`.

---

### Task 2: Endpoint de progresso

**Files:**
- Create: `apps/api/plane/semec/progress.py`, `apps/api/plane/semec/views/progress.py`, `apps/api/plane/semec/tests/test_progress.py`
- Modify: `apps/api/plane/semec/urls.py`

**Interfaces:**
- Consumes: `ProjectProperties`, `get_or_default_properties` (Task 1); fixtures da Task 1.
- Produces:
  - `scope_queryset(project_id, module_id=None) -> QuerySet[Issue]`: `Issue.issue_objects.filter(project_id=...)` sem o grupo `cancelled`; com `module_id`, só itens com `ModuleIssue` ativo (`issue_module__module_id=module_id, issue_module__deleted_at__isnull=True`), sem duplicar.
  - `compute_progress(project, module_id=None, today=None) -> dict` com:
    `{"scope": int, "started": int, "completed": int, "no_milestone": int, "assignees": [{"assignee_id": str|None, "display_name": str|None, "avatar_url": str|None, "total": int, "completed": int}], "labels": [{"label_id": str|None, "name": str|None, "color": str|None, "total": int, "completed": int}], "series": [{"date": "YYYY-MM-DD", "scope": int, "started": int, "completed": int}], "start_date": str|None, "target_date": str|None}`
  - Rota `GET /api/workspaces/<slug>/projects/<uuid:project_id>/semec/progress/?module_id=<uuid>`.

Regras (do spec e das decisões):
- `started` e `completed` no topo são contagens **atuais** e disjuntas (grupo `started` / grupo `completed`).
- `no_milestone`: itens do escopo sem nenhum `ModuleIssue` ativo de módulo não apagado e não arquivado. Com `module_id`, devolve `0`.
- `start_date`/`target_date`: do módulo quando `module_id` vem; senão, das propriedades do projeto.
- Série: um ponto por dia, de `start_date` (ou, sem ela, o menor `created_at` do escopo) até `today`. Sem itens e sem data: `[]`. Para cada dia `d`: `scope` = itens com `created_at.date() <= d`; `completed` = itens hoje no grupo `completed` com `completed_at.date() <= d`; `started` = itens hoje em `started` ou `completed` cuja primeira entrada em grupo `started` (de `IssueActivity` com `field="state"`, `new_identifier` = id de um estado do grupo `started`) é `<= d`. Sem essa atividade, vale `completed_at` (se concluído) ou `created_at`.
- Linhas `None` (sem responsável, sem label) entram nas listas, com `total` e `completed`.

- [ ] **Step 1: Testes que falham** em `tests/test_progress.py`:
  - `test_counts_exclude_cancelled`: 1 backlog, 2 started, 3 completed, 1 cancelled → `scope == 6`, `started == 2`, `completed == 3`.
  - `test_empty_project_returns_zeros_and_empty_series`: sem itens, sem propriedades → `scope == 0`, `series == []`, 200.
  - `test_module_filter_and_double_membership`: item A nos módulos M1 e M2 → aparece em `module_id=M1` e em `module_id=M2` (`scope == 1` em cada).
  - `test_no_milestone_ignores_deleted_links`: item com `ModuleIssue` apagado (`deleted_at` preenchido) conta em `no_milestone`; com módulo apagado, idem.
  - `test_assignee_rows_include_unassigned`: 1 item sem responsável → linha com `assignee_id is None` e `total == 1`.
  - `test_series_by_day` (com `today=date(2026, 10, 7)`, `start_date=2026-10-05`): item criado 05/10 e concluído 06/10 → série `[{05: scope 1, started 0, completed 0}, {06: 1, 1, 1}, {07: 1, 1, 1}]` (`started` usa `completed_at` porque não há atividade).
  - `test_guest_without_view_all_is_forbidden`: convidado, `guest_view_all_features=False` → 403; `True` → 200. `test_outsider_forbidden` → 403.
- [ ] **Step 2:** `pytest plane/semec/tests/test_progress.py -q` (pelo compose). Esperado: FAIL.
- [ ] **Step 3:** Implementar `progress.py` (funções puras sobre querysets; `today` injetável) e `ProjectProgressEndpoint` com `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` mais a checagem: convidado só passa se `project.guest_view_all_features`. Distribuições no mesmo estilo de `plane/app/views/module/base.py` (`.annotate(...).values(...).annotate(total=Count(...), completed=Count(..., filter=Q(state__group="completed")))`).
- [ ] **Step 4:** Rodar os testes. Esperado: PASS.
- [ ] **Step 5:** Commit: `semec: adiciona endpoint de progresso do projeto (contagens, distribuição e série diária)`.

---

### Task 3: Atividade do projeto

**Files:**
- Create: `apps/api/plane/semec/signals.py`, `apps/api/plane/semec/views/activity.py`, `apps/api/plane/semec/tests/test_activity.py`
- Modify: `apps/api/plane/semec/models.py`, `apps.py` (`ready()` importa `signals`), `urls.py`, nova migration `0002_*` (gerada)

**Interfaces:**
- Consumes: `ProjectProperties` (Task 1).
- Produces:
  - `ProjectActivity(BaseModel)`: `project` FK `db.Project` (CASCADE, `related_name="semec_activities"`), `workspace` FK, `actor` FK `db.User` (`SET_NULL`, null), `verb: CharField` (`created`/`updated`/`deleted`), `field: CharField` (`milestone`, `milestone.name`, `milestone.target_date`, `status`, `priority`, `start_date`, `target_date`, `lead`), `old_value: TextField(null)`, `new_value: TextField(null)`, `module: FK db.Module (SET_NULL, null)`. `db_table = "semec_project_activities"`, `ordering = ("-created_at",)`.
  - Rota `GET /api/workspaces/<slug>/projects/<uuid:project_id>/semec/activity/?limit=<n>` (padrão 200, máximo 200) → lista `{"id", "created_at", "actor": {"id", "display_name", "avatar_url"} | null, "verb", "field", "old_value", "new_value", "module_id"}`, mais recente primeiro.

Captura (signals, `actor = crum.get_current_user()` quando autenticado):
- `pre_save` em `ProjectProperties`, `db.Module` e `db.Project` guarda os valores antigos lidos com `sender._base_manager.filter(pk=instance.pk).first()`.
- `post_save` de `Module`: criado → `created`/`milestone` (`new_value` = nome); `deleted_at` passou de nulo a preenchido → `deleted`/`milestone` (`old_value` = nome); nome mudou → `updated`/`milestone.name`; `target_date` mudou → `updated`/`milestone.target_date`.
- `post_save` de `ProjectProperties`: um registro por campo alterado entre `status`, `priority`, `start_date`, `target_date` (inclusive na criação, comparando com os padrões).
- `post_save` de `Project`: `project_lead_id` mudou → `updated`/`lead` (valores = ids).

- [ ] **Step 1: Testes que falham** em `tests/test_activity.py`:
  - `test_module_create_rename_retarget_delete`: criar, renomear, mudar `target_date` e `delete()` um módulo → 4 registros, nessa ordem cronológica, com os `field`s acima.
  - `test_properties_patch_logs_each_changed_field`: PATCH `{"status": "in-progress", "priority": "high"}` → 2 registros com `actor` = usuário da sessão; PATCH repetido igual → nenhum registro novo.
  - `test_lead_change_logged`: mudar `project_lead` e `save()` → 1 registro `lead`.
  - `test_member_add_not_logged`: `ProjectMember.objects.bulk_create([...])` → 0 registros.
  - `test_limit_param`: 7 registros, `?limit=5` → 5, o primeiro é o mais recente.
  - `test_outsider_forbidden` → 403.
- [ ] **Step 2:** Rodar; esperado FAIL.
- [ ] **Step 3:** Implementar modelo, `makemigrations semec`, signals e `ProjectActivityEndpoint` (mesmas permissões do progresso).
- [ ] **Step 4:** Rodar; esperado PASS. Rodar também `pytest -m unit -q` para confirmar que os signals não quebram a suíte do Plane.
- [ ] **Step 5:** Commit: `semec: registra atividade do projeto (milestones, propriedades e lead)`.

---

### Task 4: Resumo dos projetos para a aba Projetos

**Files:**
- Create: `apps/api/plane/semec/views/workspace.py`, `apps/api/plane/semec/tests/test_workspace_summary.py`
- Modify: `apps/api/plane/semec/urls.py`

**Interfaces:**
- Consumes: `ProjectProperties` (Task 1), `scope_queryset` (Task 2).
- Produces: rota `GET /api/workspaces/<slug>/semec/projects/` → lista `{"project_id", "status", "priority", "start_date", "target_date", "scope", "completed"}`, só para projetos não arquivados em que o usuário é `ProjectMember` ativo. Projeto sem propriedades vem com os padrões. Uma consulta agregada para as contagens (sem N+1).

- [ ] **Step 1: Testes que falham:** `test_only_member_projects_listed` (projeto em que o usuário não é membro não aparece); `test_defaults_and_counts` (projeto sem propriedades → `backlog`/`none`; 3 itens, 1 concluído, 1 cancelado → `scope == 2`, `completed == 1`); `test_non_workspace_member_forbidden` → 403.
- [ ] **Step 2:** Rodar; FAIL.
- [ ] **Step 3:** Implementar `WorkspaceProjectSummaryEndpoint` com `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")`.
- [ ] **Step 4:** Rodar; PASS.
- [ ] **Step 5:** Commit: `semec: adiciona resumo das propriedades e do progresso por projeto`.

---

### Task 5: Base do frontend (tipos, serviço, store, i18n)

**Files:**
- Create: `packages/types/src/semec/index.ts`, `packages/types/src/semec/project-panel.ts`
- Modify: `packages/types/src/index.ts` (uma linha `export * from "./semec";`)
- Create: `apps/web/core/services/semec/project-panel.service.ts`
- Create: `apps/web/core/store/semec/project-panel.store.ts`, `apps/web/core/hooks/store/semec/use-semec-project-panel.ts`
- Modify: `apps/web/core/store/root.store.ts` (campo `semecProjectPanel`, criado nos dois construtores/reset como os demais)
- Create: `packages/i18n/src/locales/en/semec.json`, `packages/i18n/src/locales/pt-BR/semec.json` (e os demais locales conforme a skill `translate`)
- Modify: `packages/i18n/src/constants/namespaces.ts` (acrescentar `"semec"`)

**Interfaces:**
- Produces (tipos em `@plane/types`):
  - `TSemecProjectStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled"`; `TSemecProjectPriority = "urgent" | "high" | "medium" | "low" | "none"`.
  - `TSemecProjectProperties`, `TSemecProjectProgress`, `TSemecProjectActivity`, `TSemecProjectSummary` — espelham exatamente as respostas das Tasks 1–4.
- Produces (serviço `SemecProjectPanelService extends APIService`, padrão de `services/module.service.ts`): `getProperties(ws, projectId)`, `updateProperties(ws, projectId, data: Partial<TSemecProjectProperties>)`, `getProgress(ws, projectId, moduleId?)`, `getActivity(ws, projectId, limit?)`, `getProjectSummaries(ws)`.
- Produces (store MobX `SemecProjectPanelStore`): observáveis `propertiesMap: Record<projectId, TSemecProjectProperties>`, `progressMap: Record<"projectId:moduleId|all", TSemecProjectProgress>`, `activityMap: Record<projectId, TSemecProjectActivity[]>`, `summaryMap: Record<projectId, TSemecProjectSummary>`, `selectedModuleId: Record<projectId, string | null>`; ações `fetchProperties`, `updateProperties` (otimista, desfaz em erro), `fetchProgress`, `fetchActivity`, `fetchSummaries`, `setSelectedModule(projectId, moduleId | null)`. Hook `useSemecProjectPanel()`.
- Produces (i18n): chaves sob `semec.project_panel.*` e `semec.projects.*` (títulos das seções, rótulos dos status/prioridades, textos de atividade com placeholders `{actor}`, `{name}`, `{value}`).

- [ ] **Step 1:** Escrever tipos, serviço, store, hook e o namespace i18n (seguir a skill `translate` antes de criar os JSON).
- [ ] **Step 2:** `pnpm turbo run check:types --filter=web --filter=@plane/types --filter=@plane/i18n`. Esperado: sem erros.
- [ ] **Step 3:** `pnpm check:lint`. Esperado: sem erros novos.
- [ ] **Step 4:** Commit: `semec: adiciona tipos, serviço, store e traduções do painel do projeto`.

---

### Task 6: Painel lateral e seção Propriedades

**Files:**
- Create: `apps/web/core/components/semec/project-panel/root.tsx` (`SemecProjectPanel`), `toggle-button.tsx` (`SemecProjectPanelToggle`), `properties-section.tsx`, `section.tsx` (cabeçalho com ▾ e "+", recolhível)
- Modify: `apps/web/core/components/issues/filters.tsx` (botão de alternância antes do botão Analytics, só quando `storeType === EIssuesStoreType.PROJECT`)
- Modify: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/issues/(list)/page.tsx` (renderizar `<SemecProjectPanel projectId=... />` à direita, mesmo layout do `[moduleId]/page.tsx`: `absolute right-0 w-[24rem] ... border-l`)

**Interfaces:**
- Consumes: store/hook (Task 5); `useProject`, `useMember`, dropdowns do Plane (`MemberDropdown`, `DateRangeDropdown` em `apps/web/core/components/dropdowns`).
- Produces: `SemecProjectPanel({ projectId }: { projectId: string })`; estado aberto/fechado em `useLocalStorage("semec_project_panel_open", "false")`, compartilhado entre o botão e a página.

Comportamento:
- Status e prioridade: dropdown com os valores dos Global Constraints, ícones/cores iguais aos de status de módulo e prioridade de item.
- Lead e membros: gravam no projeto pelos métodos do `useProject` que a tela de configurações usa (`updateProject`, e para membros o fluxo de `ProjectMember` do Plane). Sem permissão de admin, mostram só leitura.
- Datas: `DateRangeDropdown`; erro 400 do servidor (alvo antes do início) vira toast e desfaz.
- Convidado vê tudo em leitura.

- [ ] **Step 1:** Implementar os componentes e os encaixes.
- [ ] **Step 2:** `pnpm turbo run check:types --filter=web` e `pnpm check:lint`. Esperado: sem erros.
- [ ] **Step 3:** Verificação na stack local (Task 11 explica como subir): abrir a lista de itens, abrir o painel, mudar status, prioridade e datas, recarregar a página e conferir que ficou gravado; conferir que o botão Analytics continua abrindo o modal.
- [ ] **Step 4:** Commit: `semec: adiciona painel lateral do projeto com a seção de propriedades`.

---

### Task 7: Seção Milestones

**Files:**
- Create: `apps/web/core/components/semec/project-panel/milestones-section.tsx`, `milestone-row.tsx`
- Modify: `apps/web/core/components/semec/project-panel/root.tsx`

**Interfaces:**
- Consumes: `useModule()` (`fetchModules`, `getProjectModuleIds`, `getModuleById` — já trazem `total_issues`, `completed_issues`, `target_date`); `useWorkItemFilters().updateFilterValueFromSidebar(EIssuesStoreType.PROJECT, projectId, condition)`; `createFilterUpdateHandler` de `apps/web/core/components/core/sidebar/progress-stats/shared.ts`; `setSelectedModule` e `no_milestone` do progresso (Tasks 2, 5); `CreateUpdateModuleModal` e `ModuleQuickActions` do Plane.
- Produces: `SemecMilestonesSection({ projectId })`.

Comportamento:
- Lista módulos não arquivados ordenados por `target_date` (sem data no fim, depois por nome). Linha: losango de progresso, nome, `"{pct}% de {total}"` (`pct = round(completed/total*100)`, `0` quando `total == 0`), data alvo, "⋯" com as ações do Plane.
- Clique na linha: `setSelectedModule(projectId, id)` e condição `{ property: "module_id", operator: "in", value: [id] }`; clique de novo na mesma linha: `setSelectedModule(projectId, null)` e `value: []`.
- Última linha "Sem milestone" com `no_milestone`, sem clique.
- "+" abre o modal de criação de módulo do Plane.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `check:types` e `check:lint` sem erros.
- [ ] **Step 3:** Na stack local: clicar num milestone filtra a lista; clicar de novo limpa; criar um módulo pelo "+" faz a linha aparecer.
- [ ] **Step 4:** Commit: `semec: adiciona seção de milestones (módulos) ao painel do projeto`.

---

### Task 8: Seção Progresso

**Files:**
- Create: `apps/web/core/components/semec/project-panel/progress-section.tsx`, `progress-chart.tsx`, `progress-distribution.tsx`
- Modify: `apps/web/core/components/semec/project-panel/root.tsx`

**Interfaces:**
- Consumes: `fetchProgress`/`progressMap`/`selectedModuleId` (Task 5); `LineChart` de `@plane/propel/charts`; os mesmos filtros da Task 7.
- Produces: `SemecProgressSection({ projectId })`; `buildProjection(series, targetDate): { date: string; completed: number }[]` em `progress-chart.tsx`.

Comportamento:
- Recarrega quando `selectedModuleId` muda (`fetchProgress(ws, projectId, moduleId ?? undefined)`).
- Números: Escopo (clique limpa o filtro de `state_group`), Iniciados (`{ property: "state_group", operator: "in", value: ["started"] }`), Concluídos (`["completed"]`).
- Gráfico: três linhas (escopo, iniciados, concluídos) da `series`; linha tracejada de projeção do último ponto de `completed` até `scope` em `target_date`, só quando há `target_date` no futuro e a série tem 2 pontos ou mais (`buildProjection` usa a média diária de concluídos dos últimos 14 pontos; se for 0, não desenha).
- Abas Responsáveis / Labels: linha com avatar ou cor, nome, `"{pct}% de {total}"`. Clique filtra por `assignee_id` / `label_id` (`createFilterUpdateHandler`). Linhas `null` só mostram a contagem.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `check:types` e `check:lint` sem erros.
- [ ] **Step 3:** Na stack local: números batem com a lista sem filtro; clicar em Iniciados filtra; selecionar um milestone muda os números e o gráfico; projeto sem data de início e sem itens mostra zeros sem gráfico.
- [ ] **Step 4:** Commit: `semec: adiciona seção de progresso com gráfico e distribuição ao painel do projeto`.

---

### Task 9: Seção Atividade

**Files:**
- Create: `apps/web/core/components/semec/project-panel/activity-section.tsx`, `activity-modal.tsx`
- Modify: `apps/web/core/components/semec/project-panel/root.tsx`

**Interfaces:**
- Consumes: `fetchActivity`/`activityMap` (Task 5); `ModalCore` de `@plane/ui`.
- Produces: `SemecActivitySection({ projectId })`.

Comportamento:
- Mostra as 5 mais recentes (`fetchActivity(ws, projectId, 5)`); "Ver tudo" abre o modal com `fetchActivity(ws, projectId)`.
- Texto por `field`/`verb` via i18n: "{actor} adicionou o milestone {name}", "{actor} removeu o milestone {name}", "{actor} renomeou o milestone para {name}", "{actor} mudou a data alvo do milestone {name} para {value}", "{actor} mudou o status para {value}", idem prioridade, data de início, data alvo e lead (nome do membro resolvido com `useMember`). Data em `renderFormattedDate`.
- Recarrega depois de qualquer edição feita pelo painel (Tasks 6 e 7).

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `check:types` e `check:lint` sem erros.
- [ ] **Step 3:** Na stack local: mudar o status e criar um milestone pelo painel; as duas linhas aparecem no topo da Atividade.
- [ ] **Step 4:** Commit: `semec: adiciona seção de atividade ao painel do projeto`.

---

### Task 10: Aba Projetos (cartões, filtros e ordenação)

**Files:**
- Create: `apps/web/core/components/semec/projects/card-properties.tsx` (`SemecProjectCardProperties`), `apps/web/core/store/semec/project-filters.ts`
- Modify: `apps/web/core/components/project/card.tsx` (renderizar `<SemecProjectCardProperties projectId=... />` abaixo do cabeçalho do cartão)
- Modify: `apps/web/core/components/project/card-list.tsx` (chamar `fetchSummaries(workspaceSlug)` ao montar)
- Modify: `packages/types/src/project/project_filters.ts` (`TProjectFilters` ganha `semec_status?: TSemecProjectStatus[] | null` e `semec_priority?: TSemecProjectPriority[] | null`; `TProjectOrderByOptions` ganha `"semec_target_date" | "-semec_target_date" | "semec_start_date" | "-semec_start_date" | "semec_priority" | "semec_status"`)
- Modify: `apps/web/core/store/project/project.store.ts:158-175` (`filteredProjectIds` aplica `applySemecProjectFilters` depois do filtro/ordenação do Plane)
- Modify: `apps/web/core/components/project/filters.tsx` e os componentes de filtro em `apps/web/core/components/project/dropdowns/filters/` (seções Status e Prioridade; opções novas de ordenação)

**Interfaces:**
- Consumes: `summaryMap`, `fetchSummaries` (Task 5).
- Produces: `applySemecProjectFilters(projects: TProject[], summaries: Record<string, TSemecProjectSummary>, filters: TProjectFilters | undefined, orderBy: TProjectOrderByOptions | undefined): TProject[]` — filtra por `semec_status`/`semec_priority` (lista vazia ou `null` = sem filtro; projeto sem resumo conta como `backlog`/`none`) e, só se `orderBy` começar com `semec_`, reordena: datas com `null` no fim, prioridade na ordem `urgent > high > medium > low > none`, status na ordem dos Global Constraints.

Cartão: chip de status (ícone + rótulo), chip de prioridade (oculto quando `none`), datas `início → alvo` (ocultas quando ambas nulas), barra de progresso `completed/scope` (oculta quando `scope == 0`). O lead já aparece no cartão do Plane.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `check:types` e `check:lint` sem erros.
- [ ] **Step 3:** Na stack local: cartões mostram os dados; filtrar por "Em andamento" e ordenar por data alvo funcionam; os filtros do Plane (lead, membros) continuam funcionando junto.
- [ ] **Step 4:** Commit: `semec: mostra propriedades e progresso nos cartões da aba Projetos`.

---

### Task 11: Validação na stack local e registro

**Files:**
- Modify: `CLAUDE.md` (seção "Regras de customização": uma linha dizendo que o app `plane.semec` e `apps/web/core/**/semec/` concentram a customização, e que a imagem a gerar é `plane-backend` + `plane-frontend`)

- [ ] **Step 1:** Subir a stack local com o código da branch: `docker compose -f docker-compose-local.yml up -d` (backend) e `pnpm dev --filter=web` (frontend em `localhost:3000`). Esperado: `migrator` aplica `semec.0001` e `semec.0002` sem erro.
- [ ] **Step 2:** Rodar a suíte inteira do backend: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`. Esperado: exit 0.
- [ ] **Step 3:** Roteiro manual completo (Tasks 6–10, Step 3 de cada) com um usuário admin e um convidado.
- [ ] **Step 4:** `pnpm check`. Esperado: sem erros.
- [ ] **Step 5:** Commit: `semec: registra no CLAUDE.md onde fica a customização do painel do projeto`.
