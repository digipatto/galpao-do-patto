# Achados do Patto — convenções do projeto

> `CLAUDE.md` e `AGENTS.md` têm o MESMO conteúdo: editou um, replique no outro.
>
> ⚠️ **`plano-galpao-do-patto.md` está superado.** Ele descreve uma versão
> anterior do produto — um site-jogo 3D (galpão isométrico em React Three
> Fiber), abandonada em 07/10/2026. O código 3D está no histórico do git, nos
> commits até `c3ecde9`. **Este arquivo é a fonte de verdade agora**, junto com
> `PRODUCT.md` (verdade do produto, usado pela skill de design Impeccable).
>
> O nome mudou de "O Galpão do Patto" para **Achados do Patto**: "galpão" era a
> metáfora do jogo, e o nome precisa conversar com @achadoseofertas.patto.

## O que é

Site de links de afiliado do Mercado Livre. Duas seções:

- **Achados** (`/`) — o achado da vez em destaque; anteriores em grade abaixo.
  Um toque e vai pro Mercado Livre.
- **Blog** (`/blog`) — artigos, pra trazer tráfego do Google.

Simples, rápido no celular, com o link a um toque de distância.
O diferencial é a **curadoria**: poucos achados, muito filtro.

## Regras inquebráveis

1. **`src/data/ofertas.json` é a fonte única dos produtos.** Adicionar achado =
   uma entrada no JSON. Nenhuma página lê o arquivo direto: tudo passa por
   `src/lib/ofertas.ts`, pra validação nunca ser contornada.

2. **Link de afiliado só via `/go/[id]`.** O `linkAfiliado` nunca aparece no
   HTML. O redirect é 302, e é onde a contagem de cliques vai entrar um dia.

3. **Dado inválido derruba o build.** Zod valida `ofertas.json` e o frontmatter
   do blog. Melhor falhar no build que publicar card quebrado.

4. **JavaScript só em ilha, nunca na página inteira.** O site é HTML + CSS
   estático. React existe pros componentes do Kokonut UI, e cada uso é uma ilha
   explícita (`client:visible` / `client:load`). Se um componente não ganha nada
   com JS, ele é `.astro`, não `.tsx`.

5. **Mobile-first, e o link a UM toque.** O público vem do Instagram, no
   celular. Nada de interação que coloque o CTA a dois toques — foi por isso
   que o card que vira ficou no filtro de curadoria, não no produto.

6. **`nicho` é metadado, não divide o site.** Serve pra cor da etiqueta e pra
   filtro. Vitrine única, sempre.

7. **Tokens de cor só em `src/styles/tokens.css`.** Nenhum hex espalhado em
   componente ou página.

8. **O site é escuro, sempre.** Não seguir `prefers-color-scheme`. O tema claro
   existe nos tokens mas só liga por opt-in (`<html data-tema="claro">`).

9. **Um artigo = um `.md` em `src/content/blog/`.** O nome do arquivo vira a
   URL. `rascunho: true` tira da listagem e do build.

10. **Construir parte por parte.** Não antecipar escopo futuro.

11. **Design passa pelo Impeccable.** Antes de editar UI, ler
    `.claude/skills/impeccable/reference/craft-floor.md`. Depois de editar,
    rodar `.claude/skills/impeccable/scripts/impeccable detect --json <arquivos>`.
    Proibições que já me pegaram: kicker/sobrancelha acima de heading, grade de
    cards iguais como estrutura de página, máscara geométrica fingindo recorte
    de foto, sombra colorida sem deslocamento.

## Mapa de pastas

```
src/
  data/ofertas.json         # FONTE ÚNICA dos produtos
  lib/schema.ts             # Zod: formato de uma oferta + nichos
  lib/ofertas.ts            # carrega, valida, deriva (desconto, href)
  content/blog/*.md         # artigos
  content.config.ts         # schema do frontmatter do blog
  layouts/Base.astro        # cabeçalho, rodapé, <head>
  components/CardProduto.astro
  pages/index.astro         # vitrine
  pages/go/[id].ts          # 302 -> linkAfiliado (roda no servidor)
  pages/blog/index.astro    # listagem
  pages/blog/[...slug].astro # artigo
  styles/tokens.css         # cores e tipografia
```

## Como adicionar

**Um achado:** uma entrada em `src/data/ofertas.json`, commit, push.
Campos: `id` (slug único), `titulo`, `preco`, `precoDe?`, `nicho`, `loja?`,
`full?`, `linkAfiliado`, `img?`, `criadoEm` (AAAA-MM-DD).
Sem `img` o card usa um fundo da cor do nicho — não quebra.

**Um artigo:** um `.md` em `src/content/blog/`.
Frontmatter: `titulo`, `resumo`, `publicadoEm`, `tags?`, `rascunho?`.

## Roadmap

- [x] Vitrine de achados com card e CTA
- [x] `/go/[id]` — redirect 302 pro Mercado Livre
- [x] Blog com Markdown
- [ ] Filtro por nicho na vitrine
- [ ] Página por produto (`/p/[id]`) + OG pra compartilhar no Instagram
- [ ] Sitemap + RSS
- [ ] Contagem de cliques no `/go`
- [ ] Automação: agente escreve no `ofertas.json` sozinho

## Stack

Astro + TypeScript · React 19 (só pras ilhas) · Tailwind CSS v4 (plugin Vite) ·
shadcn + Kokonut UI · Motion · Zod · adapter `@astrojs/netlify` · npm.
**Versões são fixadas (exatas) no `package.json`** — não usar `^` nem `~`.
O `shadcn add` traz faixas com `^`: fixar depois de instalar.

## Paleta

Tirada do próprio Patto, não inventada: tinta do terno `#0B1018`–`#3A5A86` ·
laranja do bico `#E8913F` (assinatura) · vermelho da gravata `#D92D2D` (só CTA) ·
creme da camisa `#F5F1E8`.
Display: **Clash Display** · Corpo: **Satoshi**. Ambas da Fontshare, uma origem
só. Nada de Inter — o detector marca como fonte supergasta.
