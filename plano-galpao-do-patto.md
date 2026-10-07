> ⚠️ **DOCUMENTO SUPERADO — 07/10/2026.**
> Este plano descreve um site-jogo 3D (galpão isométrico em React Three Fiber).
> Essa direção foi abandonada: com placeholders a cena parecia um diagrama, não
> um jogo, e o 3D atrapalhava o que importa — achar o produto e pegar o link.
> O produto virou um site simples: vitrine de achados + blog.
> **A fonte de verdade agora é o `CLAUDE.md`** (= `AGENTS.md`).
> Guardo este arquivo como registro do raciocínio; o código 3D está no
> histórico do git, nos commits até `c3ecde9`.

---

# O Galpão do Patto — Plano Mestre

> **Produto:** um site-jogo. Um **mundo único** 3D — um galpão logístico futurista onde o Patto (pato de terno) toca a operação. Cada link de afiliado gerado vira **mais um item no galpão**. O armazém cresce conforme você posta.
> **Princípio inquebrável:** o mundo é **movido por dados**. Gerou link → nasce um item no galpão, sozinho. Ninguém edita 3D pra adicionar produto.
> **Ritmo:** uma parte de cada vez. Constrói → testa no celular → aprova → próxima.
> **Meta deste documento:** ser detalhado o bastante pra guiar o Antigravity sem ambiguidade e sem retrabalho.

---

## 1. Conceito

O Patto é o gerente de um **centro de distribuição do futuro**. O visitante entra no galpão, circula entre as estações (recebimento, prateleiras, esteira, expedição/vitrine) e, ao chegar num produto, abre o card e **pega o link de afiliado**. Conforme você gera links, o galpão **ganha novos corredores e prateleiras** — a sensação é de uma operação que não para de crescer.

Por que esse tema funciona:
- Casa com o Mercado Livre (logística, caixas, esteira, robôs) sem copiar a marca deles.
- Casa com o personagem (o Patto executivo que você já tem).
- Dá uma metáfora natural pra um catálogo que cresce: **estoque de achados**.
- Tem "vida de pato": patos, poças, pegadas, detalhes de humor no cenário.

---

## 2. Direção de arte

**Estilo:** 3D **stylized low-poly**, "futurista aconchegante" — formas limpas e arredondadas, sombras suaves, luz quente de destaque + preenchimento frio. Nada fotorrealista no cenário (pesa e envelhece).

**Paleta (ambiente):**
- Base/estrutura: **azul-noite/grafite** (`#15203C`, `#0F1320`) — piso, paredes, metal.
- Destaque/energia: **amarelo-âmbar** (`#FFC400` / `#FF9F0A`) — sinalização, holdogramas, luz de acento (herança ML).
- Ação/oferta: **vermelho** (`#E03131`) — só em CTA, etiqueta de desconto, a gravata do Patto.
- Futurista/UI: **ciano/teal** suave pra hologramas e linhas-guia do piso.
- Superfícies/claros: branco-creme pra vidro, luz e cards.

**Luz:** 1 luz direcional (sombra), 1 hemisférica/ambiente, e **emissivos** pontuais (letreiros, hologramas, fitas de LED no teto). Clima: limpo, um leve brilho "neon suave".

**Mascote (o Patto):** pato de **terno azul-marinho, gravata e lenço vermelhos, pés/bico laranja, cabeça marrom/branca** (conforme suas referências). Papel no jogo: fica na **expedição/balcão** como anfitrião, com animação de idle; aparece também em loading e estados vazios. *(Produção do modelo 3D é uma trilha à parte — ver Seção 10.)*

**Detalhes "vida de pato" (humor do cenário):** poça com reflexo, pegadas de pato no piso, placas trocadas ("Sai pato, entra pato"), uma rubber-duck de verdade numa prateleira, etc. Entram aos poucos.

---

## 3. Critérios de sucesso (a régua de toda decisão)
1. **Cresce sozinho** — adicionar oferta nunca toca no 3D, só nos dados.
2. **Rápido no celular** — é de onde vem o público do Instagram.
3. **Achar e pegar o link fácil** — o jogo nunca atrapalha a comissão (sempre tem caminho curto pro link).
4. **Dá vontade de voltar** — explorar é gostoso e o mundo muda.

---

## 4. Arquitetura técnica

