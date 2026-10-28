# Painel do projeto no estilo do Linear: desenho

Data: 2026-10-28. Base: Plane Community Edition `v1.4.2`, branch `semec`.

## Intenção

A equipe de TI da SEMEC está trocando o Linear pelo Plane. No Linear, cada projeto tem um painel lateral com as propriedades, os milestones, o progresso e a atividade. Ele serve para acompanhar o projeto no dia a dia: dá para editar as propriedades ali mesmo, e clicar num milestone ou num número filtra a lista de itens.

No Plane, o mais próximo disso é o botão **Analytics** da lista de itens do projeto (`WorkItemsModal`). Ele é só leitura e funciona como um relatório rápido: não edita nada nem filtra a lista. O objetivo é trazer para o Plane o painel do Linear e mostrar as propriedades novas também na aba Projetos.

O que conta como sucesso: o time abre a lista de itens do SISConforme, vê o painel do lado e acompanha o projeto sem voltar ao Linear.

## Objetivos

1. Um painel lateral na lista de itens do projeto, com quatro seções: **Propriedades**, **Milestones**, **Progresso** e **Atividade**.
2. Propriedades novas no projeto: **status**, **prioridade**, **data de início** e **data alvo**. Elas são editáveis no painel.
3. Na aba **Projetos**, os cartões mostram status, prioridade, lead, datas e a barra de progresso. Dá para filtrar e ordenar por status, prioridade e data.

## Fora do escopo

- Labels de projeto, Teams e Slack. Ninguém usa no Linear: o workspace não tem nenhuma label de projeto.
- Lista em linhas na aba Projetos, como a do Linear. Foi escolhida a versão em cartões.
- Uma estrutura nova de milestones. Os **módulos** do Plane fazem esse papel (ver abaixo).
- Importar o histórico de atividade do Linear ou do que já aconteceu no Plane.
- Corrigir as datas dos itens migrados do Linear, ou qualquer outra coisa ligada a migrações. Decisão do Pedro: migrações ficam para depois. O objetivo agora é melhorar o Plane.
- Atividade dos itens no painel. Cada item já tem a atividade dele.

## O que não pode acontecer

- Mexer nas tabelas ou nas migrations do app `db` do Plane. Toda atualização de versão viraria conflito.
- Qualquer chamada a serviço externo, telemetria ou analytics. Os dados podem estar sob sigilo fiscal.
- Quebrar as telas que já existem: o modal Analytics, a página de módulos e os cartões continuam funcionando.
- Remover ou deixar sem cabeçalho de licença AGPL qualquer arquivo. Arquivo novo leva o mesmo cabeçalho SPDX dos arquivos do Plane.

## Contexto que o desenho assume

- A instância está no ar, com o workspace `semec`. O projeto real é o **SISConforme** (`SISC`). O projeto `SEMEC` ainda é o projeto demo.
- Os milestones do Linear já foram migrados como **módulos** do SISConforme em 26/10. Os 9 módulos guardam `external_source = "linear"` e o nome do milestone. Por isso, **milestone = módulo** é uma decisão tomada, não uma suposição.
- No Linear, as propriedades usadas nos 11 projetos são: status (todos), prioridade (4 como High), data de início (9) e data alvo (2). Também lead e membros, que o Plane já tem.
- Por enquanto, só o SISConforme foi migrado para o Plane. Os outros 10 projetos continuam no Linear.
- A migração **não preservou as datas**. Os 157 itens do SISConforme têm `created_at` de 26/10/2026, e os concluídos têm `completed_at` também de 26/10 (conferido pelo MCP em 28/10). Não existe atividade de estado anterior a essa data. A API pública não aceita gravar `completed_at` (`apps/api/plane/api/serializers/issue.py:72`).

## O que foi decidido com o Pedro

### Painel lateral: onde fica

- Fica na lista de itens do projeto (`/[workspace]/projects/[projectId]/issues`), do lado direito, como no Linear e como o painel do módulo do Plane.
- Abre e fecha por um botão no topo da lista. O estado aberto/fechado fica salvo no navegador.

### Seção Propriedades

