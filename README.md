# O Galpão do Patto

Site-jogo 3D: um **mundo único** — um galpão logístico futurista onde o Patto toca a
operação. Cada link de afiliado do Mercado Livre vira mais um item no galpão.
O armazém cresce conforme as ofertas entram.

Arquitetura completa: [`plano-galpao-do-patto.md`](./plano-galpao-do-patto.md).
Regras de código: [`CLAUDE.md`](./CLAUDE.md) (= [`AGENTS.md`](./AGENTS.md)).

**Status:** Parte 0 — fundação. A página está no ar com o letreiro "em construção".
Nada de 3D ainda.

---

## Rodar local

Precisa de Node 22.12+ (LTS) e npm — o Astro 7 exige isso.

```bash
npm install     # instala as dependências (versões fixas)
npm run dev     # servidor de desenvolvimento -> http://localhost:4321
npm run build   # build de produção -> dist/
npm run preview # serve o dist/ localmente
npm run check   # checagem de tipos (astro check)
```

---

## Conectar o Netlify ao GitHub (passo a passo)

Feito uma vez. Depois disso, **todo push na branch principal publica sozinho**
e todo Pull Request ganha uma URL de preview.

O repositório é **`digipatto/AchadosPatto2`**.

1. Entre em [app.netlify.com](https://app.netlify.com) e faça login
   (dá pra entrar com a conta do GitHub).
2. No painel, clique em **Add new site** → **Import an existing project**.
3. Escolha **Deploy with GitHub** e autorize o Netlify a ler seus repositórios
   (se ele pedir, use **Only select repositories** e marque só o `AchadosPatto2`).
4. Na lista, selecione o repositório **`AchadosPatto2`**.
5. Confira as configurações de build — o `netlify.toml` já preenche tudo:
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   Não precisa mexer em nada aqui.
6. Clique em **Deploy site**.
7. Espere o build terminar (primeira vez: 1–3 min). A URL sai como
   `https://<nome-aleatorio>.netlify.app`.
8. Recomendado: **Site configuration** → **Change site name** pra deixar a URL
   legível (ex.: `galpao-do-patto.netlify.app` — o nome do site no Netlify é
   independente do nome do repositório).
9. Abra a URL **no celular** — é de lá que vem o público. Esse é o teste de aceite
   de toda parte do roadmap.

A partir daqui: `git push` → o Netlify builda e publica. PR → preview próprio.

---

## Git

O remote `origin` já está apontado pra `https://github.com/digipatto/AchadosPatto2.git`
e a branch `main` já rastreia `origin/main`. O dia a dia é só:

```bash
git add -A
git commit -m "Parte N: ..."
git push
```

Se algum dia quiser mover pra outro repositório, **não** use `git remote add`
(ele recusa porque `origin` já existe) — troque a URL:

```bash
git remote set-url origin https://github.com/digipatto/<OUTRO-REPO>.git
git push -u origin main
```

---

## Stack

| Peça | O quê |
| --- | --- |
| [Astro](https://astro.build) | base do site, rotas e endpoints |
| [React 18](https://react.dev) + `@astrojs/react` | a ilha 3D (`client:only="react"`) |
| [R3F](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) + three | motor 3D |
| [Tailwind CSS v4](https://tailwindcss.com) | interface 2D (plugin do Vite) |
| [Zod](https://zod.dev) | valida `ofertas.json` no build |
| `@astrojs/netlify` | deploy |

Versões são **exatas** no `package.json` — sem `^`, sem `~`.
