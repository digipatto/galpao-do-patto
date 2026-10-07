# O Galpão do Patto

Site de links de afiliado do Mercado Livre. Vitrine de achados na home, blog
pra trazer tráfego do Google. HTML estático, **zero JavaScript**, rápido no
celular.

- **Achados** (`/`) — grade de produtos. Toca no card e vai pro Mercado Livre.
- **Blog** (`/blog`) — artigos em Markdown.

Convenções de código: [`CLAUDE.md`](./CLAUDE.md) (= [`AGENTS.md`](./AGENTS.md)).

> O [`plano-galpao-do-patto.md`](./plano-galpao-do-patto.md) descreve uma versão
> 3D anterior do produto, abandonada. Ficou como registro.

---

## Adicionar um achado

Uma entrada em [`src/data/ofertas.json`](./src/data/ofertas.json), commit,
push. O Netlify publica sozinho.

```json
{
  "id": "fone-qcy-anc",
  "titulo": "Fone QCY com cancelamento de ruído",
  "preco": 149.9,
  "precoDe": 249.9,
  "nicho": "eletronicos",
  "loja": "Mercado Livre",
  "full": true,
  "linkAfiliado": "https://mercadolivre.com/sec/SEU-CODIGO",
  "img": "https://http2.mlstatic.com/....jpg",
  "criadoEm": "2026-10-07"
}
```

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| `id` | sim | Minúsculas, números e hífens. Vira a URL em `/go/<id>`. Único. |
| `titulo` | sim | 3 a 120 caracteres. |
| `preco` | sim | Número, sem `R$` e com ponto decimal: `149.9`. |
| `precoDe` | não | Preço cheio. Tem que ser **maior** que `preco`. Gera o `-40%`. |
| `nicho` | sim | Um de: eletronicos, casa, beleza, informatica, ferramentas, automotivo, pet, fitness, curiosos. |
| `loja` | não | Nome do vendedor. |
| `full` | não | `true` mostra o selo Full. |
| `linkAfiliado` | sim | **Seu** link. Nunca aparece no HTML — fica atrás do `/go`. |
| `img` | não | URL da foto. Sem ela o card usa a cor do nicho. |
| `criadoEm` | sim | `AAAA-MM-DD`. Define a ordem (mais novo primeiro). |

Campo errado **derruba o build** com mensagem apontando a linha. É de propósito:
melhor quebrar aqui que publicar card torto.

---

## Escrever um artigo

Um arquivo `.md` em [`src/content/blog/`](./src/content/blog/). O nome do
arquivo vira a URL (`achados-de-outubro.md` → `/blog/achados-de-outubro`).

```markdown
---
titulo: Os melhores fones até R$ 200
resumo: Testei cinco e sobrou um. Resumo de 10 a 220 caracteres.
publicadoEm: 2026-10-07
tags:
  - fones
  - comparativo
rascunho: false
---

O texto do artigo em Markdown.
```

`rascunho: true` tira o artigo da listagem e do build.

---

## Rodar local

Precisa de Node 22.12+ (LTS) e npm.

```bash
npm install
npm run build     # build de produção -> dist/
npm run check     # validação de tipos
```

> `npm run dev` não funciona neste projeto: o adapter do Netlify tenta subir um
> runtime Deno local e quebra. Pra ver o site, use `npm run build` e sirva a
> pasta `dist/` (ex.: `cd dist && python -m http.server 4331`). A rota `/go`
> não existe nesse modo — ela roda no servidor, só no Netlify.

---

## Git e deploy

O remote já aponta pra `https://github.com/digipatto/galpao-do-patto.git`.
O dia a dia é:

```bash
git add -A
git commit -m "Novo achado: ..."
git push
```

O Netlify builda e publica sozinho a cada push; Pull Request ganha URL de
preview.

### Conectar o Netlify (se precisar refazer)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. **Deploy with GitHub** → autorizar → escolher `galpao-do-patto`
3. Build e publish já vêm do `netlify.toml` — não mexa → **Deploy site**
4. **Site configuration** → **Change site name** pra deixar a URL legível

---

## Stack

| Peça | O quê |
| --- | --- |
| [Astro](https://astro.build) | base do site, rotas e endpoints |
| [Tailwind CSS v4](https://tailwindcss.com) | reset e utilitários (plugin do Vite) |
| [Zod](https://zod.dev) | valida ofertas e frontmatter no build |
| `@astrojs/netlify` | deploy; roda a rota `/go/[id]` no servidor |

Sem framework de UI. Versões **exatas** no `package.json` — sem `^`, sem `~`.
