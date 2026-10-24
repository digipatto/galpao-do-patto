# Achados & Ofertas

A página do perfil [@achadoseofertas.patto](https://instagram.com/achadoseofertas.patto):
o perfil em cima, as ofertas do Mercado Livre embaixo, a mais nova no topo. Cada
oferta postada no Instagram vira um card com o botão pro anúncio.

Site: https://achadoseofertaspatto.netlify.app

HTML e CSS estáticos, **0 KB de JavaScript** no visitante.

---

## Publicar uma oferta

Uma entrada em [`src/data/ofertas.json`](./src/data/ofertas.json), commit, push.
O Netlify publica sozinho.

```json
{
  "id": "fone-qcy-anc",
  "titulo": "Fone QCY com cancelamento de ruído",
  "preco": 149.9,
  "precoDe": 249.9,
  "loja": "QCY Oficial",
  "lojaOficial": true,
  "freteGratis": true,
  "parcelas": { "vezes": 10, "valor": 14.99, "semJuros": true },
  "avaliacao": 4.8,
  "avaliacoes": 1250,
  "img": "/produtos/fone-qcy-anc.webp",
  "linkAfiliado": "https://meli.la/SEU-CODIGO",
  "criadoEm": "2026-10-23",
  "conferidoEm": "2026-10-23"
}
```

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| `id` | sim | Minúsculas, números e hífens. Único. Vira o endereço do botão (`/go/<id>`). |
| `titulo` | sim | 3 a 120 caracteres. |
| `preco` | sim | Número com ponto decimal, sem `R$`: `149.9`. |
| `precoDe` | não | Preço cheio. Tem que ser **maior** que `preco`. Gera o `−40%`. |
| `condicaoPreco` | não | Condição do `preco`, quando não vale pra qualquer pagamento: `"no Pix"`. |
| `precoAlternativo` | não | O outro preço do anúncio: `{ "valor": 99.9, "rotulo": "em outros meios" }`. |
| `loja`, `lojaOficial`, `freteGratis`, `full` | não | Selos do card. |
| `parcelas` | não | `{ "vezes": 10, "valor": 14.99, "semJuros": true }`. |
| `avaliacao`, `avaliacoes`, `ranking` | não | **Copie do anúncio**, nunca estime. |
| `img` | não | Caminho em `public/` (`/produtos/x.webp`) ou URL. Sem ela o card mostra a inicial do título. |
| `linkAfiliado` | sim | **Seu** link. Nunca aparece no HTML: fica atrás do `/go`. |
| `criadoEm` | sim | `AAAA-MM-DD`. Define a ordem: mais nova no topo. |
| `conferidoEm` | não | Quando você conferiu o preço. Aparece no card. |

Campo errado **derruba o build** com uma mensagem apontando qual campo e por quê.
É de propósito: melhor quebrar aqui que publicar card torto.

---

## O botão "Ver todas as ofertas"

A barra laranja fixa no fim da tela leva à vitrine geral de afiliado (o link
`mercadolivre.com/sec/...` que lista todos os produtos que você gerou). Ele passa
por `/go/todas`, então o link não aparece no HTML. Pra trocar o destino, edite
`vitrineAfiliado` em [`src/lib/site.ts`](./src/lib/site.ts).

`todas` é um id reservado: nenhuma oferta pode se chamar assim.

---

## Rodar local

Precisa de Node 22.12+ e npm.

```bash
npm install
npm run build     # build de produção -> dist/
npm run check     # validação de tipos
```

> `npm run dev` **não funciona**: o adapter do Netlify tenta subir um runtime
> Deno local e quebra. Pra ver o site, rode `npm run build` e sirva a pasta
> `dist/` (`cd dist && python -m http.server 4331`). A rota `/go/<id>` roda no
> servidor, então só existe no Netlify.

---

## Git e deploy

```bash
git add -A
git commit -m "Nova oferta: ..."
git push
```

O Netlify builda e publica a cada push. O `netlify.toml` já tem o build
(`npm run build`) e a pasta de saída (`dist`).

---

## Stack

Astro 7, TypeScript, Zod e `@astrojs/netlify`. Tailwind v4 entra só pelo reset.
React, three.js, shadcn, Kokonut UI e Motion estão instalados mas **não são
usados** — ficam prontos pra quando fizerem falta. Versões exatas no
`package.json`.

Convenções do projeto: [`CLAUDE.md`](./CLAUDE.md).
