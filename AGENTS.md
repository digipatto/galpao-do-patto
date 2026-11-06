# Achados & Ofertas — convenções do projeto

> `CLAUDE.md` e `AGENTS.md` têm o MESMO conteúdo: editou um, replique no outro.

## O que é

A página do perfil **@achadoseofertas.patto** (Instagram, "Patto | Achados &
Ofertas"). Uma página só, numa coluna de largura de celular, com a cara de um
**galpão de caixas em movimento**: a primeira tela é uma **esteira** 3D (WebGL,
`src/cena/esteira.ts`): fileiras de caixas deslizam em esteiras (cada fileira num
sentido e numa velocidade); cada caixa mostra a **foto do produto** e uma
**etiqueta de preço**; **tocar numa caixa abre o produto** (`/go/<id>`, um toque).
Arrastar uma fileira empurra a esteira (inércia); a fileira tocada desacelera; as
caixas se inclinam pro lado em que andam. Com poucas ofertas, as caixas se repetem
pra encher a esteira (com 1 oferta, todas são dela); com várias, cada fileira
começa numa oferta diferente. Texto, preço e links de verdade ficam em **HTML**:
placa com a copy da bio no alto do palco, dica "Toque numa caixa pra abrir · ver
em lista" embaixo, e logo abaixo do palco a **vitrine** (fundo liso) com TODOS os
achados em linhas compactas e abas Recentes / Desconto / Menor preço (rádio +
`:has`, sem JS; só com 3+ linhas). Sem WebGL/JS (ou aparelho fraco), o poster
fica e o **card do destaque** (`Oferta.astro`) aparece no lugar das caixas.
Colado no fim da tela, sempre, o botão laranja "Ver todas as ofertas" (a vitrine
geral de afiliado no ML). Conforme ofertas entram em `src/data/ofertas.json`, a
esteira e a vitrine crescem sozinhas. O preço é lido do ML automaticamente (ver
"Preço"). A etiqueta só mostra o preço enquanto ele estiver conferido (senão diz
"Ver preço"). O corredor 3D com um pedestal por oferta existiu até 06/11/2026
(commit db82b8f); o dono pediu caixas em movimento no lugar.

Por que a vitrine (06/11/2026): o dono pediu mais qualidade de navegação com base
nos sites de oferta que bombam (Pelando, Promobit). Eles mostram muitas ofertas por
tela, com abas de ordem e sinais de frescor; a versão anterior era uma tela inteira
por oferta, o que não escala com o enviador publicando produtos sozinho. Sinais de
frescor, todos reais: selo "Novo" (criada há até `DIAS_NOVA` = 3 dias) e "Preço
conferido no ML hoje/ontem", corrigidos no navegador (o site só é publicado quando
algo muda).

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
4. **O único JS é a esteira 3D, e ela é opcional.** (`/quiz/<id>` não tem JS: ver
   "Quiz".) `three` puro, carregado depois da primeira pintura
   (`src/cena/esteira.ts`), sem React, sem GSAP, sem framework. A página inteira
   funciona sem ele: o poster (`public/cena/poster-*.webp`) fica no lugar da cena
   sem WebGL, com economia de dados ou em aparelho fraco (menos de 2 GB de RAM ou
   2 núcleos), e o card do destaque faz o papel das caixas. Com
   `prefers-reduced-motion` a esteira fica parada, mas as caixas continuam
   tocáveis. A esteira **só desenha enquanto o palco está à vista**
   (IntersectionObserver) e a aba está aberta; rolou pra vitrine, dorme. React, shadcn,
   Kokonut e Motion continuam parados. Não importar nenhum sem o usuário pedir.
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

## Quiz (interação com quem segue e comenta)

Um jogo `/jogo` ("Garimpo no corredor") foi feito e tirado a pedido do dono em 06/11/2026
("não gostei, vamos pensar depois"): está no histórico do git (`68f2270`).