**Stack (decidida):**
- **Astro** como base do site (estático, rápido, hospeda rotas e endpoints).
- **React Three Fiber (R3F) + drei** como motor 3D, dentro de **uma ilha React** (`client:only="react"`).
- **three.js** por baixo (R3F é a camada declarativa — mais fácil de manter e crescer que three puro).
- **Tailwind** (ou CSS com tokens) para a interface 2D (cards, botões, HUD).
- **Zod** para validar os dados no build.
- **@astrojs/netlify** para deploy.

**Por quê essa stack (e não three puro):** o mundo vai crescer (muitos objetos, loaders de modelo, câmera, instancing). R3F + drei entrega câmera, controles, carregamento de modelo, instancing e pós-processamento prontos e testados — menos código artesanal = **menos erro**. Astro dá de graça o `/go` (link de afiliado), metadados de compartilhamento e o caminho pro blog/SEO no futuro, sem reescrever o 3D.

**Regra anti-erro da ilha 3D:** o `<Canvas>` roda **só no cliente** (`client:only="react"`), nunca no servidor (WebGL não existe no SSR). Todo o resto da página é estático.

**Estrutura de pastas (proposta):**
```
src/
  data/
    ofertas.json          # FONTE ÚNICA DA VERDADE (começa com 1 item)
  lib/
    schema.ts             # Zod: valida cada oferta no build
    layout.ts             # posição determinística no galpão (índice -> x,z)
    ofertas.ts            # carrega + valida + deriva (desconto, slug)
  three/
    Mundo.tsx             # <Canvas>, câmera, luz, controles
    Galpao.tsx            # ambiente modular (piso, prateleiras, paredes, esteira)
    Produto.tsx           # 1 item no mundo (instanciado)
    Patto.tsx             # personagem (placeholder no v0)
    hooks/                # useRaycastSelect, useIsLowPower, etc.
  components/
    CardProduto.tsx       # overlay 2D ao tocar
    ModoLista.tsx         # fallback acessível (lista de ofertas)
    HUD.tsx               # busca/botões por cima da cena
  pages/
    index.astro           # monta a ilha do Mundo + HUD
    go/[id].ts            # redirect 302 -> linkAfiliado (rastreável)
    p/[id].astro          # (futuro) deep-link + OG por produto
  styles/tokens.css
public/
  models/                 # .glb do galpão, produto, Patto (Draco/KTX2)
```

---

## 5. Arquitetura de dados

**Fonte única:** `src/data/ofertas.json`. Começa com **1 item**.

**Schema de uma oferta (Zod valida no build — se faltar campo, o build falha com mensagem clara):**
```
id            string, único, slug legível (ex.: "fone-qcy-anc")
titulo        string
preco         number
precoDe       number, opcional (gera % desconto)
nicho         enum (eletronicos|casa|beleza|informatica|ferramentas|automotivo|pet|fitness|curiosos)
loja          string, opcional
full          boolean, opcional
linkAfiliado  url (o SEU link do ML)
img           string, opcional (URL ou arquivo)
criadoEm      date (define a ORDEM no mundo)
```
Derivados (calculados, não digitados): `desconto`, `slug`.

**Posição no mundo único (determinística):** uma função `layout(index)` transforma a **ordem de criação** em uma vaga fixa do galpão (ex.: corredor = `floor(index / vagasPorCorredor)`, vaga = `index % vagasPorCorredor`). Resultado:
- Mesma lista → mesmo mapa (nunca embaralha).
- Produto novo entra **na próxima vaga livre**; o galpão só **cresce na borda** (novo corredor quando o atual enche).
- `nicho` **não divide o mundo** (é mundo único) — ele serve pra **cor da etiqueta/sinalização e filtro de busca**, não pra separar mapas.

---

## 6. Arquitetura da cena 3D

- **Câmera:** ortográfica isométrica (visão de maquete). Sem rotação livre (clareza no celular); **arrastar = mover**, **pinça/scroll = zoom**, com limites que acompanham o tamanho do galpão.
- **Ambiente modular (`Galpao.tsx`):** piso com linhas-guia, prateleiras/racks, parede de vidro, fitas de LED no teto, letreiro holográfico com a marca. Tudo em peças reaproveitáveis.
- **Produto (`Produto.tsx`):** um **pacote/caixa** na vaga, com **etiqueta holográfica** de preço flutuando acima. Muitos produtos = **InstancedMesh** (um só draw call pra todas as caixas iguais) — essencial pra escalar.
- **Interação:** `raycaster` no toque/clique → seleciona o produto → abre o **CardProduto** (HTML por cima): título, preço, % desconto, selo Full, botão **"Pegar oferta"**.
- **Patto (`Patto.tsx`):** parado na expedição com idle. No v0 é **placeholder** (ver Seção 10).
- **Vida ambiente (futuro):** AGVs/robôs andando nas linhas, esteira girando, caixas descendo.

