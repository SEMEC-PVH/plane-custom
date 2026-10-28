# Identidade visual da SEMEC no Plane: desenho

Data: 2026-10-28. Base: Plane CE `v1.4.2`, branch `semec`. Antecedente: o painel do projeto (`2026-10-28-painel-projeto-design.md`).

## Intenção

O Plane da SEMEC deve parecer um sistema da Prefeitura de Porto Velho, e não um produto de terceiros: cores e fonte do Design System SEMEC (SDS), logo da SEMEC, tela de login institucional e nada de propaganda do Plane. O Pedro validou o visual numa prévia injetada no Plane local (claro, escuro, header e login) antes deste documento.

## Objetivos

1. **Tema claro com os tokens do SDS** (`packages/react/tokens.css` do repositório SEMEC-PVH/SEMEC_design_system): neutros, azul de ação, feedback, Poppins, raios e sombras.
2. **Tema escuro preto**: fundo preto neutro, com a identidade nos acentos (azul de ação nos botões, azul claro em textos e links de acento), Poppins e logo.
3. **Logo da SEMEC** (símbolo + "SEMEC Secretaria Municipal de Economia" + "Cidade de Porto Velho") no lugar da marca do Plane: header do app, tela de login, telas de onboarding/convite/criação de workspace, animação de carregamento, favicon, ícones do app e título da aba.
4. **Tela de login institucional** (aprovada na prévia; ver "Login").
5. **Sem chamarizes do Plane**: "Star us on GitHub", selo "Community" e o modal de planos pagos, selos "Pro", página de upsell de Active Cycles, banner "Upgrade to One", "Contact sales" e a seção de faturamento.
6. **Português (pt-BR) como idioma padrão**.

## Fora do escopo

- Temas de alto contraste (`light-contrast`, `dark-contrast`) e o tema personalizado do usuário (`custom`): ficam como estão.
- E-mails de notificação com a marca da SEMEC.
- Ilustrações de estados vazios do Plane.
- Escala de tipografia e espaçamento do SDS (exigiriam reescrever componentes).
- Cadastro aberto: fechar com a opção "Allow anyone to sign up" em `/god-mode` da instância (configuração, sem código).
- Logo e cores do workspace (o Pedro sobe o símbolo pelas configurações) e cores dos estados/etiquetas (configuração dos projetos).

## O que não pode acontecer

- Remover ou esconder os avisos de licença AGPL. O login ganha um link "código-fonte" para o fork (ver "Login"); `LICENSE.txt`, `COPYRIGHT.txt` e os cabeçalhos SPDX ficam.
- Qualquer chamada externa: Poppins e ilustração auto-hospedadas no bundle; nada de Google Fonts ou CDN.
- Mexer nas migrations do app `db` do Plane.
- Quebrar os temas de alto contraste e o tema personalizado.

## Ativos

- **Logo**: `C:\Users\01900715244\Downloads\image.svg` (enviado pelo Pedro). O arquivo veio do editor Recraft e traz metadados C2PA; usar a versão limpa (sem `<metadata>` e sem o retângulo de fundo `#FAFAFA`). Três formas derivadas:
  - **lockup**: logo completo, `viewBox="14 16 376 72"`;
  - **símbolo**: só a "casa" verde/amarela/azul (os três paths entre x 222 e 300), `viewBox="220 16 82 68"`;
  - no lockup, o símbolo mantém sempre as cores originais (`#6BC056`, `#FDDF10`, `#1E459B`); os demais paths azuis/pretos (`#1E459B`, `#325BAE`, `#060806`) ficam no **azul oficial `#1e459b` nos dois temas** (decisão do Pedro);
  - os miolos das letras (`#FAFAFA`, `#F3EEF5`) viram **buracos de verdade** (máscara SVG: retângulo branco com os miolos em preto, aplicada ao grupo das letras), para o logo funcionar sobre qualquer fundo, e não só sobre o fundo da página;
  - quando quem usa o componente pede texto sobre cor (classe `text-on-color`, como no banner do tour de boas-vindas, que tem fundo azul), as letras usam a cor do texto (`currentColor`, branco) e o símbolo mantém as cores;
  - o lockup nunca é desenhado com menos de 28px de altura (abaixo disso "Secretaria Municipal de Economia" e "Cidade de Porto Velho" ficam ilegíveis), mesmo que quem chama passe `height={20}`; a largura acompanha a proporção da SEMEC (376×72), não a do Plane.