- **`/quiz/<id>`** (SSR, como o `/go`): sem `?r=` mostra a pergunta com as letras como
  links; com `?r=B` mostra "Acertou!"/"Quase!", a história (`revelacao`) e o card da
  oferta. **A resposta certa nunca vai no HTML da pergunta** (a página lê no servidor).
  Fluxo do Reel: o vídeo faz a pergunta, a pessoa comenta a letra, o enviador
  (`VideosPAttoAchados/enviador-links`) manda por DM o link `/quiz/<id>?r=<letra>`.
  Formato em `src/data/quizzes.json`: `id`, `ofertaId` (tem que existir em
  `ofertas.json`), `pergunta`, `opcoes` (2 a 4 textos; a letra é a posição), `correta`,
  `revelacao` (só fatos que o dono confirmou), `criadoEm`.
- **Crescimento automático:** o enviador, ao salvar uma automação com "colocar no site"
  (ou quiz), commita a oferta em `ofertas.json` (título, `linkAfiliado`, `preco: 1`
  provisório, `criadoEm`) e o quiz em `quizzes.json`, via API do GitHub. O workflow
  `atualizar-precos.yml` também roda quando o `ofertas.json` muda: lê o preço e, se a
  oferta não tem `img`, **baixa a foto do card do anúncio** pra `public/produtos/<id>.<ext>`
  (só quando `img` está vazio; foto posta à mão nunca é trocada). O preço provisório não
  aparece (sem `conferidoEm` o card mostra "Ver preço atual"). Conferir a foto depois: o
  robô casa o título digitado com o card do anúncio.

## A esteira 3D (visual)

O palco (`.palco`, altura `100svh - barra`) tem o canvas e, por cima, a placa e a
dica (`pointer-events: none`, pra o toque passar pro canvas). `touch-action:
pan-y`: arrastar de lado empurra a esteira, vertical continua rolando a página.

- **Cena** (`src/cena/esteira.ts`, three puro): 4 esteiras em retrato (3 em
  paisagem ou celular baixo, `h < 640`), cada uma com 10 caixas e rolos; parede
  escura, montantes azuis (`--p-terno`) e uma fita de LED ciano (`--p-holo`) no
  alto. As de baixo ficam mais perto da câmera. O enquadramento nasce da altura
  que precisa caber (`nFileiras * DY + 3.4`), não de uma largura fixa. A foto do
  produto é a face da frente da caixa (foto de anúncio tem fundo branco: vai sobre
  `--foto-fundo` com multiply, como no card); a **etiqueta** é uma pílula âmbar
  (`--p-bico`) com furo de barbante e o preço, em textura de canvas.
  **O Patto NÃO aparece na cena** (já está na placa). Cores lidas dos tokens CSS:
  nenhum hex no TS.
- **Interação**: hover (mouse) levanta e amplia a caixa, a esteira da caixa
  desacelera pra dar tempo de pegar; toque aperta a caixa (animação curta) e abre.
  Arrasto > 7 px vira empurrão com inércia (não abre). `navigator.vibrate(8)` ao
  abrir. Constantes no topo do arquivo (`ESP`, `DY`, `velocidades`).
- **Poster**: `public/cena/poster-retrato.webp` (780×1688) e `poster-paisagem.webp`
  (1600×900). As caixas do poster mostram a letra A e "Ver preço", não um produto,
  pra nunca ficar velho. **Regerar quando mudar a cena**: `npm run build`, servir
  `dist/`, abrir `/cena-poster?w=780&h=1688` (retrato) e
  `/cena-poster?w=1600&h=900` (paisagem) no Edge/Chrome headless com
  `--enable-unsafe-swiftshader --use-angle=swiftshader`, esperar
  `window.__cenaPronta`, tirar print e converter pra webp. `/cena-poster` é
  gerador (noindex), como `/og`.
- **Card** (`Oferta.astro`): HTML puro, usado quando a esteira não carrega.
  **Linha** (`OfertaLinha.astro`): a versão compacta da vitrine.

## Mapa de pastas

