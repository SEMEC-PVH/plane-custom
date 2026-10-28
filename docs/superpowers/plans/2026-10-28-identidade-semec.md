# Identidade visual da SEMEC no Plane: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tema SDS (claro) e preto (escuro), marca da SEMEC no lugar da do Plane, login institucional, sem chamarizes do Plane, pt-BR como padrão.

**Architecture:** Tokens num CSS nosso (`packages/tailwind-config/semec.css`) importado no fim do tema do Plane; a marca entra pelos componentes `PlaneLockup`/`PlaneLogo` (que passam a desenhar a SEMEC) e por componentes nossos em `apps/web/core/components/semec/brand/`; o idioma usa um signal e uma migration de dados no app `plane.semec`.

**Tech Stack:** Tailwind v4 (CSS-first), React Router + Vite, `@plane/propel`, `@plane/i18n`, Django (app `plane.semec`), pytest.

**Spec:** `docs/superpowers/specs/2026-10-28-identidade-semec-design.md`

## Global Constraints

- Commits pequenos com prefixo `semec:` e sem atribuição a IA. Se o pre-commit falhar só por avisos antigos do Plane em arquivo tocado, rode `pnpm exec oxfmt` e `pnpm exec oxlint --deny-warnings` nos arquivos alterados e faça `--no-verify` (autorizado pelo Pedro; ver CLAUDE.md).
- Arquivo novo leva o cabeçalho SPDX do Plane. Pontos de encaixe em arquivos do Plane marcados com o comentário `SEMEC`.
- Nada externo: Poppins, ilustração e logos dentro do repositório; sem CDN nem Google Fonts.
- Não mexer nas migrations do app `db` do Plane.
- Temas `light-contrast`, `dark-contrast` e `custom` não recebem tokens SEMEC.
- Só a imagem `plane-frontend` (web) é entregue; admin e space ficam fora.
- Textos novos no namespace i18n `semec` (en e pt-BR; os demais idiomas pela skill `translate`).
- Comandos de front no Windows: `export PATH="/c/Users/01900715244/AppData/Roaming/npm:$PATH"` e `pnpm_config_verify_deps_before_run=false pnpm turbo run <task> --env-mode=loose`; depois de builds, `git checkout -- 'packages/*/package.json'`.
- Validação visual sempre numa imagem montada de `git archive --format=tar HEAD | docker build -f apps/web/Dockerfile.web ... -` (a cópia de trabalho do Windows não leva as traduções).

## Review Focus

1. Trocar para **alto contraste** ou **tema personalizado** deve mostrar exatamente o visual do Plane (nenhuma cor/fonte SEMEC vazando). Checagem na Task 8.
2. **Logo sobre fundo colorido** (banner do tour de boas-vindas, fundo `bg-accent-primary`): letras brancas legíveis, miolos vazados (sem manchas). Checagem na Task 8 e teste visual da Task 1.
3. **Login em tela estreita** (390px) e baixa (700px de altura): o horizonte não cobre o formulário nem o botão. Checagem na Task 4.
4. **Idioma**: perfil que já está em outro idioma (ex.: `de`) não é alterado; chave sem tradução em pt-BR aparece em inglês, nunca crua. Testes na Task 6.
5. **`prefers-reduced-motion`**: o carregamento não anima. Checagem na Task 3.

---

### Task 1: Marca da SEMEC nos componentes do Plane

**Files:**

- Create: `packages/propel/src/icons/brand/semec/semec-lockup.tsx`, `packages/propel/src/icons/brand/semec/semec-emblem.tsx`, `packages/propel/src/icons/brand/semec/index.ts`, `packages/propel/src/icons/brand/semec/source/semec-logo.svg` (SVG limpo, referência)
- Modify: `packages/propel/src/icons/brand/plane-lockup.tsx`, `packages/propel/src/icons/brand/plane-logo.tsx`, `packages/propel/src/icons/brand/index.ts` (exportar `./semec`)

**Interfaces:**

- Produces:
  - `SemecLockup({ height?: number | string; className?: string; onColor?: boolean }): JSX.Element` — `viewBox="14 16 376 72"`, largura pela proporção 376:72, `role="img"`, `aria-label="SEMEC, Secretaria Municipal de Economia, Prefeitura de Porto Velho"`.
  - `SemecEmblem({ height?: number | string; className?: string; title?: string }): JSX.Element` — `viewBox="220 16 82 68"`, só os 3 paths do símbolo, cores originais.
  - `PlaneLockup(props: ISvgIcons)` passa a retornar `<SemecLockup height={Math.max(Number(height) || 28, 28)} className={className} onColor={className?.includes("text-on-color")} />` (ignora `width`/`color`).
  - `PlaneLogo(props: ISvgIcons)` passa a retornar `<SemecEmblem height={height} className={className} />`.

