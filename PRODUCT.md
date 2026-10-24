# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Seguidores do Instagram **@achadoseofertas.patto** ("Patto | Achados & Ofertas"),
no celular, que clicam no link da bio pra pegar uma oferta. Chegam decididos, com
pressa, muitas vezes em 4G. Sucesso: o produto e o botão pro Mercado Livre estão
na primeira tela, sem rolar.

## Product Purpose

Reunir as ofertas do Mercado Livre que o Patto posta no Instagram num lugar fixo,
com o link de afiliado a um toque. O post some do feed; o site continua.
Monetização: comissão do programa de afiliados do Mercado Livre, e nenhuma outra.

## Brand Commitments

A bio do Instagram é a promessa que a página tem que cumprir. **Copy, palavra por
palavra:**

> 🦆 Sou o Patto, seu garimpeiro oficial
> 💰 Achados reais do Mercado Livre
> 🏭 Clica e entra no meu galpão 3D de ofertas

- **O Patto é o mascote** (pato de terno azul, gravata vermelha, bico laranja) e a
  voz é a dele: primeira pessoa, direta.
- **O "galpão"** é o conceito visual: estante de galpão com uma caixa por oferta.
  Minimalista. 3D em CSS (projeção oblíqua), não WebGL.
- Não usar a foto de perfil atual do Instagram (tem a logo e o crachá "Mercado
  Livre Afiliados", que sugerem vínculo oficial).
- Nada de alegar método que o dono não confirmou (checagem de histórico de preço,
  curadoria etc.) e nada de prova social inventada.

## Capabilities and Constraints

- A primeira tela mostra a(s) oferta(s) e os botões, de 320×568 a 390×844.
- 0 KB de JavaScript no visitante. Dado inválido derruba o build.
- Link de afiliado nunca no HTML: só via `/go/...`.
- O Mercado Livre bloqueia leitura da página de produto; preço, título e foto vêm
  do dono ou da página social do `meli.la` dele (ver CLAUDE.md).