- **Status**: Backlog, Planejado, Em andamento, Pausado, Concluído, Cancelado. É a mesma lista do Linear e a mesma que o Plane usa nos módulos.
- **Prioridade**: Urgente, Alta, Média, Baixa, Sem prioridade. É a mesma escala dos itens.
- **Lead** e **Membros**: são os dados que o projeto do Plane já guarda. Mudar no painel muda o projeto de verdade, pelas mesmas regras de permissão do Plane.
- **Datas**: início → alvo, cada uma editável à parte.
- Cada linha se edita com um clique ali mesmo, sem abrir as configurações do projeto.

### Seção Milestones

- Lista os módulos do projeto, ordenados pela data alvo.
- Cada linha mostra o losango de progresso, o nome, "X% de N" e a data alvo.
- Clicar na linha filtra a lista de itens por aquele módulo. Clicar de novo tira o filtro.
- O "+" cria um módulo (o modal de criação de módulo do Plane). O "⋯" de cada linha abre as ações que o módulo já tem.
- No fim, a linha **Sem milestone** mostra quantos itens estão sem módulo. Ela não filtra (ver Progresso).
- Status, lead e membros do módulo não aparecem nessa lista.
- Um item pode estar em mais de um módulo, porque o Plane permite. Nesse caso ele conta no % de cada um.

### Seção Progresso

- Três números no topo: **Escopo** (total), **Iniciados** e **Concluídos**. Cada um filtra a lista ao clicar.
- Um gráfico de evolução desde a data de início do projeto. Mostra o escopo, os iniciados e os concluídos, dia a dia, e uma linha tracejada projeta até a data alvo. O gráfico usa as datas que estão no Plane, como estão. No SISConforme, tudo o que veio do Linear aparece em 26/10, e isso é aceito (decisão do Pedro).
- Abas **Responsáveis** e **Labels**, com "X% de N" por pessoa ou label, incluindo "Sem responsável" e "Sem label". Clicar numa pessoa ou label filtra a lista.
- **As linhas "Sem responsável", "Sem label" e "Sem milestone" mostram só a contagem e não filtram** (decisão do Pedro). O filtro de itens do Plane 1.4.2 não tem operador para "vazio": só `exact`, `in` e `range` (`packages/types/src/rich-filters/operators/core.ts`), sem negação (`packages/utils/src/rich-filters/operators/shared.ts:22-30`), e o `IssueFilterSet` não aceita nulo (`apps/api/plane/utils/filters/filterset.py`). Não se estende o filtro do Plane para isso.
- Com um milestone selecionado, a seção inteira mostra só os números dele.

### Seção Atividade

- Mostra as mudanças **no projeto**: milestone adicionado, renomeado, removido ou com data alvo alterada; status, prioridade e datas do projeto alterados; lead alterado. Entrada e saída de membros ficam de fora (ver "Decisões minhas").
- Formato: "Pedro Antônio adicionou o milestone X · 27 out".
- Mostra as 5 últimas, com um **Ver tudo** que abre o histórico completo.
- Só registra a partir da entrada em produção.

### Aba Projetos

- Mantém os cartões do Plane e acrescenta status, prioridade, lead, datas e uma barra de progresso (% de itens concluídos).
- Novos filtros por status e prioridade, e novas ordenações por data alvo, data de início, prioridade e status.

## Restrições técnicas