Construção dos SVGs (a partir de `C:\Users\01900715244\Downloads\image.svg`):

- remover `<metadata>` e o primeiro path (fundo `#FAFAFA` de 412×108); tirar os `transform="scale(...)"` (os paths já estão no espaço 412×108);
- símbolo = paths com todos os x entre 222 e 300 (`#6BC056`, `#FDDF10`, `#1E459B`), sempre nas cores originais;
- letras = paths `#1E459B`, `#325BAE`, `#060806` fora do símbolo, num `<g>` com `fill="var(--semec-logo-text, #1e459b)"` (ou `currentColor` se `onColor`);
- miolos = paths `#FAFAFA`/`#F3EEF5` fora do símbolo, dentro de uma `<mask>` (retângulo branco + miolos em preto) aplicada ao `<g>` das letras; ids da máscara únicos por instância (`useId`).

- [ ] **Step 1:** Gerar os dois componentes com um script (Python, `-I`) que aplica as regras acima e escreve os TSX; guardar o SVG limpo em `source/`.
- [ ] **Step 2:** `pnpm turbo run check:types --filter=@plane/propel --filter=web` (flags dos Global Constraints) → sem erros; `pnpm exec oxlint --deny-warnings packages/propel/src/icons/brand` → 0 avisos.
- [ ] **Step 3: Teste visual** numa página HTML local com o SVG gerado (lockup sobre `#ffffff`, `#000000` e `#3a6ca6`; esta última com a variante `onColor`): miolos vazados em todos os fundos, símbolo nas três cores, letras brancas sobre `#3a6ca6`. Screenshot no scratchpad.
- [ ] **Step 4:** Commit `semec: troca a marca do Plane pela da SEMEC nos componentes PlaneLockup e PlaneLogo`.

---

### Task 2: Tema SDS (claro e escuro preto) e Poppins

**Files:**

- Create: `packages/tailwind-config/semec.css`, `packages/tailwind-config/fonts/Poppins-{400,500,600,700}.woff2`, `packages/tailwind-config/fonts/OFL.txt` (do repositório SEMEC-PVH/SEMEC_design_system: `apps/docs/public/fonts/` e o OFL de `packages/react/fonts/`)
- Modify: `packages/tailwind-config/index.css` (uma linha `@import "./semec.css";` depois de `./animations.css`)

**Interfaces:**

- Produces: variáveis `--semec-logo-text` (`#1e459b` nos dois temas), `--semec-art-line`/`--semec-art-tint` (claro `#a9c1de`/`#eef3f9`; escuro `#2c4670`/`#0d1420`), classe `.semec-pulse` (keyframes de opacidade 1 → 0.55 → 1, 1.6s; desligada em `prefers-reduced-motion`).

Regras (fora de `@layer`):

- claro: `:root:not([data-theme*="contrast"]):not([data-theme*="dark"]):not([data-theme="custom"])` com os neutros, a escala `brand` (incluindo `--brand-800: #34639a`) e o feedback da tabela "Claro" do spec;
- escuro: `[data-theme="dark"]` com a tabela "Escuro" do spec (incluindo `--brand-600: #5a88bf`);
- fonte e raios: `:root:not([data-theme*="contrast"]):not([data-theme="custom"])` com `--font-body`, `--font-heading`, `--radius-sm/md/lg` do spec; sombras **não** entram;
- `@font-face` Poppins 400–700 com `url("./fonts/Poppins-NNN.woff2")`, `font-display: swap`.

- [ ] **Step 1:** Escrever `semec.css` e copiar fontes/OFL.
- [ ] **Step 2:** `pnpm turbo run build --filter=web` → build ok; conferir em `apps/web/build/client/assets` que existem os woff2 da Poppins (o Vite resolveu as URLs relativas). Se não resolver, mover o `@font-face` para `apps/web/styles/semec-fonts.css` importado em `apps/web/styles/globals.css` e registrar a decisão.
- [ ] **Step 3:** Commit `semec: aplica os tokens do Design System SEMEC ao tema (claro SDS, escuro preto, Poppins)`.

---

### Task 3: Logo no header e carregamento

**Files:**

- Create: `apps/web/core/components/semec/brand/header-logo.tsx`
- Modify: `apps/web/core/components/navigation/top-navigation-root.tsx` (antes de `<WorkspaceMenuRoot variant="top-navigation" />`), `apps/web/core/components/common/logo-spinner.tsx`

