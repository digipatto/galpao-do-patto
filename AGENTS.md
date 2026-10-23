# Achados & Ofertas — convenções do projeto

> `CLAUDE.md` e `AGENTS.md` têm o MESMO conteúdo: editou um, replique no outro.

## O que é

A página do perfil **@achadoseofertas.patto** (Instagram, "Patto | Achados &
Ofertas"). Uma página só, minimalista, numa coluna de largura de celular:
avatar, tagline, **um botão** ("Ver todas as ofertas") que leva à vitrine geral
de afiliado no Mercado Livre. Conforme ofertas entram em `src/data/ofertas.json`,
um feed de cards aparece embaixo do botão, cada card com o seu próprio botão
pro anúncio.

Sem ofertas, a página é só a primeira tela: identidade, uma frase, um botão.
Não existe "estado vazio" separado, porque o botão já tem pra onde levar.

- URL: https://achadoseofertaspatto.netlify.app (está na bio do Instagram)
- Tagline (da bio): **"Eu garimpo. Você economiza."**
- Sem blog por enquanto. O artigo antigo está no histórico do git (`5ca6042`).

## Regras inquebráveis

1. **`src/data/ofertas.json` é a fonte única.** Adicionar oferta = uma entrada
   no JSON. Nenhuma página lê o arquivo direto: tudo passa por `src/lib/ofertas.ts`.
2. **Link de afiliado só via `/go/...`.** Nenhum link de afiliado aparece no
   HTML. Redirect 302 — é onde a contagem de cliques entra um dia.
   `/go/todas` leva à vitrine geral (`SITE.vitrineAfiliado` em `src/lib/site.ts`,
   o link `mercadolivre.com/sec/...` que lista todos os produtos do dono);
   `/go/<id>` leva ao link de uma oferta. `todas` é id reservado.
3. **Dado inválido derruba o build** (Zod), com mensagem apontando o campo.
4. **0 KB de JavaScript no visitante.** A página é HTML + CSS. React, three.js,
   shadcn, Kokonut e Motion estão instalados, **parados, de propósito**. Não
   importar nenhum sem o usuário pedir.
5. **Mobile-first, e o link a UM toque.** O público vem do Instagram, no celular.
   O card inteiro é clicável.
6. **Nada de prova social inventada.** Nota, avaliações e ranking são copiados
   do anúncio. Campo não conferido fica fora do JSON. **Nada de alegar método
   que o dono não confirmou** (já aconteceu: copy antigo dizia que "confiro
   histórico de preço" sem ninguém ter dito isso).
7. **Tokens de cor só em `src/styles/tokens.css`.** Nenhum hex fora dele.
8. **O site é escuro, sempre.** Não seguir `prefers-color-scheme`.
9. **Não usar a foto de perfil atual do Instagram no site**: ela tem a logo e o
   crachá "Mercado Livre Afiliados", que sugeririam vínculo oficial.
10. **Menos é mais: um objetivo, um botão principal, todos pro Mercado Livre.**
    O único caminho de volta pro Instagram é um link de texto no rodapé, nunca
    um botão. (A versão anterior tinha "Seguir no Instagram" como botão
    principal: mandava o visitante de volta pra onde ele veio.) Antes de
    acrescentar um bloco, perguntar o que ele diz que a página já não disse.
    Cortado de propósito: lista de garantias, FAQ, card de estado vazio.
11. **Design passa pelo Impeccable.** Antes de editar UI, ler
    `.claude/skills/impeccable/reference/craft-floor.md`; depois, rodar
    `.claude/skills/impeccable/scripts/impeccable detect --json <arquivos>`.
    Proibido: kicker acima de heading, grade de cards iguais como estrutura de
    página, gradiente em texto, sombra sem deslocamento.

## Mapa de pastas

```
src/
  data/ofertas.json        FONTE ÚNICA das ofertas (começa vazio: [])
  lib/schema.ts            Zod: formato de uma oferta
  lib/ofertas.ts           carrega, valida, deriva (desconto, economia, href)
  lib/site.ts              nome, Instagram e a vitrine geral de afiliado
  components/Oferta.astro  um card do feed
  layouts/Base.astro       <head>, OG, rodapé com aviso de afiliado
  pages/index.astro        primeira tela (avatar, tagline, botão) + feed
  pages/go/[id].ts         302 pra vitrine (/go/todas) ou oferta (roda no servidor)
  pages/og.astro           gerador da imagem de compartilhamento (noindex)
  styles/tokens.css        cores, tipografia, espaçamento
public/
  marca/patto.webp         avatar (recorte de cabeça e ombros da arte do Patto)
  produtos/*.webp          foto de cada oferta
  og.jpg, favicon.png, apple-touch-icon.png
```

## Como publicar uma oferta

1. Adicionar uma entrada em `src/data/ofertas.json`.
2. Se tiver foto, salvar em `public/produtos/<id>.webp` e apontar `img`.
3. `npm run build` — se o JSON estiver errado, o erro aponta o campo.
4. Commit e push; o Netlify publica sozinho.

Campos: `id` (slug único), `titulo`, `preco`, `precoDe?`, `loja?`,
`lojaOficial?`, `freteGratis?`, `full?`, `parcelas? {vezes, valor, semJuros}`,
`avaliacao?`, `avaliacoes?`, `ranking?`, `img?`, `linkAfiliado`, `criadoEm`
(AAAA-MM-DD, define a ordem: mais nova no topo), `conferidoEm?`.

**O ML bloqueia leitura automatizada** (403 no fetch, "não encontrado" até no
Chrome headless, API exige token). Preço, título e foto vêm do usuário (print
ou texto), nunca de scraping.

## Skills de agente (locais, fora do git; reinstalar com `npx skills add`)

- `impeccable` (pbakaus/impeccable): design. `distill` pra enxugar, `craft-floor`
  antes de editar UI, `detect` depois.
- `cro`, `copywriting`, `marketing-psychology` (coreyhaines31/marketingskills):
  conversão e copy. As três são só texto, sem scripts nem rede (lidas antes de
  instalar). A `marketing-psychology` **não** proíbe urgência falsa nem prova
  social inventada: quem proíbe é a regra 6 deste arquivo.
- `landing-page-generator` (borghei/Claude-Skills): auditoria com 3 scripts
  Python. Rodar com `python -X utf8`. Os scripts medem posição de caractere no
  HTML (não a renderizada) e procuram termos em inglês: conferir no print.

## Imagem de compartilhamento

`/og` é um gerador, não página de visitante. Pra regerar: `npm run build`,
servir `dist/` (`cd dist && python -m http.server 4331`), tirar print de `/og`
em 1200×630 e salvar como `public/og.jpg`. O Chrome headless tem largura mínima
de 500px: abaixo disso o print sai recortado e mente.

## Ambiente

- `npm run dev` **não funciona**: o adapter do Netlify tenta subir um runtime
  Deno local e quebra. Usar `npm run build` e servir `dist/`.
- `/go/[id]` roda no servidor, então não existe ao servir `dist/` à mão. Testar
  importando `.netlify/v1/functions/ssr/ssr.mjs` no Node e chamando o handler.
- O `astro.config.mjs` lê `process.env.URL` (o Netlify injeta no build); sem ele
  usa o endereço de produção.

## Stack

Astro 7 · TypeScript · Tailwind CSS v4 (só o reset, pelo plugin Vite) · Zod ·
`@astrojs/netlify` · npm. **Versões exatas** no `package.json` (nada de `^`/`~`;
o `shadcn add` traz `^`, fixar depois).

## Paleta e tipografia

Tirada do Patto: fundo azul-acinzentado escuro, bico `#F2A33A` (assinatura,
acento e botão de seguir), gravata `#D92D2D` (só CTA de compra e etiqueta de
desconto), camisa `#F6F2EA` (texto). Display **Clash Display**, corpo
**Satoshi** (ambas Fontshare, uma origem só). Nada de Inter.
