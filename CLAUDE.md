# CLAUDE.md — fork SEMEC do Plane

Leia também o [AGENTS.md](AGENTS.md) (convenções do upstream: comandos, estilo de código, testes) e as skills em `.claude/skills/`. Não altere esses arquivos: eles vêm do upstream.

## Contexto

- Somos a equipe de TI da SEMEC (Secretaria Municipal de Economia de Porto Velho/RO), cerca de 7 pessoas.
- Estamos substituindo o Linear pelo Plane Community Edition, fork de [makeplane/plane](https://github.com/makeplane/plane).
- Hospedagem: servidor da SMTI (TI da prefeitura), via Portainer, com as imagens oficiais do Docker Hub na versão `v1.4.2`. A stack deriva de `deployments/cli/community/docker-compose.yml`.
- O fork existe para customizações futuras. Enquanto não houver customização, a stack usa só imagens oficiais.
- Remotes: `origin` = SEMEC-PVH/plane-custom (GitHub, segue ativo), `gitea` = https://git.portovelho.ro.gov.br/semec/Plane-semec.git, `upstream` = makeplane/plane. Branch de trabalho: `semec`.
- O build das imagens customizadas é feito a partir do nosso repositório no Gitea (remote `gitea`).

## Mapa do repositório

| App           | O que é                                                     | Dockerfile (contexto do build)        | Imagem oficial            |
| ------------- | ----------------------------------------------------------- | ------------------------------------- | ------------------------- |
| `apps/web`    | Aplicação principal (React Router + Vite)                   | `apps/web/Dockerfile.web` (`.`)       | `makeplane/plane-frontend` |
| `apps/api`    | Backend Django/DRF; também roda worker, beat-worker e migrator | `apps/api/Dockerfile.api` (`apps/api`) | `makeplane/plane-backend` |
| `apps/admin`  | Painel de administração da instância (`/god-mode`)          | `apps/admin/Dockerfile.admin` (`.`)   | `makeplane/plane-admin`   |
| `apps/space`  | Páginas e projetos publicados (`/spaces`)                   | `apps/space/Dockerfile.space` (`.`)   | `makeplane/plane-space`   |
| `apps/live`   | Servidor de colaboração em tempo real (Hocuspocus, `/live`) | `apps/live/Dockerfile.live` (`.`)     | `makeplane/plane-live`    |
| `apps/proxy`  | Proxy reverso Caddy que roteia para os serviços acima       | `apps/proxy/Dockerfile.ce` (`apps/proxy`) | `makeplane/plane-proxy` |

- `Dockerfile.dev` em cada app é só para desenvolvimento local.
- `packages/` contém as bibliotecas compartilhadas do monorepo (ui, editor, types, constants, services, etc.).
- Traduções: `packages/i18n/src/locales/<idioma>/*.json`. O `pt-BR` já existe; o `en` é a fonte. Antes de mexer em traduções, siga a skill `translate`.

## Regras de customização

- Integrações com sistemas da prefeitura, automações e relatórios devem ser feitos por fora, via API REST, webhooks ou o servidor MCP do Plane. Só altere o código do Plane quando não houver outro caminho.
- Toda mudança no código fica na branch `semec`, em commits pequenos e isolados, com prefixo `semec:`, para facilitar reaplicar a cada versão nova.
- Não coloque atribuição a IA nos commits nem nos PRs (nada de `Co-Authored-By: Claude` ou similar). O autor é só quem faz o commit.
- Para atualizar de versão: `git fetch upstream --tags`, depois rebase da branch `semec` sobre a nova tag (ex.: `git rebase --onto vX.Y.Z v1.4.2 semec`), resolvendo conflitos commit a commit.
- Compile, a partir do repositório no Gitea, apenas a imagem do serviço alterado, com tag `<versão>-semec` e publique no registry de containers do Gitea (ex.: `git.portovelho.ro.gov.br/semec/plane-frontend:v1.4.2-semec`; login com `docker login git.portovelho.ro.gov.br` usando um token com escopo `package`). Na stack, troque só a imagem desse serviço; os demais continuam nas imagens oficiais. Para o backend, a mesma imagem vale para api, worker, beat-worker e migrator.
- Nunca faça commit de segredos nem do arquivo `plane.env`.
- Os dados podem envolver informação sob sigilo fiscal. Não adicione telemetria, analytics ou chamadas a serviços externos.
- Licença AGPL-3.0: o código modificado precisa ficar disponível para os usuários da instância. Mantenha o fork acessível a eles e não remova os avisos de licença (`LICENSE.txt`, `COPYRIGHT.txt`, cabeçalhos dos arquivos).