- **Dados novos em um app Django nosso**, `plane.semec` (pasta `apps/api/plane/semec`), com modelos e migrations próprios. A numeração de migrations desse app não colide com a do app `db` do Plane. A única linha mexida em arquivo do Plane é o registro do app em `INSTALLED_APPS`.
- As propriedades ficam numa tabela ligada ao projeto (um para um), criada sob demanda: projeto sem registro mostra Backlog e Sem prioridade.
- A atividade fica numa tabela nossa (projeto, autor, o que mudou, valor anterior e novo, quando). Para registrar mudanças feitas pelas telas do próprio Plane (criar ou editar módulo, trocar lead, adicionar membro), o caminho preferido é **signals do Django** no app `semec`, e não editar as views do Plane. Assim a mudança na API do Plane fica mínima.
- As rotas novas ficam na API interna (sessão do navegador), com o prefixo `/api/workspaces/<slug>/projects/<project_id>/semec/...` e uma rota no nível do workspace para os cartões. Usam as mesmas classes de permissão dos endpoints de projeto do Plane.
- No frontend, os componentes novos ficam juntos em `apps/web/core/components/semec/` e o store MobX em `apps/web/core/store/semec/`. Arquivos do Plane recebem só os pontos de encaixe: o botão e o painel na lista de itens, os campos no cartão e os filtros e ordenações da aba Projetos.
- O filtro por clique usa o sistema de filtros de itens que já existe (o mesmo que o painel do módulo usa em `analytics-sidebar`). Nada de filtro paralelo.
- Textos novos em `en` e `pt-BR`, seguindo a skill `translate`.
- Commits pequenos, com prefixo `semec:` e sem atribuição a IA. Validar na stack local (Docker) antes de gerar imagem no Gitea. As imagens a gerar são `plane-backend` (api, worker, beat-worker e migrator) e `plane-frontend`.

## Pontos de partida no código

- Painel do módulo, para reaproveitar o visual e o cálculo: `apps/web/core/components/modules/analytics-sidebar/` (`issue-progress.tsx`, `progress-stats.tsx`) e `apps/api/plane/app/views/module/base.py` (distribuição por responsável e label, `burndown_plot`).
- Gráfico: `apps/api/plane/utils/analytics_plot.py`. O `burndown_plot` faz o burndown de um ciclo ou módulo, não a evolução do escopo, dos iniciados e dos concluídos. A série nova precisa ser calculada.
- Barra da lista de itens, onde está o botão Analytics: `apps/web/core/components/issues/filters.tsx`.
- Página do módulo com painel lateral, que é o modelo de layout: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/modules/(detail)/[moduleId]/page.tsx`.
- Cartão e filtros da aba Projetos: `apps/web/core/components/project/card.tsx`, `filters.tsx`, `packages/types/src/project/project_filters.ts` e `packages/utils/src/project.ts`.

## Decisões minhas (o Pedro pode revisar)

- **Quem edita status, prioridade e datas:** qualquer membro do projeto. Convidado (guest) só vê. Lead e membros seguem a regra do Plane, que exige admin do projeto.
- **"Iniciados" no gráfico:** item cujo estado está no grupo `started`. Para a série histórica, a data em que o item entrou nesse grupo vem da atividade do item (`IssueActivity`, campo `state`). Item sem essa atividade (como os migrados) conta a partir do `created_at`.
- **Botão Analytics:** continua existindo, ao lado do botão do painel.
- **Valores padrão:** projeto sem propriedades mostra Backlog, Sem prioridade e sem datas.
- **Membros fora da Atividade:** o Plane adiciona membros com `bulk_create`/`bulk_update` (`apps/api/plane/app/views/project/member.py:95, 134`, `invite.py:162`, `authentication/utils/workspace_project_join.py:76`), que não disparam signals. Registrar isso exigiria editar views do Plane em quatro lugares. Para não registrar só a metade (saídas sim, entradas não), membros ficam fora do log. Mudança de lead e de módulos passa por `save()` e é registrada normalmente. O autor da mudança vem do `crum`, que o Plane já usa.
- **Valores iniciais:** não haverá carga automática. As propriedades do SISConforme (Em andamento, sem prioridade, 5/10 → 9/11) são preenchidas à mão no painel. Os outros projetos recebem as propriedades quando forem migrados.
- **Instância:** está no ar e com dados. As migrations novas do app `semec` só criam tabelas, sem alterar dados existentes.

## Fica a critério de quem implementar

- O formato exato das rotas, dos serializers e do store.
- A biblioteca e o tipo do gráfico, desde que sigam o que o Plane já usa (`@plane/propel` charts).
- Como calcular a série diária sem pesar no banco. O cálculo pode ser feito na hora; projeto do tamanho do SISConforme tem centenas de itens.
- A ordem dos commits. A sugestão é Progresso → Propriedades → Milestones → Atividade → aba Projetos.
