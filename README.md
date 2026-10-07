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

1. Garanta que o repositório está no GitHub (veja a seção abaixo se ainda não estiver).
2. Entre em [app.netlify.com](https://app.netlify.com) e faça login
   (dá pra entrar com a conta do GitHub).
3. No painel, clique em **Add new site** → **Import an existing project**.
4. Escolha **Deploy with GitHub** e autorize o Netlify a ler seus repositórios
   (se ele pedir, use **Only select repositories** e marque só o `galpao-do-patto`).
5. Na lista, selecione o repositório **`galpao-do-patto`**.
6. Confira as configurações de build — o `netlify.toml` já preenche tudo:
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   Não precisa mexer em nada aqui.
7. Clique em **Deploy site** (ou **Deploy `galpao-do-patto`**).
8. Espere o build terminar (primeira vez: 1–3 min). A URL sai como
   `https://<nome-aleatorio>.netlify.app`.
9. Opcional, mas recomendado: **Site configuration** → **Change site name** pra deixar
   a URL legível (ex.: `galpao-do-patto.netlify.app`).
10. Abra a URL **no celular** — é de lá que vem o público. Esse é o teste de aceite
    de toda parte do roadmap.

A partir daqui: `git push` → o Netlify builda e publica. PR → preview próprio.

---

## Criar o repositório no GitHub (se ainda não existe)

Com o [GitHub CLI](https://cli.github.com) instalado e autenticado:

```bash
gh repo create galpao-do-patto --private --source=. --remote=origin --push
```

Ou na mão, pela interface: crie um repositório **vazio** chamado
`galpao-do-patto` em [github.com/new](https://github.com/new)
(sem README, sem .gitignore, sem licença) e depois:

```bash
git remote add origin https://github.com/<SEU-USUARIO>/galpao-do-patto.git
git branch -M main
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
