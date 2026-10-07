# O Galpão do Patto — convenções do projeto

> `CLAUDE.md` e `AGENTS.md` têm o MESMO conteúdo: editou um, replique no outro.
>
> ⚠️ **`plano-galpao-do-patto.md` está superado.** Ele descreve uma versão
> anterior do produto — um site-jogo 3D (galpão isométrico em React Three
> Fiber). Essa direção foi abandonada em 07/10/2026: com placeholders a cena
> parecia um diagrama, não um jogo, e o 3D atrapalhava o que importa (achar o
> produto e pegar o link). O código 3D está no histórico do git, nos commits
> até `c3ecde9`. **Este arquivo é a fonte de verdade agora.**

## O que é

Site de links de afiliado do Mercado Livre. Duas seções:

- **Achados** (`/`) — vitrine de produtos. Toca no card, vai pro Mercado Livre.
- **Blog** (`/blog`) — artigos, pra trazer tráfego do Google.

Simples, rápido no celular, com o link a um toque de distância.

## Regras inquebráveis

1. **`src/data/ofertas.json` é a fonte única dos produtos.** Adicionar achado =
   uma entrada no JSON. Nenhuma página lê o arquivo direto: tudo passa por
   `src/lib/ofertas.ts`, pra validação nunca ser contornada.

2. **Link de afiliado só via `/go/[id]`.** O `linkAfiliado` nunca aparece no
   HTML. O redirect é 302, e é onde a contagem de cliques vai entrar um dia.

3. **Dado inválido derruba o build.** Zod valida `ofertas.json` e o frontmatter
   do blog. Melhor falhar no build que publicar card quebrado.

4. **Zero JavaScript por padrão.** O site é HTML + CSS estático. Se um recurso
   exigir interatividade, entra como ilha pontual — nunca um framework na
   página inteira.

5. **Mobile-first.** O público vem do Instagram, no celular. Vitrine em duas
   colunas, preço legível, CTA visível sem rolar.

6. **`nicho` é metadado, não divide o site.** Serve pra cor da etiqueta e pra
   filtro. Vitrine única, sempre.

7. **Tokens de cor só em `src/styles/tokens.css`.** Nenhum hex espalhado em
   componente ou página.

8. **O site é escuro, sempre.** Não seguir `prefers-color-scheme`. O tema claro
   existe nos tokens mas só liga por opt-in (`<html data-tema="claro">`).

9. **Um artigo = um `.md` em `src/content/blog/`.** O nome do arquivo vira a
   URL. `rascunho: true` tira da listagem e do build.

10. **Construir parte por parte.** Não antecipar escopo futuro.

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

Astro + TypeScript · Tailwind CSS v4 (plugin Vite) · Zod · adapter
`@astrojs/netlify` · npm. **Sem framework de UI** — nenhum React no projeto.
**Versões são fixadas (exatas) no `package.json`** — não usar `^` nem `~`.

## Paleta

azul-noite `#15203C` / `#0F1320` · âmbar `#FFC400` / `#FF9F0A` ·
vermelho CTA `#E03131` · ciano `#3FE0D0` · creme `#FBF8F1` · neutros grafite.
Display: **Clash Display** (fallback Space Grotesk) · Corpo: **Inter**.