**Interfaces:**

- Consumes: `SemecLockup`, `SemecEmblem` (Task 1), `.semec-pulse` (Task 2).
- Produces: `SemecHeaderLogo(): JSX.Element` — `<SemecLockup height={32} />` com `pr-3 mr-2 border-r border-subtle`, link para `/`.
- `LogoSpinner()` mantém nome e exportação; renderiza `<SemecEmblem className="semec-pulse h-6 w-auto sm:h-11" title="Carregando" />` (os GIFs deixam de ser importados).

- [ ] **Step 1:** Implementar e encaixar.
- [ ] **Step 2:** Tipos + lint (flags dos Global Constraints) → sem erros, sem avisos novos nos arquivos do Plane tocados.
- [ ] **Step 3:** Commit `semec: logo da SEMEC no header e no carregamento`.

---

### Task 4: Login institucional

**Files:**

- Create: `apps/web/core/components/semec/brand/auth-shell.tsx`, `apps/web/core/components/semec/brand/porto-velho-art.tsx`
- Modify: `apps/web/core/components/auth-screens/auth-base.tsx`, `apps/web/core/components/auth-screens/header.tsx` (`AuthHeaderBase`), `apps/web/core/components/account/auth-forms/auth-header.tsx` (`Titles`, `AuthHeaderBase`), `apps/web/core/components/account/terms-and-conditions.tsx`, o campo de e-mail do login (placeholder `name@company.com`, em `apps/web/core/components/account/auth-forms/`), `apps/web/app/(all)/accounts/{forgot-password,reset-password,set-password}/page.tsx`
- Modify: `packages/i18n/src/locales/en/semec.json`, `packages/i18n/src/locales/pt-BR/semec.json` (chaves `semec.auth.*`)

**Interfaces:**

- Produces:
  - `SemecAuthShell({ children: React.ReactNode; showLockup?: boolean }): JSX.Element` — contêiner com as classes atuais do `AuthBase` + classe `semec-auth`, horizonte (`SemecPortoVelhoArt`) e rodapé; `showLockup` desenha o lockup centralizado (64px) acima dos filhos (usado nas telas `accounts/*`).
  - `SemecPortoVelhoArt(): JSX.Element` — SVG inline da ilustração com `fill` dos traços `var(--semec-art-line)`, brancos `var(--bg-surface-1)`, `#E5EBF2` `var(--semec-art-tint)`, `viewBox="0 180 1536 740"`, `preserveAspectRatio="xMidYMax meet"`, `aria-hidden`.
  - Chaves i18n: `semec.auth.title` = "Projetos da SEMEC"; `semec.auth.subtitle` = "Planejamento e acompanhamento das entregas da Secretaria Municipal de Economia."; `semec.auth.email_placeholder` = "nome@portovelho.ro.gov.br"; `semec.auth.footer` = "Prefeitura de Porto Velho. Software livre sob AGPL-3.0:"; `semec.auth.source_code` = "código-fonte" (en: "SEMEC projects", "Planning and tracking of the deliveries of the Municipal Department of Economy.", mesmo e-mail, "Porto Velho City Hall. Free software under AGPL-3.0:", "source code").

Medidas do spec (CSS em `semec.css` ou no componente): horizonte centralizado, altura `min(36vh, 360px)`, largura `min(100vw, altura × 2.0757)`, `bottom: 44px`, máscara vertical `linear-gradient(to top, transparent, #000 8%, #000 60%, transparent)` combinada (intersect) com a horizontal `linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)`, `pointer-events: none`; conteúdo do formulário com `padding-bottom: calc(altura − 24px)`; rodapé 12px centralizado, `bottom: 14px`, link `https://github.com/SEMEC-PVH/plane-custom`.

Encaixes:

- `AuthBase`: `<SemecAuthShell><AuthHeader type={authType} /><AuthRoot authMode={authType} /></SemecAuthShell>` (sem `AuthFooter`).
- `AuthHeaderBase` (auth-screens): só `<PageHead title={pageTitle + " - SEMEC"} />` (some o topo com `PlaneLockup` e "New to Plane? Sign up").
- `AuthHeaderBase` (auth-forms): lockup 64px centralizado + título (28px/600, `text-primary`) + subtítulo (15px/400, `text-secondary`), centralizados; `Titles` usam `semec.auth.title`/`semec.auth.subtitle` para todos os passos e modos (o convite mantém o texto do Plane).
- `TermsAndConditions`: retorna `null`.
- Páginas `accounts/*`: trocar o `<div className="relative z-10 ...">` por `<SemecAuthShell showLockup>`.

