/**
 * Garimpo no corredor: o jogo da página /jogo.
 *
 * Um corredor de galpão em perspectiva (canvas 2D, sem biblioteca). Cada oferta
 * é uma caixa fechada. Deslize pra caminhar, toque na caixa pra abrir: a foto
 * do produto sobe e o card com o botão aparece embaixo. O placar conta as
 * caixas abertas (guardado no aparelho). Sem ranking, sem servidor, sem dado
 * de ninguém.
 *
 * Só desenha enquanto algo se move: parado, não gasta bateria.
 */

type Item = { id: string; titulo: string; img?: string; quiz?: string };

const CHAVE = 'patto-garimpo-v1';
const PASSO = 2.4; // distância entre caixas (em unidades do corredor)
const FOCO = 1.7; // distância da caixa em foco
const CAM = 1.0; // altura da câmera
const LADO = 0.55; // centro das caixas, à esquerda/direita
const CAIXA = 0.8; // aresta da caixa
const PAREDE = 1.6;
const LONGE = 18;

document.documentElement.classList.add('js');

const dadosEl = document.getElementById('dados');
const canvasEl = document.getElementById('corredor') as HTMLCanvasElement | null;
const ctxEl = canvasEl?.getContext('2d') ?? null;

if (dadosEl && canvasEl && ctxEl) iniciar(JSON.parse(dadosEl.textContent || '[]') as Item[], canvasEl, ctxEl);

