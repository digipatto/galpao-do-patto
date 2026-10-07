# O Galpão do Patto — convenções do projeto

> Fonte de verdade da arquitetura: `plano-galpao-do-patto.md` na raiz.
> Este arquivo é o resumo operacional — as regras que não se quebram.
> `CLAUDE.md` e `AGENTS.md` têm o MESMO conteúdo: editou um, replique no outro.

## O que é
Site-jogo 3D: um **mundo único** (galpão logístico futurista) de links de afiliado
do Mercado Livre. Cada oferta nova vira mais um item no galpão. O armazém cresce
conforme as ofertas entram.

## Regras inquebráveis

1. **Mundo único, 100% data-driven.** A cena 3D **nunca** hardcoda produto.
   Tudo vem de `src/data/ofertas.json`. Adicionar oferta = editar dados, nunca o 3D.

2. **A ilha 3D roda só no cliente.** O `<Canvas>` do R3F é montado com
   `client:only="react"`. WebGL **nunca** no SSR.

3. **Link de afiliado só via `/go/[id]`.** Nunca expor o link cru na UI nem na cena.

4. **Sempre existe um Modo Lista.** Fallback acessível, sem WebGL, com os mesmos
   botões `/go`. A comissão não depende do 3D funcionar.

5. **Performance mobile-first.** `frameloop="demand"`, `dpr={[1, 2]}`,
   `InstancedMesh` nas peças repetidas, modelos `.glb` com Draco, texturas KTX2.
   Orçamento: ≤ 2–3 MB no primeiro load, 30+ fps em celular mediano.

6. **Posição no mundo é determinística.** Ordem de criação → vaga fixa
   (`layout(index)`). Mesma lista → mesmo mapa. O galpão só **cresce na borda**:
   produto novo entra na próxima vaga livre, abre corredor novo quando enche.

7. **`nicho` é metadado, não divide o mundo.** Serve pra cor de etiqueta/sinalização
   e filtro de busca. Mundo único, sempre.

8. **Construir parte por parte.** Não antecipar escopo futuro. Cada parte entrega,
   testa no celular, aprova, e só então vem a próxima.

9. **Tokens de cor só em `src/styles/tokens.css`.** Nenhum hex de marca espalhado
   em componente, página ou material 3D.

10. **O galpão é escuro, sempre.** Não seguir `prefers-color-scheme`: o mundo 3D é
    noturno e uma moldura clara briga com a cena. O tema claro existe nos tokens,
    mas só liga por opt-in (`<html data-tema="claro">`), pensando no Modo Lista.

## Mapa de pastas

```
src/
  data/ofertas.json     # FONTE ÚNICA DA VERDADE
  lib/schema.ts         # Zod: valida cada oferta no build
  lib/layout.ts         # índice -> vaga determinística no galpão
  lib/ofertas.ts        # carrega + valida + deriva (desconto, slug)
  three/Mundo.tsx       # <Canvas>, câmera, luz, controles
  three/Galpao.tsx      # ambiente modular (piso, prateleiras, esteira)
  three/Produto.tsx     # 1 item no mundo (instanciado)
  three/Patto.tsx       # personagem (placeholder no v0)
  components/CardProduto.tsx  # overlay 2D ao tocar
  components/ModoLista.tsx    # fallback sem WebGL
  components/HUD.tsx          # busca/botões sobre a cena
  pages/index.astro     # monta a ilha do Mundo + HUD
  pages/go/[id].ts      # redirect 302 -> linkAfiliado
  styles/tokens.css     # tokens de cor e tipografia
public/models/          # .glb (Draco/KTX2)
```

## Roadmap (onde estamos)

- [x] **Parte 0** — Fundação & deploy (esqueleto, tokens, Netlify)
- [ ] **Parte 1** — Canvas & câmera (mundo vazio)
- [ ] **Parte 2** — Kit do galpão (ambiente estático)
- [ ] **Parte 3** — Primeiro produto vindo dos dados
- [ ] **Parte 4** — `/go/[id]` + Modo Lista
- [ ] **Parte 5** — Patto na cena + acabamento de clima
- [ ] **Parte 6+** — Crescimento (ver plano, seção 11)

## Stack
Astro + TypeScript · React 19 (`@astrojs/react`) · React Three Fiber + drei + three ·
Tailwind CSS v4 (plugin Vite) · Zod · adapter `@astrojs/netlify` · npm.
**Versões são fixadas (exatas) no `package.json`** — não usar `^` nem `~`.

## Paleta
azul-noite `#15203C` / `#0F1320` · âmbar `#FFC400` / `#FF9F0A` ·
vermelho CTA `#E03131` · ciano holográfico `#3FE0D0` · creme `#FBF8F1` · neutros grafite.
Display: **Clash Display** (fallback Space Grotesk) · Corpo: **Inter**.