- **Ilustração de Porto Velho**: `apps/docs/public/PortoVelhoPintura.svg` do repositório do SDS (Três Caixas d'Água, Madeira-Mamoré, catedral, Rio Madeira). Traços `#5E92B8`/`#6D9CBD` → cor de linha do tema; `white` → fundo da página; `#E5EBF2` → tom de fundo do tema; recorte `viewBox="0 180 1536 740"`.
- **Poppins** 400/500/600/700 (subconjunto latino, OFL 1.1): `apps/docs/public/fonts/Poppins-*.woff2` do repositório do SDS, com o `OFL.txt`.
- Os ativos ficam no repositório (não baixados em build).

## Tokens

### Claro (`:root` que não seja `*-contrast` nem `dark`)

| Variável do Plane                                                                                                                                                   | Valor                                                                                                                                                                 | Origem SDS                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `--neutral-white` / `100` / `200` / `300` / `400` / `500` / `600` / `700` / `800` / `900` / `1000` / `1100` / `1200` / `black`                                      | `#ffffff` / `#f9fafc` / `#f4f6f9` / `#eef1f5` / `#e5e7eb` / `#dde1e7` / `#d1d5db` / `#b8bfca` / `#8a94a6` / `#6b778d` / `#4b5563` / `#374151` / `#14233a` / `#0e1a2c` | `--bg`, `--border`, `--text-*`, `--fg`        |
| `--brand-100` … `--brand-1200`, `--brand-default`                                                                                                                   | `#eef4fa`, `#e0ebf6`, `#c9dbee`, `#a8c3e2`, `#7fa5d2`, `#5a88bf`, `#3a6ca6` (700), default `#3a6ca6`, 900 `#2f5a8a`, 1000 `#26476f`, 1100 `#26325b`, 1200 `#223f99`   | `--action-primary*`, `--tint`, `--brand-hero` |
| `--txt-success-primary`, `--bg-success-subtle`, `--txt-warning-primary`, `--bg-warning-subtle`, `--txt-danger-primary`, `--bg-danger-primary`, `--bg-danger-subtle` | `#3a6420`, `#eef7e6`, `#8a5a00`, `#fdf6e3`, `#b91c1c`, `#b91c1c`, `#fef2f2`                                                                                           | `--feedback-*`                                |

### Escuro (`[data-theme="dark"]`)

| Variável                                                                                                                       | Valor                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--neutral-black` / `100` / `200` / `300` / `400` / `500` / `600` / `700` / `800` / `900` / `1000` / `1100` / `1200` / `white` | `#000000` / `#0a0a0b` / `#111112` / `#18181a` / `#1f2022` / `#2a2b2e` / `#35373a` / `#44464a` / `#6c6f75` / `#8e9197` / `#b0b3b8` / `#d0d2d6` / `#ececee` / `#f7f7f8` |
| `--brand-100` / `200` / `300` / `400` / `500` / `700` / `800` / `900` / `1000` / `1100` / `1200`, `--brand-default`            | `#0f1a2b` / `#16243a` / `#26446c` / `#2f5486` / `#3a6ca6` / `#7aa2d8` / `#a8c3e2` / `#c9dbee` / `#e0ebf6` / `#eef4fa` / `#f6f9fd`, default `#6b97cf`                  |
| `--bg-accent-primary` / `-hover` / `-active`                                                                                   | `#3a6ca6` / `#4f7fbf` / `#2f5a8a`                                                                                                                                     |
| `--txt-accent-primary`, `--txt-link-primary`                                                                                   | `#8fb2e3`                                                                                                                                                             |

Contrastes medidos (WCAG): claro — texto 14,6:1, botão 5,4:1, acento sobre branco 5,4:1; escuro — texto 16:1, placeholder 6:1, acento 8,7:1, texto nos botões 4,6:1.

### Todos os temas (exceto alto contraste)

`--font-body` e `--font-heading` = `"Poppins", system-ui, -apple-system, sans-serif`; `--radius-sm` 2px, `--radius-md` 8px, `--radius-lg` 12px. Variável nova `--semec-logo-text: #1e459b`.

Complementos da revisão: no claro, `--brand-800` = `#34639a` (entre 700 e 900); no escuro, `--brand-600` = `#5a88bf`. O seletor do claro também exclui `data-theme="custom"` (o tema personalizado nunca é marcado como escuro e não deve receber os tokens do claro).

**Sombras ficam as do Plane**: no Tailwind 4.1.17 as sombras de `@theme` são copiadas para os utilitários em tempo de build (`.shadow-raised-100 { --tw-shadow: 0px 1px 6px … }`), então sobrescrever as variáveis em tempo de execução não tem efeito. A prévia aprovada já mostrava as sombras do Plane. Mudar exigiria `@theme` em build, atingindo os temas de alto contraste (fora do escopo).

**Editor de texto** (descrições, páginas, comentários) continua com a fonte do Plane (`--font-style` em `packages/editor`), como na prévia aprovada.

## Login

Aprovado na prévia. Vale para `/` e `/sign-up` (via `AuthBase`) e também para `accounts/forgot-password`, `reset-password` e `set-password`, que hoje montam o próprio contêiner só com `AuthHeader`: as cinco telas usam o mesmo layout da SEMEC (lockup, horizonte e rodapé), por um componente compartilhado.

- Sem barra de topo: some o `PlaneLockup` + "New to Plane? Sign up" do topo.
- Coluna central: **lockup com 64px de altura**, centralizado; título **"Projetos da SEMEC"** (28px, 600); linha de apoio **"Planejamento e acompanhamento das entregas da Secretaria Municipal de Economia."** (15px, cor secundária); depois o formulário do Plane, sem mudanças de comportamento.
- Exemplo do campo de e-mail: `nome@portovelho.ro.gov.br`.
- **Horizonte de Porto Velho** ancorado embaixo, centralizado, altura `min(36vh, 360px)`, largura proporcional (`≈ altura × 2,0757`, máximo 100vw), 44px acima do fim da tela; esmaecido em cima, embaixo e nas laterais (máscara); não captura cliques. Cores: claro linha `#a9c1de`/tom `#eef3f9`; escuro linha `#2c4670`/tom `#0d1420`; preenchimentos brancos = `--bg-surface-1`. O formulário fica acima do horizonte (padding inferior da área de conteúdo = altura do horizonte − 24px).
- **Rodapé** centralizado, 12px, cor terciária: "Prefeitura de Porto Velho. Software livre sob AGPL-3.0: código-fonte." com o link para `https://github.com/SEMEC-PVH/plane-custom`.
- Removidos: "Join 10,000+ teams…" com os logos de clientes e o texto de termos com links do plane.so.
- Textos no namespace i18n `semec` (en e pt-BR, e os demais pela skill `translate`).

## Marca no resto do app

- **Header**: lockup de 32px à esquerda da barra superior (`top-navigation-root.tsx`), antes do seletor de workspace, separado por uma borda à direita.
- **Componentes de marca do Plane** (`packages/propel/src/icons/brand/`): `PlaneLockup` passa a desenhar o lockup da SEMEC e `PlaneLogo` o símbolo. Assim onboarding, tour, convites, criação de workspace, telas de erro do workspace, rodapé de novidades, admin e space mudam juntos, sem tocar em cada tela. As props de tamanho continuam valendo.
- **Carregamento** (`logo-spinner.tsx`): o símbolo da SEMEC com uma animação discreta (pulsação suave), respeitando `prefers-reduced-motion`, no lugar dos GIFs do Plane.
- **Favicon, ícones e PWA**: símbolo da SEMEC em `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-180x180.png`, `icon-512x512.png` e nos ícones dos manifests; manifests com `name`/`short_name` "SEMEC" e `theme_color` `#223f99`. Mesmos nomes de arquivo, então os pontos que os referenciam não mudam.
- **Título**: `SITE_NAME`/`SITE_TITLE` e `APP_TITLE` = "SEMEC — Projetos"; `application-name` "SEMEC"; títulos de páginas de autenticação sem " - Plane". Os títulos por página ("SISConforme - Work items") ficam como estão.

## Chamarizes removidos

- `StarUsOnGitHubLink` deixa de ser renderizado no header.
- `EditionBadge` ("Community" + modal de planos pagos) deixa de ser renderizado na barra lateral.
- `UpgradeBadge` ("Pro") renderiza nada.
- Item "Active cycles" da navegação e o banner "Upgrade to One" das operações em lote somem.
- No menu de ajuda, "Contact sales" some (docs, novidades e fórum ficam).
- A entrada "Billing and plans" das configurações do workspace some.

## Idioma

- **Idioma inicial** `pt-BR` para quem ainda não escolheu (tela de login, primeiro acesso e depois de sair): o i18n hoje usa `FALLBACK_LANGUAGE` ("en") como idioma inicial (`packages/i18n/src/core/instance.ts`) e ao sair (`apps/web/core/store/root.store.ts`). Cria-se um idioma padrão separado (pt-BR) para esses dois usos.
- **Reserva de tradução continua `en`**: `fallbackLng` segue em inglês, para que uma chave que falte no pt-BR apareça em inglês, nunca crua.
- Perfis novos nascem com `language = "pt-BR"`: por signal `post_save` em `Profile` (no app `plane.semec`), sem mexer no default do modelo do Plane.
- **Perfis existentes em `"en"` passam para `"pt-BR"`** uma única vez, por migration de dados do app `semec` (decisão do Pedro: na instância não dá para separar quem escolheu inglês de quem ficou no padrão; quem quiser inglês troca no perfil). A migration é reversível no sentido de não apagar nada e só toca `language = "en"`.
- `<html lang>` acompanha o idioma do usuário.

## Restrições técnicas

- Tema num arquivo nosso, `packages/tailwind-config/semec.css`, importado por uma linha no fim de `packages/tailwind-config/index.css` (vale para web, admin e space). As regras ficam fora de `@layer` para vencer as do Plane, com os seletores acima (claro sem `dark`/`contrast`; escuro só `[data-theme="dark"]`).
- Poppins via `@font-face` no mesmo arquivo, com os woff2 em `packages/tailwind-config/fonts/` e o `OFL.txt`.
- Componentes nossos em `apps/web/core/components/semec/brand/` (header logo, layout do login, horizonte); os SVGs da SEMEC em `packages/propel/src/icons/brand/semec/` para servirem a `PlaneLockup`/`PlaneLogo`.
- Pontos de encaixe no Plane marcados com `SEMEC`, mínimos.
- Commits `semec:`; validar na stack local e na imagem montada a partir de `git archive` (no Windows, a cópia de trabalho não leva as traduções).

## Decisões minhas (o Pedro pode revisar)

- **Só a imagem `plane-frontend` (web) é gerada nesta entrega.** Os pacotes compartilhados entram no bundle de cada app, então admin (`/god-mode`) e space só mudariam com imagens próprias no Gitea e na stack. Admin é usado por quem administra a instância e o space não está em uso; ficam com o visual do Plane por ora. O `semec.css` já fica no pacote compartilhado, o que deixa o caminho pronto para gerar essas imagens depois (com os spinners, favicons, manifests e `APP_TITLE` próprios de cada app).
- `--font-code` (IBM Plex Mono) continua.
- Os temas personalizados que algum usuário tenha criado continuam valendo por cima.

## Fica a critério de quem implementar

- Como gerar os PNG/ICO a partir do SVG do símbolo (sem serviço externo).
- A animação exata do carregamento.
- Como esconder cada chamariz (não renderizar no ponto de uso ou o componente retornar `null`), desde que o diff no Plane fique mínimo.