function iniciar(itens: Item[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const n = itens.length;
  if (n === 0) return;

  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const cor = (nome: string) => css.getPropertyValue(nome).trim();
  const C = {
    fundo: cor('--fundo'),
    fundo2: cor('--p-tinta-900'),
    trilho: cor('--p-tinta-600'),
    vao: cor('--p-tinta-700'),
    montante: cor('--p-terno'),
    ambar: cor('--p-bico'),
    led: cor('--p-holo'),
    papelao: cor('--p-papelao'),
    papelaoEscuro: cor('--p-papelao-escuro'),
    fita: cor('--p-camisa-suave'),
    fitaQuiz: cor('--p-gravata'),
    foto: cor('--foto-fundo'),
    marca: cor('--marca'),
    texto: cor('--texto'),
    dentro: cor('--p-tinta-950'),
  };

  // ---------- estado
  const abertas = new Set<string>();
  try {
    for (const id of JSON.parse(localStorage.getItem(CHAVE) || '[]')) abertas.add(id);
  } catch {
    /* sem armazenamento: o placar vale só nesta visita */
  }
  const salvar = () => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify([...abertas]));
    } catch {
      /* ignora */
    }
  };

  let p = 0; // posição atual (índice fracionário)
  let alvo = 0;
  const anim: number[] = itens.map((it) => (abertas.has(it.id) ? 1 : 0)); // 0 fechada .. 1 aberta
  const animInicio: (number | null)[] = itens.map(() => null);
  let focoAtual = -1;

  const imagens = new Map<string, HTMLImageElement>();
  function imagem(it: Item) {
    if (!it.img) return null;
    let im = imagens.get(it.id);
    if (!im) {
      im = new Image();
      im.decoding = 'async';
      im.onload = () => pedirQuadro();
      im.src = it.img;
      imagens.set(it.id, im);
    }
    return im.complete && im.naturalWidth ? im : null;
  }

  // ---------- elementos da página
  const painelCards = [...document.querySelectorAll<HTMLElement>('.lista [data-id]')];
  const dica = document.getElementById('dica')!;
  const fim = document.getElementById('fim');
  const contador = document.getElementById('abertas')!;
  const btnAnt = document.getElementById('ant') as HTMLButtonElement;
  const btnProx = document.getElementById('prox') as HTMLButtonElement;

  function atualizarPainel() {
    const i = Math.round(p);
    const it = itens[i];
    const aberta = abertas.has(it.id);
    for (const c of painelCards) c.hidden = !(aberta && c.dataset.id === it.id);
    dica.hidden = aberta;
    dica.textContent =
      abertas.size === 0 && i === 0
        ? 'Deslize pra cima pra caminhar. Toque na caixa pra abrir.'
        : 'Toque na caixa pra ver o que tem dentro.';
    if (fim) fim.hidden = abertas.size < n;
    contador.textContent = String(abertas.size);
    btnAnt.disabled = i <= 0;
    btnProx.disabled = i >= n - 1;
    focoAtual = i;
    canvas.setAttribute('aria-label', `Caixa ${i + 1} de ${n}: ${aberta ? it.titulo : 'fechada'}`);
  }

  // ---------- tela
  let W = 0;
  let H = 0;
  let f = 1;
  let hy = 0;
  let cx = 0;
  function medir() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    f = Math.min(W * 0.8, H * 0.7);
    cx = W / 2;
    hy = H * 0.4;
    pedirQuadro();
  }

  const X = (x: number, d: number) => cx + (x * f) / d;
  const Y = (y: number, d: number) => hy + ((CAM - y) * f) / d;
  const dist = (i: number) => (i - p) * PASSO + FOCO;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  function poligono(pts: [number, number][], cor: string, alfa = 1) {
    ctx.globalAlpha = alfa;
    ctx.fillStyle = cor;
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function linha(x1: number, y1: number, x2: number, y2: number, cor: string, larg: number, alfa = 1) {
    ctx.globalAlpha = alfa;
    ctx.strokeStyle = cor;
    ctx.lineWidth = larg;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- cenário
  function cenario() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.fundo);
    g.addColorStop(clamp(hy / H, 0, 1), C.fundo2);
    g.addColorStop(1, C.fundo);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const perto = 0.4;
    // trilhos das estantes, nas duas paredes
    for (const lado of [-1, 1]) {
      for (const alt of [0.15, 0.85, 1.55, 2.25]) {
        linha(X(lado * PAREDE, perto), Y(alt, perto), X(lado * PAREDE, LONGE), Y(alt, LONGE), C.trilho, 1.5, 0.9);
      }
    }
    // faixas âmbar do piso e fita de LED no teto
    for (const lado of [-1, 1]) {
      linha(X(lado * 1.15, perto), Y(0, perto), X(lado * 1.15, LONGE), Y(0, LONGE), C.ambar, 2, 0.4);
      linha(X(lado * 0.3, perto), Y(2.6, perto), X(lado * 0.3, LONGE), Y(2.6, LONGE), C.led, 2, 0.55);
    }
    // montantes e volumes nas prateleiras: andam com o corredor
    const base = Math.floor(p) - 1;
    for (let j = base + Math.ceil(LONGE / PASSO) + 2; j >= base; j--) {
      const d = dist(j) - PASSO / 2;
      if (d < perto || d > LONGE) continue;
      const a = clamp(1 - (d - 6) / 12, 0, 1);
      for (const lado of [-1, 1]) {
        const x = X(lado * PAREDE, d);
        linha(x, Y(0.15, d), x, Y(2.25, d), C.montante, Math.max(1, 5 / d), a * 0.9);
        [0.15, 0.85, 1.55].forEach((alt, k) => {
          const t = (((j * 7 + k * 3 + (lado > 0 ? 5 : 0)) % 5) + 5) % 5;
          if (t < 2) return;
          const larg = 0.5 + (t % 2) * 0.25;
          const x0 = lado * (PAREDE - 0.02);
          const x1 = lado * (PAREDE - larg);
          const dd = d + 0.5;
          poligono(
            [
              [X(x0, dd), Y(alt, dd)],
              [X(x1, dd), Y(alt, dd)],
              [X(x1, dd), Y(alt + 0.5, dd)],
              [X(x0, dd), Y(alt + 0.5, dd)],
            ],
            C.vao,
            a * 0.9,
          );
        });
      }
    }
  }

  // ---------- caixas
  type Retangulo = { x: number; y: number; w: number; h: number };
  let alvos: (Retangulo | null)[] = [];

  function caixa(i: number) {
    const d = dist(i);
    if (d < 0.3 || d > LONGE) return;
    const it = itens[i];
    const t = anim[i];
    const alfa = clamp(1 - (d - 6) / 11, 0, 1);
    const xc = i % 2 === 0 ? -LADO : LADO;
    const x0 = xc - CAIXA / 2;
    const x1 = xc + CAIXA / 2;
    const d2 = d + CAIXA;
    const emFoco = i === Math.round(p) && Math.abs(i - p) < 0.35;
    const fita = it.quiz ? C.fitaQuiz : C.fita;

    const fr: Retangulo = {
      x: X(x0, d),
      y: Y(CAIXA, d),
      w: X(x1, d) - X(x0, d),
      h: Y(0, d) - Y(CAIXA, d),
    };
    alvos[i] = fr;

    // face lateral (a que olha pro centro do corredor)
    const lx = xc < 0 ? x1 : x0;
    poligono(
      [
        [X(lx, d), Y(0, d)],
        [X(lx, d2), Y(0, d2)],
        [X(lx, d2), Y(CAIXA, d2)],
        [X(lx, d), Y(CAIXA, d)],
      ],
      C.papelaoEscuro,
      alfa,
    );

    // interior (aparece quando a tampa sobe)
    const topo: [number, number][] = [
      [X(x0, d), Y(CAIXA, d)],
      [X(x1, d), Y(CAIXA, d)],
      [X(x1, d2), Y(CAIXA, d2)],
      [X(x0, d2), Y(CAIXA, d2)],
    ];
    if (t > 0) poligono(topo, C.dentro, alfa);

    // foto do produto subindo da caixa
    if (t > 0) {
      const e = 1 - Math.pow(1 - t, 3);
      const tam = CAIXA * 1.1;
      const dm = d + CAIXA / 2;
      const subida = CAIXA * (0.35 + e * 0.6); // sai de dentro da caixa e para com o pé escondido
      const px = X(xc - tam / 2, dm);
      const pw = X(xc + tam / 2, dm) - px;
      const py = Y(subida + tam, dm);
      ctx.save();
      ctx.globalAlpha = alfa * e;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, pw, Math.max(4, pw * 0.08));
      ctx.fillStyle = C.foto;
      ctx.fill();
      const im = imagem(it);
      if (im) {
        ctx.clip();
        ctx.globalCompositeOperation = 'multiply';
        const m = pw * 0.08;
        const esc = Math.min((pw - 2 * m) / im.naturalWidth, (pw - 2 * m) / im.naturalHeight);
        const iw = im.naturalWidth * esc;
        const ih = im.naturalHeight * esc;
        ctx.drawImage(im, px + (pw - iw) / 2, py + (pw - ih) / 2, iw, ih);
      }
      ctx.restore();
    }

    // frente (com a fita): cobre o pé da foto
    const corte = 0;
    ctx.globalAlpha = alfa;
    ctx.fillStyle = C.papelao;
    ctx.fillRect(fr.x, fr.y + fr.h * corte, fr.w, fr.h * (1 - corte));
    ctx.fillStyle = fita;
    ctx.globalAlpha = alfa * 0.85;
    ctx.fillRect(fr.x + fr.w * 0.42, fr.y + fr.h * corte, fr.w * 0.16, fr.h * (1 - corte));
    ctx.globalAlpha = 1;

    // tampa: sobe e some quando abre
    poligono(
      topo.map(([x, y]) => [x, y - t * 0.9 * fr.h] as [number, number]),
      C.papelao,
      alfa * (1 - t),
    );

    // "?" nas fechadas
    if (t < 0.5) {
      ctx.globalAlpha = alfa * (1 - t * 2);
      ctx.fillStyle = C.texto;
      ctx.font = `700 ${Math.round(fr.h * 0.42)}px "Clash Display", "Satoshi", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', fr.x + fr.w * 0.25, fr.y + fr.h * 0.52);
      ctx.globalAlpha = 1;
    }

    if (emFoco && t < 1) {
      ctx.globalAlpha = alfa;
      ctx.strokeStyle = C.marca;
      ctx.lineWidth = 3;
      ctx.strokeRect(fr.x - 3, fr.y - 3, fr.w + 6, fr.h + 6);
      ctx.globalAlpha = 1;
    }
  }

  function desenhar() {
    alvos = new Array(n).fill(null);
    cenario();
    const ultimoVisivel = Math.min(n - 1, Math.ceil(p + (LONGE - FOCO) / PASSO));
    for (let i = ultimoVisivel; i >= Math.max(0, Math.floor(p) - 1); i--) caixa(i);
  }

  // ---------- laço: só roda enquanto algo se move
  let rodando = false;
  let ultimo = 0;
  function quadro(agora: number) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000 || 0.016);
    ultimo = agora;
    let mexeu = false;

    if (Math.abs(alvo - p) > 0.0008) {
      p = reduzido ? alvo : p + (alvo - p) * (1 - Math.exp(-dt * 11));
      if (Math.abs(alvo - p) <= 0.0008) p = alvo;
      mexeu = true;
      if (Math.round(p) !== focoAtual) atualizarPainel();
    }
    for (let i = 0; i < n; i++) {
      const ini = animInicio[i];
      if (ini === null) continue;
      const k = reduzido ? 1 : clamp((agora - ini) / 520, 0, 1);
      anim[i] = k;
      if (k >= 1) animInicio[i] = null;
      mexeu = true;
    }

    desenhar();
    rodando = mexeu;
    if (mexeu) requestAnimationFrame(quadro);
  }
  function pedirQuadro() {
    if (rodando) return;
    rodando = true;
    ultimo = performance.now();
    requestAnimationFrame(quadro);
  }

  // ---------- controles
  function ir(i: number) {
    alvo = clamp(Math.round(i), 0, n - 1);
    pedirQuadro();
  }

  function abrir(i: number) {
    const it = itens[i];
    if (abertas.has(it.id)) return;
    abertas.add(it.id);
    salvar();
    animInicio[i] = performance.now();
    atualizarPainel();
    pedirQuadro();
  }

  let arrasto: { y: number; p0: number; movido: boolean } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    arrasto = { y: e.clientY, p0: alvo, movido: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrasto) return;
    const dy = arrasto.y - e.clientY;
    if (Math.abs(dy) > 8) arrasto.movido = true;
    if (arrasto.movido) {
      alvo = clamp(arrasto.p0 + dy / (H * 0.28), 0, n - 1);
      pedirQuadro();
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!arrasto) return;
    const a = arrasto;
    arrasto = null;
    if (a.movido) {
      ir(alvo);
      return;
    }
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    for (let i = 0; i < n; i++) {
      const b = alvos[i];
      if (b && x >= b.x && x <= b.x + b.w && y >= b.y - b.h * 0.3 && y <= b.y + b.h) {
        if (i === Math.round(p)) abrir(i);
        else ir(i);
        return;
      }
    }
  });
  canvas.addEventListener('pointercancel', () => {
    arrasto = null;
    ir(alvo);
  });

  let timerRoda = 0;
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      alvo = clamp(alvo + Math.sign(e.deltaY) * 0.5, 0, n - 1);
      clearTimeout(timerRoda);
      timerRoda = window.setTimeout(() => ir(alvo), 140);
      pedirQuadro();
    },
    { passive: false },
  );

  canvas.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowRight' || k === 'PageDown') ir(Math.round(p) + 1);
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === 'PageUp') ir(Math.round(p) - 1);
    else if (k === 'Enter' || k === ' ') abrir(Math.round(p));
    else return;
    e.preventDefault();
  });
  btnAnt.addEventListener('click', () => ir(Math.round(p) - 1));
  btnProx.addEventListener('click', () => ir(Math.round(p) + 1));

  new ResizeObserver(medir).observe(canvas);
  medir();
  atualizarPainel();
  // as fontes e as fotos chegam depois: redesenha quando prontas
  document.fonts?.ready.then(pedirQuadro);
}