```
src/
  data/ofertas.json        FONTE ÚNICA das ofertas (começa vazio: [])
  lib/schema.ts            Zod: formato de uma oferta
  lib/ofertas.ts           carrega, valida, deriva (desconto, economia, href)
  lib/site.ts              nome, Instagram e a vitrine geral de afiliado
  components/Oferta.astro  o card HTML de uma oferta (fallback sem WebGL)
  components/OfertaLinha.astro  linha compacta da vitrine
  cena/esteira.ts          a esteira 3D (three puro), carregada sob demanda
  layouts/Base.astro       <head>, OG, rodapé com aviso de afiliado
  pages/index.astro        palco (poster + canvas + placa) + vitrine + barra "ver todas"
  pages/go/[id].ts         302 pra vitrine (/go/todas) ou oferta (roda no servidor)
  pages/quiz/[id].astro    pergunta e resultado do quiz (roda no servidor, 0 KB de JS)
  data/quizzes.json        quizzes (começa vazio: []); o enviador escreve aqui
  lib/quizzes.ts           carrega e valida os quizzes (oferta inexistente derruba o build)
  pages/og.astro           gerador da imagem de compartilhamento (noindex)
  pages/cena-poster.astro  gerador dos posters da esteira (noindex)
scripts/atualizar-precos.mjs  lê o preço de cada oferta no ML (roda no GitHub Actions)
.github/workflows/atualizar-precos.yml  roda o script 2x por dia e commita
  styles/tokens.css        cores, tipografia, espaçamento
public/
  cena/poster-*.webp       poster da esteira (retrato e paisagem)
  marca/patto.webp         avatar (recorte de cabeça e ombros da arte do Patto)
  produtos/*.webp          foto de cada oferta
  og.jpg, favicon.png, apple-touch-icon.png
```

## Como publicar uma oferta

1. Adicionar uma entrada em `src/data/ofertas.json` (o `preco` inicial pode ser
   aproximado: o script de preços corrige e preenche `mlb` e `conferidoEm`).
2. Rodar `node scripts/atualizar-precos.mjs` pra ler o preço de verdade.
3. Se tiver foto, salvar em `public/produtos/<id>.webp` e apontar `img`.
4. `npm run build` — se o JSON estiver errado, o erro aponta o campo.
5. Commit e push; o Netlify publica sozinho.

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

## Preço (automático, sem a API do ML)

`scripts/atualizar-precos.mjs` segue o `linkAfiliado` (meli.la redireciona pra
`/social/<perfil>`, renderizada no servidor), acha o card do produto e lê
"Antes"/"Agora". É a mesma tela que o visitante vê ao clicar, então o preço lido
é o que ele encontra.

- **Só atualiza o mesmo anúncio**: na primeira leitura aprende o id (`mlb`)
  cruzando o título com o do card; nas seguintes exige o mesmo `mlb`.
- **Preço de vitrine**: o script apaga `condicaoPreco` e `precoAlternativo`
  (digitados à mão, não dá pra conferir). Não lê Pix nem parcelas.
- **Falhou ou o ML bloqueou? Não mexe em nada.** `conferidoEm` envelhece e, passados
  `VALIDADE_PRECO_DIAS` (2) dias, o card esconde o preço e o botão vira "Ver preço
  atual". O HTML leva as duas versões e `data-velho` escolhe (CSS): o build marca
  as já velhas (`precoValido`) e um script mínimo no `index.astro` marca no
  navegador as que envelheceram depois do build, então não precisa de deploy diário.
  Preço velho é pior que preço nenhum.
- **Roda sozinho**: `.github/workflows/atualizar-precos.yml`, 1x por dia às 09h de
  Brasília (e à mão na aba Actions). **Só commita quando um preço mudou**: cada
  commit é um deploy no Netlify e deploy custa crédito/minuto de build.
- À mão: `node scripts/atualizar-precos.mjs` (`--dry` só mostra, não grava).
- Se o ML passar a bloquear o IP do GitHub, o job falha (todas as ofertas sem
  leitura), os preços somem em 2 dias e o site segue funcionando "sem preço".

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