---

## 7. Performance & mobile (regras concretas, não negociáveis)
- `frameloop="demand"` — só renderiza quando algo muda (economiza bateria).
- `dpr` limitado a **[1, 2]**; sombras baratas (1 luz com sombra, mapa pequeno).
- **InstancedMesh** para prateleiras e caixas repetidas.
- Modelos em **.glb com Draco**; texturas em **KTX2**; nada de PNG gigante.
- Orçamento inicial: **≤ 2–3 MB** de assets no primeiro load; **30+ fps** em celular mediano.
- **Detecção de aparelho fraco / sem WebGL** → cai no **Modo Lista** automaticamente.
- Respeitar `prefers-reduced-motion` (corta animações ambientes).

---

## 8. Camada de links & rede de segurança
- **`/go/[id]`** → redirect **302** pro `linkAfiliado`. É o único caminho pro ML. Benefícios: trocar destino sem reeditar post + contar clique (futuro). **Nunca** expor o link cru na cena.
- **Modo Lista (`ModoLista.tsx`):** botão "Ver em lista" sempre visível + **fallback automático** quando não há WebGL. Lista acessível com os mesmos botões `/go`. Garante a comissão em qualquer aparelho.
- **(Futuro) `/p/[id]`:** deep-link que abre o mundo já focado no produto + metadados de compartilhamento (preview bonito no Insta/WhatsApp).

---

## 9. Pipeline & operação
- **Antigravity** escreve o código → **push no GitHub** → **Netlify** publica sozinho. PR gera **preview** antes de ir pro ar.
- **Build valida** `ofertas.json` (Zod). Dado inválido = build falha com erro claro (anti-erro).
- **Adicionar oferta** = uma entrada em `ofertas.json` → commit → deploy. (Depois, a skill `novo-post`/agente de ofertas faz isso sozinho.)

---

## 10. Trilha de assets 3D (paralela ao código) — leitura honesta

Modelos necessários: **kit do galpão** (piso, prateleira, parede de vidro, esteira, luz, letreiro), **caixa/pacote**, **pallet**, **AGV/robô**, e **o Patto**.

De onde vêm:
- Kit de galpão/sci-fi: packs **CC0** (Kenney, Quaternius, Poly Pizza) adaptados — rápido e grátis.
- Caixa/pallet/props: modelagem simples em Blender ou CC0.
- **O Patto é o asset difícil.** Um modelo 3D riggado e animado do personagem é trabalho dedicado (modelagem + rig + animação em Blender, ou geração via ferramenta de 3D por IA tipo Meshy/Luma a partir das suas referências, depois ajuste).
  - **v0:** placeholder — um **billboard** (recorte 2D da sua arte que sempre encara a câmera) ou um proxy low-poly. Já dá presença sem travar o cronograma.
  - **depois:** modelo 3D próprio, com idle e um gesto.

**O que eu (aqui) consigo e não consigo:** eu escrevo todo o **código**, a **cena**, os **dados**, o **plano** e monto a cena com **primitivos/placeholders**. Eu **não gero** os modelos 3D finais nem a arte do Patto — isso vem do Blender / packs CC0 / ferramenta de 3D por IA. O plano é feito pra funcionar **com placeholder primeiro** e trocar pelos assets reais depois, sem retrabalho.

---

## 11. As Partes (roadmap de construção)

> v0 = Partes 0 a 5 (mundo único com **1 produto**, jogável e no ar). Da Parte 6 em diante é o crescimento.

### PARTE 0 — Fundação & deploy
- **Entra:** projeto Astro + React + R3F + drei + Tailwind + adapter Netlify; GitHub; deploy automático. Página no ar (pode estar vazia).
- **Fora de escopo:** qualquer 3D.
- **Pronto quando:** a URL abre e cada push publica sozinho.
- **Cuidado:** fixar versões das libs; confirmar que a ilha React hidrata com `client:only`.

### PARTE 1 — Canvas & câmera (mundo vazio)
- **Entra:** `<Canvas>` em tela cheia, câmera isométrica, luz básica, controles arrastar/zoom com limites, cor de fundo da marca, `frameloop="demand"`, `dpr` limitado.
- **Pronto quando:** dá pra navegar um "nada" liso no celular e no PC, sem engasgo.