- [ ] **Step 1:** Implementar componentes, chaves i18n (en e pt-BR) e encaixes.
- [ ] **Step 2:** Tipos + lint sem erros.
- [ ] **Step 3: Checagem de layout** (Review Focus 3) numa imagem `git archive` (pode ficar para a Task 8 se preferir uma imagem só): 1872×937, 390×844 e 1280×700 — o `getBoundingClientRect().top` do horizonte é maior que o `bottom` do botão "Continuar" nos três.
- [ ] **Step 4:** Commit `semec: tela de login institucional da SEMEC`.

---

### Task 5: Sem chamarizes do Plane

**Files (Modify):**

- `apps/web/core/components/navigation/top-navigation-root.tsx` — não renderizar `<StarUsOnGitHubLink />`.
- `apps/web/core/components/sidebar/sidebar-wrapper.tsx` — não renderizar `<EditionBadge />`.
- `apps/web/core/components/workspace/upgrade-badge.tsx` — `UpgradeBadge` retorna `null`.
- O item `active_cycles` da navegação do workspace (onde a lista de itens da barra lateral é definida; achar a partir de `extended-sidebar-item.tsx`) — removido da lista.
- `apps/web/core/components/issues/bulk-operations/upgrade-banner.tsx` — retorna `null`.
- `apps/web/core/components/workspace/sidebar/help-section/root.tsx` — remover o item "Contact sales".
- `packages/constants/src/workspace.ts` — remover a entrada "billing-and-plans" das configurações do workspace (linha ~40).

- [ ] **Step 1:** Fazer as remoções (cada uma com comentário `SEMEC`).
- [ ] **Step 2:** Tipos + lint sem erros; `grep -rn "StarUsOnGitHubLink\|<EditionBadge" apps/web/core` → só definições, nenhum uso.
- [ ] **Step 3:** Commit `semec: remove chamarizes comerciais do Plane`.

---

### Task 6: pt-BR como idioma padrão

**Files:**

- Modify: `apps/api/plane/semec/signals.py`; Create: `apps/api/plane/semec/migrations/0003_profiles_pt_br.py`; Test: `apps/api/plane/tests/semec/test_language.py`
- Modify: `packages/i18n/src/constants/language.ts`, `packages/i18n/src/core/instance.ts`, `packages/i18n/src/core/set-language.ts`, `apps/web/core/store/root.store.ts`

**Interfaces:**

- Produces (backend): receiver `post_save` em `db.Profile`: se `created` e `language == "en"`, grava `"pt-BR"` (via `Profile.objects.filter(pk=...).update(...)`, sem disparar o signal de novo). Migration `0003` (depende de `semec.0002` e `db.0122`): `RunPython(profiles_to_pt_br, migrations.RunPython.noop)`, onde `profiles_to_pt_br(apps, schema_editor)` faz `Profile.objects.filter(language="en").update(language="pt-BR")` com o modelo histórico.
- Produces (front): `DEFAULT_LANGUAGE: TLanguage = "pt-BR"` em `language.ts` (exportado no índice do pacote); `instance.ts` usa `localStorage || DEFAULT_LANGUAGE` como idioma inicial e mantém `fallbackLng: FALLBACK_LANGUAGE` ("en"); `root.store.ts` (sair) usa `DEFAULT_LANGUAGE`; `setLanguage` também ajusta `document.documentElement.lang`.

- [ ] **Step 1: Testes que falham** (`apps/api/plane/tests/semec/test_language.py`):
  - `test_new_profile_defaults_to_pt_br`: `User.objects.create(...)` + `Profile.objects.create(user=u)` → `refresh_from_db().language == "pt-BR"`.
  - `test_new_profile_with_other_language_is_kept`: `Profile.objects.create(user=u, language="de")` → `"de"`.
  - `test_migration_moves_only_english_profiles`: perfis em `"en"`, `"de"` e `"pt-BR"`; chamar `profiles_to_pt_br(django_apps, None)` (importado do módulo da migration via `importlib`) → `"pt-BR"`, `"de"`, `"pt-BR"`.
- [ ] **Step 2:** `docker compose -f docker-compose-test.yml -f docker-compose-test.semec.yml run --rm api-tests pytest plane/tests/semec/test_language.py -q` → FAIL.
- [ ] **Step 3:** Implementar signal e migration (cabeçalho SPDX).
- [ ] **Step 4:** Mesmo comando → PASS; suíte inteira (`pytest -q`) → tudo verde.
- [ ] **Step 5:** Mudanças do front em `@plane/i18n` e `root.store.ts`; tipos + lint sem erros.
- [ ] **Step 6:** Commit `semec: português como idioma padrão (perfis novos e existentes)`.

