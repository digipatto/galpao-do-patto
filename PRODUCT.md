# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primário — o seguidor do Instagram (@achadoseofertas.patto).** Viu o story ou
o post, já conhece o Patto, e veio pegar o link daquele produto específico.
Chega decidido e com pressa, no celular, muitas vezes em 4G. Sucesso pra ele é
o link em um toque, sem ter que procurar.

**Secundário — quem chega pelo Google.** Procurou algo como "melhor fone até
R$ 200", caiu num artigo do blog e não conhece a marca. Chega em modo pesquisa
e precisa de razão pra confiar antes de clicar. O blog existe justamente pra
abrir esse canal.

A prioridade declarada é o seguidor do Instagram: o site serve ele primeiro,
sem fechar a porta pro visitante novo.

## Product Purpose

Reunir os achados que o Patto garimpa no Mercado Livre num lugar fixo, com o
link de afiliado a um toque. O post no Instagram é efêmero e some no feed; o
site é onde o achado continua existindo depois que o story expira.

Sucesso = o visitante encontra o produto e vai pro Mercado Livre pelo link de
afiliado.

## Positioning

**A curadoria.** Poucos achados, escolhidos com critério — histórico de preço
(desconto de verdade, não "de" inflado), reputação do vendedor, avaliações
reais, preço final com frete. O valor está no que ficou **de fora**.

É um posicionamento que uma página genérica de afiliado não copia de verdade,
porque ela depende de volume: quanto mais links, melhor. Aqui é o contrário.

O método de garimpo está escrito em `src/content/blog/como-garimpo-as-ofertas.md`
e é a prova concreta dessa posição.

## Operating Context

- O tráfego nasce no Instagram: story ou post → link na bio ou no sticker → site.
- O catálogo é pequeno e muda devagar. Hoje: **1 produto**.
- Publicar um achado = uma entrada em `src/data/ofertas.json`, commit, push.
  O Netlify publica sozinho.
- Todo clique pro Mercado Livre passa por `/go/[id]`, nunca pelo link cru.

## Capabilities and Constraints

- **Vitrine de achados** (`/`) e **blog** (`/blog`). Duas seções, ritmos
  independentes: dá pra postar oferta sem escrever artigo.
- Dado inválido derruba o build (Zod valida `ofertas.json` e o frontmatter).
- Monetização: comissão de afiliado do Mercado Livre. Nenhuma outra.
- **Em aberto:** o nome público do site. "O Galpão do Patto" vinha da metáfora
  de um jogo 3D que foi abandonado, e o usuário pediu que o nome converse com
  o perfil **@achadoseofertas.patto**. Nome de trabalho adotado:
  **Achados do Patto** — a confirmar.

## Brand Commitments

- **O Patto é o mascote e é inegociável.** Pato de terno azul-marinho, gravata
  e lenço vermelhos, bico e pés laranja. Precisa aparecer no site.
- **@achadoseofertas.patto** é o perfil do Instagram e a origem do público.
  A identidade do site tem que conversar com ele.
- Voz: primeira pessoa, direta, sem hype. O artigo do blog é a amostra —
  "preço bom com vendedor ruim é dor de cabeça com desconto".
- **Não marcados como inegociáveis**, portanto abertos no redesenho: a paleta
  atual (azul-noite / âmbar / vermelho) e o tema escuro.

## Evidence on Hand

- O artigo "Como eu garimpo as ofertas do Mercado Livre" — prova escrita do
  método de curadoria.
- **Faltando:** a arte do Patto. O usuário precisa fornecer o arquivo; não há
  como gerar o personagem aqui. Sem ele o site fica com espaço reservado.
- **Faltando:** foto e preço do produto. O Mercado Livre bloqueia leitura
  automatizada da página, então esses dados vêm do usuário.
