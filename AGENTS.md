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

- **Achados** (`/`) — **página de vendas**, não vitrine: herói com o campo 3D e
  a oferta acima da dobra, faixa de confiança, problema, o filtro em 4 passos,
  o produto em detalhe, FAQ e fecho com reversão de risco. Anteriores em grade
  quando houver mais de um. Um toque e vai pro Mercado Livre.
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

11. **Conversão passa pelo landing-page-generator.** A home segue PAS
    (público já conhece o problema: desconto falso). Uma meta, um CTA — todo
    botão leva pro mesmo lugar. Auditar com os scripts em
    `.claude/skills/landing-page-generator/scripts/` usando `python -X utf8`
    (sem isso quebra no Windows). Os scripts procuram termos em inglês e
    posição de caractere no HTML: tratar "How It Works", "risk reversal",
    métricas e "above the fold" como falso-negativo, conferindo no print.

12. **Nada de prova social inventada.** Nota, avaliações, ranking, vendas do
    vendedor e parcelamento são copiados do anúncio e vão pro `ofertas.json`.
    Campo não conferido fica de fora — a página só mostra o que existe. O
    `conferidoEm` aparece na página: promessa de preço sem data é vazia.

13. **Design passa pelo Impeccable.** Antes de editar UI, ler
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
  components/Garimpo.tsx    # campo 3D do herói (three.js, ilha client:idle)
  pages/index.astro         # a página de vendas
  pages/og.astro            # gerador da imagem de compartilhamento
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

Astro + TypeScript · React 19 (só pras ilhas) · three.js · Tailwind CSS v4
(plugin Vite) · shadcn + Kokonut UI · Motion · Zod · adapter
`@astrojs/netlify` · npm.
**Versões são fixadas (exatas) no `package.json`** — não usar `^` nem `~`.
O `shadcn add` traz faixas com `^`: fixar depois de instalar.

## Paleta

Tirada do próprio Patto, não inventada: tinta do terno `#0B1018`–`#3A5A86` ·
laranja do bico `#E8913F` (assinatura) · vermelho da gravata `#D92D2D` (só CTA) ·
creme da camisa `#F5F1E8`.
Display: **Clash Display** · Corpo: **Satoshi**. Ambas da Fontshare, uma origem
só. Nada de Inter — o detector marca como fonte supergasta.

## Imagem de compartilhamento

`/og` é um gerador, não página de visitante (`noindex`). Pra regerar depois de
mexer na marca: `npm run build`, servir `dist/`, tirar print de `/og` em
1200×630 e salvar como `public/og.jpg`.

O `astro.config.mjs` lê `process.env.URL` (o Netlify injeta no build) pra montar
`canonical` e `og:image` absolutos. Local fica `localhost` — é esperado.

## O campo 3D do herói

`Garimpo.tsx` desenha o posicionamento: muitas caixas apagadas (o descarte) e
as poucas acesas (o que passou). `aprovados` vem do tamanho do catálogo, então
cresce sozinho. Custa ~129 KB gzip de three.js — por isso é `client:idle`,
`aria-hidden`, pausa fora da tela, respeita `prefers-reduced-motion` e some
inteiro quando não há WebGL.