---

### Task 7: Favicon, ícones do app e título

**Files (Modify, mesmos nomes):**

- `apps/web/app/assets/favicon/{favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png}`, `apps/web/app/assets/icons/{icon-180x180, icon-512x512}.png`, `apps/web/public/icons/icon-{192,348,512}.png`, `apps/web/public/plane-logos/plane-mobile-pwa.png`, os PNG de `apps/web/public/favicon/`
- `apps/web/public/manifest.json`, `apps/web/public/site.webmanifest.json`, `apps/web/public/favicon/site.webmanifest` — `name`/`short_name` "SEMEC", `theme_color` `#223f99`
- `packages/constants/src/metadata.ts` — `SITE_NAME` "SEMEC", `SITE_TITLE` "SEMEC — Projetos" (as constantes de space ficam)
- `apps/web/app/root.tsx` — `APP_TITLE` "SEMEC — Projetos", `application-name` "SEMEC", `og:url`/descrição sem plane.so
- `apps/web/app/(all)/sign-up/layout.tsx`, `apps/web/app/(all)/accounts/*/layout.tsx` — sufixo " - SEMEC"

Gerar os PNG a partir do símbolo (Task 1) sem serviço externo: página HTML local com o `SemecEmblem` centralizado em fundo transparente (favicons) ou `#ffffff` (apple-touch e ícones do PWA, com margem de 12%), screenshot pelo Chrome headless (`chrome --headless --screenshot --window-size=N,N`); o `.ico` (16/32/48) com `uv run --with pillow`.

- [ ] **Step 1:** Gerar e substituir os arquivos; ajustar manifests, constantes e títulos.
- [ ] **Step 2:** Tipos + lint sem erros; `git grep -n '"Plane"' apps/web/public apps/web/app/root.tsx packages/constants/src/metadata.ts` → sem nomes de app "Plane".
- [ ] **Step 3:** Commit `semec: favicon, ícones do app e título SEMEC`.

---

### Task 8: Traduções, validação na imagem e registro

**Files:**

- Modify: `packages/i18n/src/locales/{cs,de,es,fr,id,it,ja,ko,pl,ro,ru,sk,tr-TR,ua,vi-VN,zh-CN,zh-TW}/semec.json` (chaves novas da Task 4, pela skill `translate`)
- Modify: `CLAUDE.md` (seção "Customizações feitas": uma linha sobre a identidade visual e onde ficam `semec.css`, `semec/brand` e os componentes de marca)

- [ ] **Step 1:** Traduzir as chaves novas; `pnpm --filter @plane/i18n run sync:check` → 0 missing/stale/collisions.
- [ ] **Step 2:** Imagem: `git archive --format=tar HEAD | docker build -f apps/web/Dockerfile.web -t plane-frontend:semec-local --build-arg VITE_API_BASE_URL=http://localhost:8000 --build-arg VITE_WEB_BASE_URL=http://localhost:3000 --build-arg VITE_ADMIN_BASE_URL=http://localhost:3001 -` e rodar na porta 3000 (no lugar da prévia).
- [ ] **Step 3: Roteiro** (um screenshot de cada no scratchpad):
  - login claro e escuro igual à prévia aprovada (`scratchpad/spike/login5-claro.png`, `login6-escuro.png`), em pt-BR ("E-mail", "Continuar");
  - app claro e escuro com Poppins, cores do spec (amostrar `--bg-surface-1`, `--bg-accent-primary`), logo no header;
  - nenhum "Star us on GitHub", "Community", "Pro", "Contact sales", "Billing and plans", "Active cycles";
  - favicon e título "SEMEC" na aba;
  - **Review Focus 1**: temas `light-contrast`, `dark-contrast` e `custom` com o visual do Plane (amostrar `--neutral-100` igual ao `variables.css`);
  - **Review Focus 2**: banner do tour (forçar `is_tour_completed=false` no perfil local) com letras brancas legíveis;
  - **Review Focus 5**: com `prefers-reduced-motion: reduce` emulado, `.semec-pulse` sem animação.
- [ ] **Step 4:** Remover a prévia do container (`semec-spike.js` e a linha do `index.html` somem ao trocar a imagem) e confirmar que o `index.html` servido não referencia `semec-spike.js`.
- [ ] **Step 5:** Commit `semec: traduções da identidade visual e registro no CLAUDE.md`.