### PARTE 2 — Kit do galpão (ambiente estático, bonito)
- **Entra:** piso com linhas-guia, algumas prateleiras, parede de vidro, luz de teto, 1 letreiro holográfico com a marca. Tudo estático e modular.
- **Pronto quando:** bate o olho e já **parece um galpão futurista**, mesmo vazio.
- **Cuidado:** InstancedMesh desde já nas peças repetidas; orçamento de assets.

### PARTE 3 — Primeiro produto vindo dos dados
- **Entra:** `ofertas.json` com 1 item → `layout()` calcula a vaga → aparece **1 caixa** com etiqueta holográfica. Tocar → **CardProduto** (título, preço, desconto, Full).
- **Pronto quando:** o produto aparece e o card abre ao tocar. **Aqui nasce o "cresce sozinho".**
- **Cuidado:** a função que desenha 1 produto é a mesma que vai desenhar N (não hardcodar 1).

### PARTE 4 — Link de afiliado + rede de segurança
- **Entra:** rota `/go/[id]` (302 pro ML); botão do card aponta pra ela. **Modo Lista** + fallback automático sem WebGL.
- **Pronto quando:** "Pegar oferta" leva ao ML pelo seu link, e dá pra pegar o link mesmo sem 3D.

### PARTE 5 — Patto na cena + acabamento de clima
- **Entra:** Patto **placeholder** (billboard/low-poly) na expedição; ajuste fino de luz, sombras e emissivos pra dar o "clima".
- **Pronto quando:** parece um comecinho de jogo caprichado, com o Patto presente.

### PARTE 6+ — Crescimento (cada uma na sua vez)
6. **Posicionamento automático de N produtos** + câmera que expande com o galpão.
7. **Esteira de novidades** — produtos novos entram na esteira antes de ir pra prateleira (traz o "cards passando").
8. **Busca + câmera voa até o produto**; filtro por nicho (cor/sinalização).
9. **Vida ambiente** — AGVs/robôs, esteira girando, detalhes "vida de pato".
10. **`/p/[id]` + OG dinâmica** — deep-link e preview bonito no Insta/WhatsApp.
11. **Modelo 3D final do Patto** (troca o placeholder) + animações.
12. **Blog/SEO** como camada 2D separada (tráfego do Google).
13. **Contagem de cliques** no `/go` + painel simples.
14. **Agente de ofertas** escreve no `ofertas.json` sozinho (automação total).
15. **Som/ambiência** e **modo "dirigir"** no desktop (bônus).

---

## 12. Riscos & como evitamos erro (checklist vivo)
- [ ] Ilha 3D só no cliente (`client:only`) — WebGL nunca no SSR.
- [ ] Fallback sem WebGL/low-power testado em celular real.
- [ ] Orçamento de performance respeitado (dpr, instancing, demand, Draco/KTX2).
- [ ] `ofertas.json` validado por Zod no build (dado ruim = build falha com mensagem).
- [ ] Posicionamento determinístico (mesma lista → mesmo mapa).
- [ ] Link cru nunca na cena — sempre `/go/[id]`.
- [ ] Cena 100% desacoplada dos dados (3D nunca hardcoda produto).
- [ ] Versões de libs fixadas; preview por PR antes de mesclar.
- [ ] Placeholder-first: nada do cronograma depende do modelo final do Patto.

---

## 13. Definition of Done do v0
- [ ] Site no ar no Netlify.
- [ ] Mundo único "galpão futurista" navegável no **celular**.
- [ ] **1 produto** aparece como caixa no galpão.
- [ ] Tocar → card → **link de afiliado** abre (via `/go`).
- [ ] Modo Lista / fallback funcionando.
- [ ] Patto presente (placeholder).
- [ ] Adicionar o 2º produto = **uma linha** no `ofertas.json`, sem tocar no 3D.

---

## 14. Decisões travadas
- **Mundo único** (galpão logístico futurista), **não** bairros por nicho.
- Tema "vida de pato" + Mercado Livre, personagem = Patto executivo.
- Stack: **Astro + R3F/drei (ilha client-only) + Netlify**.
- Dados: **uma lista**, posição **determinística**, `nicho` = metadado (cor/filtro).
- Links: sempre **`/go/[id]`**; sempre existe **Modo Lista**.
- Assets: **placeholder-first**; Patto 3D final vem como trilha paralela.
- Construção **parte por parte**, com aprovação a cada peça.
