# Achados & Ofertas — convenções do projeto

> `CLAUDE.md` e `AGENTS.md` têm o MESMO conteúdo: editou um, replique no outro.

## O que é

A página do perfil **@achadoseofertas.patto** (Instagram, "Patto | Achados &
Ofertas"). Uma página só, numa coluna de largura de celular, **tudo na primeira
tela**, com a cara de um **galpão**: uma placa suspensa com a copy da bio, uma
estante com uma caixa por oferta (duas por prateleira) e, colado no fim da tela,
o botão "Ver todas as ofertas" (a vitrine geral de afiliado). Cada caixa tem o
seu botão vermelho "Pegar oferta". Conforme ofertas entram em
`src/data/ofertas.json`, a estante ganha prateleiras sozinha.

- URL: https://achadoseofertaspatto.netlify.app (está na bio do Instagram)
- Bio do Instagram, que é a copy do site **palavra por palavra** (quem clica na
  bio tem que reconhecer a promessa ao chegar): "Sou o Patto, seu garimpeiro
  oficial · Achados reais do Mercado Livre · Clica e entra no meu galpão 3D de
  ofertas". Ver também `PRODUCT.md`.
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
10. **Menos é mais, e tudo pro Mercado Livre.** Vermelho = "comprar ESTE item"
    (botão do card); laranja = "ver todas" (barra fixa). Os dois levam ao ML. O
    único caminho de volta pro Instagram é um link de texto no rodapé, nunca um
    botão (a versão anterior tinha "Seguir no Instagram" como botão principal:
    mandava o visitante de volta pra onde ele veio). Antes de acrescentar um
    bloco, perguntar o que ele diz que a página já não disse. Cortado de
    propósito: lista de garantias, FAQ, hero grande, card de estado vazio.
11. **A primeira tela mostra as ofertas e os botões, sem rolar.** Pedido
    explícito do dono: a versão com hero grande escondia o produto abaixo da
    dobra e ele precisava rolar pra achar o primeiro link. Vale de 320×568 a
    390×844. Nunca gastar a primeira tela com identidade; ela cabe em uma linha.
    Título de card em Satoshi (a Clash Display fecha as letras em 16px, e em
    qualquer tamanho pequeno ela fecha o espaço entre palavras: usar
    `word-spacing` ao usá-la em texto menor que um título grande).
12. **Design passa pelo Impeccable.** Antes de editar UI, ler
    `.claude/skills/impeccable/reference/craft-floor.md`; depois, rodar
    `.claude/skills/impeccable/scripts/impeccable detect --json <arquivos>`.
    Proibido: kicker acima de heading, grade de cards iguais como estrutura de
    página, gradiente em texto, sombra sem deslocamento.

## O galpão (visual)

O "3D" é **CSS 3D em projeção oblíqua**, não WebGL e não three.js, de propósito:

- A tentativa anterior de galpão em WebGL (R3F, primitivos) parecia um diagrama e
  foi rejeitada; o histórico dela está nos commits até `c3ecde9`.
- Projeção oblíqua mantém o texto plano e nítido (sem distorção por rotação) e o
  botão no toque, com 0 KB de JS e a oferta na primeira tela.

Peças, todas em CSS puro:

- **Placa suspensa** (`.placa`): o cabeçalho, com dois cabos até o teto.
- **Estante** (`.estante`): montantes azuis (`--montante`, o azul do terno) e uma
  travessa laranja por prateleira (`--travessa`, o laranja do bico).
- **Caixa** (`Oferta.astro`): frente plana + topo e lateral inclinados por `skew`
  (45°). Topo claro com fita laranja, lateral escura (luz vindo de cima). Os
  tokens são `--caixa-frente/topo/lado` e `--fita`.
- **Vaga livre**: espaço tracejado quando a prateleira tem uma caixa só.
- **Piso**: duas faixas de corredor em SVG, convergindo pro fundo.
- **Movimento**: um só, as caixas assentam na prateleira ao abrir.

Foto de produto fica num tom claro (`--foto-fundo`, `multiply`): foto de anúncio
tem fundo branco e o produto costuma ser escuro.

**Quer WebGL de verdade?** Está instalado (`three`), parado. Custa ~130 KB gzip,
exige uma ilha React, e é preciso provar que ele não empurra a oferta pra baixo
da primeira tela.

## Mapa de pastas

```
src/
  data/ofertas.json        FONTE ÚNICA das ofertas (começa vazio: [])
  lib/schema.ts            Zod: formato de uma oferta
  lib/ofertas.ts           carrega, valida, deriva (desconto, economia, href)
  lib/site.ts              nome, Instagram e a vitrine geral de afiliado
  components/Oferta.astro  uma caixa na prateleira (uma oferta)
  layouts/Base.astro       <head>, OG, rodapé com aviso de afiliado
  pages/index.astro        placa + estante (prateleiras) + piso + barra "ver todas"
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

Campos: `id` (slug único), `titulo`, `preco`, `precoDe?`, `condicaoPreco?`
(ex.: "no Pix"), `precoAlternativo? {valor, rotulo}`, `loja?`, `lojaOficial?`,
`freteGratis?`, `full?`, `parcelas? {vezes, valor, semJuros}`, `avaliacao?`,
`avaliacoes?`, `ranking?`, `img?`, `linkAfiliado`, `criadoEm` (AAAA-MM-DD,
define a ordem: mais nova no topo), `conferidoEm?`.

**Preço com condição vai com a condição.** Se o preço de destaque do anúncio é
o do Pix, usar `condicaoPreco: "no Pix"` e o outro em `precoAlternativo`.
**Frete grátis condicional** ("por ser sua primeira compra") NÃO é `freteGratis`.

**Foto de produto fica sobre fundo claro** (`--foto-fundo`, com `multiply`):
foto de anúncio tem fundo branco e o produto costuma ser escuro. Conferir que a
foto bate com o modelo do anúncio: o dono mandou 4 fotos do Redmi e só 2 eram
do Buds 6 Play.

### Como ler os dados de um produto

- Página de produto e API do ML: **bloqueadas** (403 / exige token).
- Mas o link `meli.la/...` do dono redireciona pra `/social/<perfil>`, uma
  página **renderizada no servidor** que abre com `curl` comum: o `og:title` é o
  produto e o primeiro card traz preço, desconto, selos e Full. Dá pra ler título,
  preço e selos dali, e conferir a foto contra o `og:image`.
- **Esse link leva à página de perfil do ML, não ao produto.** O visitante cai na
  vitrine com o produto no topo e precisa tocar em "Ir para produto". Se o dono
  tiver o link direto do produto (opção de link do produto no painel de afiliados),
  provavelmente converte mais: um toque a menos.

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

`/og` é um gerador (copy da bio + avatar), não página de visitante. Pra regerar: `npm run build`,
servir `dist/` (`cd dist && python -m http.server 4331`), tirar print de `/og`
em 1200×630 e salvar como `public/og.jpg`. O Chrome headless tem largura mínima
de 500px: abaixo disso o print sai recortado e mente.

## Ambiente

- **Testar em celular de verdade:** o Chrome headless não renderiza abaixo de
  500px, então um print "de 390px" é só um recorte de 500px e mente. Montar um
  HTML com `<iframe style="width:390px;height:844px">` apontando pro servidor
  local (e outros dois em 360×740 e 320×568) e tirar print da janela de 1180px.
  Dentro do iframe a página enxerga a largura real.
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
