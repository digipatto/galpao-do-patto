/**
 * A esteira: a primeira tela do site. Fileiras de caixas deslizam em esteiras
 * (cada fileira num sentido e numa velocidade). Cada caixa mostra a foto do
 * produto e uma etiqueta de preço. Tocar numa caixa abre o produto.
 *
 * Interação (mínima, pra dar vontade de mexer):
 *  - a esteira que você toca desacelera, pra dar tempo de pegar a caixa;
 *  - arrastar empurra a esteira, e ela segue pela inércia até voltar ao ritmo;
 *  - as caixas se inclinam pro lado em que andam, e balançam de leve;
 *  - tocar numa caixa a "aperta" e abre o produto.
 *
 * O texto e os links de verdade ficam em HTML (lista abaixo da cena): a cena é
 * o palco, não a única via de acesso.
 *
 * Só roda no cliente, carregada sob demanda, e só desenha enquanto o palco está
 * à vista. Cores vêm dos tokens CSS. Three puro, sem framework.
 */
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three';

export interface OfertaCena {
  id: string;
  href: string;
  /** Foto (caminho ou URL). Sem ela, a caixa leva a inicial. */
  img?: string;
  letra: string;
  /** Texto do preço, ex.: "90,12". Vazio/undefined = "Ver preço". */
  preco?: string;
  /** AAAA-MM-DD da última conferência; preço velho vira "Ver preço". */
  conferidoEm?: string;
  /** Dias até o preço conferido ser considerado velho. */
  validade: number;
}

export interface Opcoes {
  ofertas: OfertaCena[];
  /** Quadro parado e determinístico (foto do poster). */
  estatica?: boolean;
  /** Tamanho fixo (poster). Sem isso, segue o tamanho do canvas. */
  tamanho?: { w: number; h: number };
  leve?: boolean;
  /** Elemento observado: a cena só desenha enquanto ele está à vista. */
  palco?: Element | null;
  /** Chamado quando uma caixa é tocada. */
  aoAbrir?: (oferta: OfertaCena) => void;
}

export interface Cena {
  dispose(): void;
}

// ---------- medidas do mundo (unidades arbitrárias) ----------
const LARG = 1.3;
const ALT = 1.0;
const PROF = 0.9;
const ESP = 1.95; // distância entre caixas na mesma esteira
const POR_FILEIRA = 10;
const COMPRIMENTO = ESP * POR_FILEIRA;
const DY = 1.72; // distância entre esteiras
const FILEIRAS = 4;

function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const cor = (nome: string) => new Color(getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || 'gray');
const css = (c: Color) => `#${c.getHexString()}`;
const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

/** Foto de anúncio tem fundo branco: vai sobre tom claro com multiply, como nos cards. */
async function texturaFoto(src: string | undefined, letra: string, fundo: Color, tinta: Color) {
  const w = 520;
  const h = 400;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = css(fundo);
  g.fillRect(0, 0, w, h);
  let desenhou = false;
  if (src) {
    try {
      const img = await carregarImagem(src);
      const r = Math.min((w - 60) / img.width, (h - 60) / img.height);
      const iw = img.width * r;
      const ih = img.height * r;
      g.globalCompositeOperation = 'multiply';
      g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
      g.globalCompositeOperation = 'source-over';
      desenhou = true;
    } catch {
      /* foto indisponível: cai na inicial */
    }
  }
  if (!desenhou) {
    g.fillStyle = css(tinta);
    g.font = '700 220px "Clash Display", "Satoshi", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(letra, w / 2, h / 2 + 10);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A etiqueta: pílula âmbar com furo de barbante e o preço grande. */
function texturaEtiqueta(preco: string | undefined, fundo: Color, tinta: Color) {
  const w = 384;
  const h = 150;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = css(fundo);
  g.beginPath();
  g.roundRect(4, 4, w - 8, h - 8, 34);
  g.fill();
  // furo do barbante
  g.fillStyle = css(tinta);
  g.beginPath();
  g.arc(44, h / 2, 12, 0, Math.PI * 2);
  g.fill();
  g.textBaseline = 'alphabetic';
  g.fillStyle = css(tinta);
  const familia = '"Clash Display", "Satoshi", sans-serif';
  if (preco) {
    g.font = `700 36px ${familia}`;
    g.textAlign = 'left';
    g.fillText('R$', 78, h / 2 + 14);
    g.font = `700 74px ${familia}`;
    g.textAlign = 'right';
    g.fillText(preco, w - 28, h / 2 + 26);
  } else {
    // Satoshi: a Clash fecha o espaço entre palavras em texto pequeno
    g.font = '700 54px "Satoshi", sans-serif';
    g.textAlign = 'center';
    g.fillText('Ver preço', (w + 60) / 2, h / 2 + 19);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const diasDesde = (iso: string) => {
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  return Math.round((Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000);
};

interface Caixa {
  grupo: Group;
  malha: Mesh;
  j: number;
  oferta: OfertaCena;
  fase: number;
  escala: number;
  levanta: number;
  aperto: number; // 0..1 enquanto a caixa é "apertada" antes de abrir
}

interface Fileira {
  y: number;
  z: number;
  dir: 1 | -1;
  velocidade: number; // unidades/s no ritmo normal
  off: number; // deslocamento acumulado (anda com a esteira)
  extra: number; // velocidade extra da inércia do arrasto
  lento: number; // 1 = ritmo normal; <1 = desacelerada porque alguém tocou nela
  arrastando: boolean;
  caixas: Caixa[];
  esteira: Group;
}

export async function montar(canvas: HTMLCanvasElement, opcoes: Opcoes): Promise<Cena> {
  const estatica = !!opcoes.estatica;
  const ofertas = opcoes.ofertas.length ? opcoes.ofertas : [{ id: '', href: '/', letra: 'A', validade: 3 }];
  const leve = opcoes.leve ?? (matchMedia('(pointer: coarse)').matches || innerWidth < 768);
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tinta950 = cor('--p-tinta-950');
  const tinta900 = cor('--p-tinta-900');
  const tinta800 = cor('--p-tinta-800');
  const tinta700 = cor('--p-tinta-700');
  const bico = cor('--p-bico');
  const bicoClaro = cor('--p-bico-claro');
  const terno = cor('--p-terno');
  const ternoClaro = cor('--p-terno-claro');
  const holo = cor('--p-holo');
  const fotoFundo = cor('--foto-fundo');
  const fotoTinta = cor('--foto-tinta');

  try {
    await document.fonts.load('700 48px "Clash Display"');
  } catch {
    /* sem a fonte, cai na do sistema */
  }

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, leve ? 1.5 : 2));
  renderer.setClearColor(tinta950);

  const scene = new Scene();
  scene.background = tinta950;
  scene.fog = new Fog(tinta950, 14, 34);

  const camera = new PerspectiveCamera(40, 0.5, 0.1, 80);

  scene.add(new HemisphereLight(ternoClaro, tinta900, 1.35));
  const sol = new DirectionalLight(new Color('white').lerp(bicoClaro, 0.3), 1.8);
  sol.position.set(3, 9, 8);
  scene.add(sol);

  // ---------- fundo: parede, montantes e uma fita de LED no alto ----------
  const parede = new Mesh(new PlaneGeometry(90, 40), new MeshStandardMaterial({ color: tinta900, roughness: 0.9 }));
  parede.position.set(0, 0, -5.5);
  scene.add(parede);

  const montantes = new InstancedMesh(
    new BoxGeometry(0.12, 40, 0.12),
    new MeshStandardMaterial({ color: terno, roughness: 0.55, metalness: 0.25 }),
    31,
  );
  const m4 = new Matrix4();
  for (let i = 0; i < 31; i++) {
    m4.makeTranslation((i - 15) * 3.2, 0, -5.3);
    montantes.setMatrixAt(i, m4);
  }
  scene.add(montantes);

  const led = new Mesh(new BoxGeometry(60, 0.06, 0.06), new MeshBasicMaterial({ color: holo, fog: false }));
  led.position.set(0, FILEIRAS * DY * 0.5 + 1.6, -5.2);
  scene.add(led);

  // ---------- peças compartilhadas ----------
  const geoCaixa = new BoxGeometry(LARG, ALT, PROF);
  const matPapelao = new MeshStandardMaterial({ color: bico.clone().lerp(tinta900, 0.55), roughness: 0.85 });
  const matTopo = new MeshStandardMaterial({ color: bico.clone().lerp(tinta900, 0.4), roughness: 0.85 });
  const geoFita = new BoxGeometry(0.3, 0.012, PROF + 0.004);
  const matFita = new MeshBasicMaterial({ color: bicoClaro });
  const geoEtiqueta = new PlaneGeometry(0.98, 0.38);
  const geoEsteira = new BoxGeometry(COMPRIMENTO + 12, 0.14, PROF + 0.5);
  const matEsteira = new MeshStandardMaterial({ color: tinta800, roughness: 0.6, metalness: 0.2 });
  const geoBorda = new BoxGeometry(COMPRIMENTO + 12, 0.05, 0.06);
  const matBorda = new MeshBasicMaterial({ color: bico });
  const geoRolo = new BoxGeometry(0.05, 0.15, PROF + 0.52);
  const matRolo = new MeshStandardMaterial({ color: tinta700, roughness: 0.7 });

  // ---------- texturas por oferta (foto + etiqueta), compartilhadas ----------
  const texturas: CanvasTexture[] = [];
  const materiaisOferta = await Promise.all(
    ofertas.map(async (o) => {
      const foto = await texturaFoto(o.img, o.letra, fotoFundo, fotoTinta);
      const velho = !o.conferidoEm || diasDesde(o.conferidoEm) >= o.validade;
      const etiqueta = texturaEtiqueta(velho ? undefined : o.preco, bico, tinta950);
      texturas.push(foto, etiqueta);
      return {
        foto: new MeshBasicMaterial({ map: foto, toneMapped: false }),
        etiqueta: new MeshBasicMaterial({ map: etiqueta, toneMapped: false, transparent: true }),
      };
    }),
  );

  // ---------- as esteiras ----------
  const rnd = sorteio(7);
  const fileiras: Fileira[] = [];
  const malhas: Mesh[] = [];
  const velocidades = [0.42, 0.3, 0.5, 0.36];

  for (let k = 0; k < FILEIRAS; k++) {
    const esteira = new Group();
    const laje = new Mesh(geoEsteira, matEsteira);
    laje.position.y = -0.07;
    const borda = new Mesh(geoBorda, matBorda);
    borda.position.set(0, -0.02, PROF / 2 + 0.26);
    esteira.add(laje, borda);
    const rolos = Math.floor((COMPRIMENTO + 12) / 0.9);
    const roloInst = new InstancedMesh(geoRolo, matRolo, rolos);
    for (let i = 0; i < rolos; i++) {
      m4.makeTranslation(-(COMPRIMENTO + 12) / 2 + i * 0.9, 0.003, 0);
      roloInst.setMatrixAt(i, m4);
    }
    esteira.add(roloInst);
    scene.add(esteira);

    const f: Fileira = {
      y: 0,
      z: 0,
      dir: k % 2 === 0 ? 1 : -1,
      velocidade: velocidades[k % velocidades.length],
      off: rnd() * ESP,
      extra: 0,
      lento: 1,
      arrastando: false,
      caixas: [],
      esteira,
    };

    for (let j = 0; j < POR_FILEIRA; j++) {
      // cada fileira começa numa oferta diferente: com várias ofertas, varia
      const oferta = ofertas[(j + k * 2) % ofertas.length];
      const m = materiaisOferta[(j + k * 2) % ofertas.length];
      const grupo = new Group();
      const malha = new Mesh(geoCaixa, [matPapelao, matPapelao, matTopo, matPapelao, m.foto, matPapelao]);
      malha.position.y = ALT / 2;
      const fita = new Mesh(geoFita, matFita);
      fita.position.set(0, ALT + 0.007, 0);
      const etiqueta = new Mesh(geoEtiqueta, m.etiqueta);
      etiqueta.position.set(LARG / 2 - 0.5, 0.3, PROF / 2 + 0.014);
      etiqueta.rotation.z = -0.09;
      grupo.add(malha, fita, etiqueta);
      scene.add(grupo);
      const caixa: Caixa = { grupo, malha, j, oferta, fase: rnd() * 6.28, escala: 1, levanta: 0, aperto: 0 };
      malha.userData = { fileira: k, caixa };
      malhas.push(malha);
      f.caixas.push(caixa);
    }
    fileiras.push(f);
  }

  // ---------- câmera e medidas ----------
  const raio = new Raycaster();
  const ndc = new Vector2();
  let w = 1;
  let h = 1;
  let nFileiras = FILEIRAS;
  let distCamera = 12;

  function medir() {
    if (opcoes.tamanho) {
      w = opcoes.tamanho.w;
      h = opcoes.tamanho.h;
    } else {
      w = canvas.clientWidth || innerWidth;
      h = canvas.clientHeight || innerHeight;
    }
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const retrato = camera.aspect < 0.8;
    // celular baixo (320×568) não comporta 4 esteiras sem apertar a placa e a dica
    nFileiras = retrato && h >= 640 ? FILEIRAS : 3;
    // o enquadramento nasce da ALTURA que precisa caber (esteiras + folga pra
    // placa e dica): em retrato sobram ~2,5 caixas por fileira, em paisagem mais
    const altVisivel = nFileiras * DY + 3.4;
    distCamera = altVisivel / 2 / Math.tan((camera.fov * Math.PI) / 360);
    // placa no alto, dica embaixo: o miolo da tela fica com as esteiras
    camera.setViewOffset(w, h, 0, Math.round(-h * (retrato ? 0.055 : 0.1)), w, h);
    camera.updateProjectionMatrix();

    const topo = ((nFileiras - 1) / 2) * DY;
    fileiras.forEach((f, k) => {
      const visivel = k < nFileiras;
      f.esteira.visible = visivel;
      f.caixas.forEach((c) => (c.grupo.visible = visivel));
      f.y = topo - k * DY;
      f.z = (k - (nFileiras - 1) / 2) * 0.55; // as de baixo ficam mais perto: dá profundidade
      f.esteira.position.set(0, f.y, f.z);
    });
    camera.position.set(0, topo + 2.3, distCamera);
    camera.lookAt(0, -0.2, 0);
    led.position.y = topo + 1.9;
  }

  const metadeComp = COMPRIMENTO / 2;
  const envolver = (v: number) => ((((v + metadeComp) % COMPRIMENTO) + COMPRIMENTO) % COMPRIMENTO) - metadeComp;

  // ---------- interação ----------
  const ponteiro = { x: 0, y: 0, dentro: false, toque: false };
  let sobre: Caixa | null = null;
  let tocada: { fileira: number; caixa: Caixa | null } | null = null;
  let arrasto: { fileira: number; x0: number; xAnt: number; tAnt: number; v: number; moveu: boolean; caixa: Caixa | null } | null = null;
  let abrindo: { caixa: Caixa; t0: number } | null = null;

  function acharCaixa(clientX: number, clientY: number): Caixa | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    raio.setFromCamera(ndc, camera);
    const visiveis = malhas.filter((m) => m.parent?.visible);
    const hit = raio.intersectObjects(visiveis, false)[0];
    return hit ? (hit.object.userData.caixa as Caixa) : null;
  }

  function fileiraMaisProxima(clientY: number, caixa: Caixa | null): number {
    if (caixa) return fileiras.findIndex((f) => f.caixas.includes(caixa));
    const r = canvas.getBoundingClientRect();
    let melhor = 0;
    let dmin = Infinity;
    for (let k = 0; k < nFileiras; k++) {
      const v = camera.position.clone().set(0, fileiras[k].y + ALT / 2, fileiras[k].z).project(camera);
      const yPx = r.top + ((1 - v.y) / 2) * r.height;
      const d = Math.abs(yPx - clientY);
      if (d < dmin) {
        dmin = d;
        melhor = k;
      }
    }
    return melhor;
  }

  // largura do mundo por pixel, na profundidade da fileira
  function mundoPorPixel(f: Fileira) {
    const d = camera.position.z - f.z;
    return (2 * Math.tan((camera.fov * Math.PI) / 360) * d * camera.aspect) / w;
  }

  const aoPressionar = (e: PointerEvent) => {
    ponteiro.toque = e.pointerType !== 'mouse';
    ponteiro.x = e.clientX;
    ponteiro.y = e.clientY;
    ponteiro.dentro = true;
    const caixa = acharCaixa(e.clientX, e.clientY);
    const k = fileiraMaisProxima(e.clientY, caixa);
    canvas.setPointerCapture(e.pointerId);
    arrasto = { fileira: k, x0: e.clientX, xAnt: e.clientX, tAnt: performance.now(), v: 0, moveu: false, caixa };
    tocada = { fileira: k, caixa };
    if (caixa) caixa.aperto = 1;
    acordar();
  };

  const aoMover = (e: PointerEvent) => {
    ponteiro.x = e.clientX;
    ponteiro.y = e.clientY;
    ponteiro.dentro = true;
    ponteiro.toque = e.pointerType !== 'mouse';
    if (arrasto) {
      const a = arrasto;
      if (!a.moveu && Math.abs(e.clientX - a.x0) > 7) {
        a.moveu = true;
        fileiras[a.fileira].arrastando = true;
        if (a.caixa) a.caixa.aperto = 0;
      }
      if (a.moveu) {
        const f = fileiras[a.fileira];
        const agora = performance.now();
        const dx = (e.clientX - a.xAnt) * mundoPorPixel(f);
        f.off += dx;
        const dt = Math.max((agora - a.tAnt) / 1000, 0.001);
        a.v = a.v * 0.7 + (dx / dt) * 0.3;
        a.xAnt = e.clientX;
        a.tAnt = agora;
      }
    }
    acordar();
  };

  const soltar = (e: PointerEvent) => {
    const a = arrasto;
    arrasto = null;
    if (!a) return;
    const f = fileiras[a.fileira];
    f.arrastando = false;
    if (a.moveu) {
      // a esteira segue pela inércia e volta ao ritmo sozinha
      const base = f.dir * f.velocidade;
      f.extra = limitar(a.v - base, -12, 12);
    } else if (a.caixa && e.type === 'pointerup') {
      abrir(a.caixa);
    }
    tocada = null;
    if (ponteiro.toque) ponteiro.dentro = false;
    acordar();
  };

  const aoCancelar = () => {
    if (arrasto) fileiras[arrasto.fileira].arrastando = false;
    if (arrasto?.caixa) arrasto.caixa.aperto = 0;
    arrasto = null;
    tocada = null;
    ponteiro.dentro = false;
    acordar();
  };

  const aoSair = () => {
    if (!ponteiro.toque) ponteiro.dentro = false;
    acordar();
  };

  function abrir(caixa: Caixa) {
    navigator.vibrate?.(8);
    if (reduzido) {
      opcoes.aoAbrir?.(caixa.oferta);
      return;
    }
    abrindo = { caixa, t0: performance.now() };
    // se o navegador voltar pra esta página (botão "voltar"), a caixa não fica apertada
    addEventListener('pageshow', () => (abrindo = null), { once: true });
  }

  // ---------- laço ----------
  let quadro = 0;
  let vivo = true;
  let visivel = true;
  let ultimo = 0;
  let t = 0;

  function atualizar(dt: number) {
    // hover: o cursor sobre uma caixa (só com mouse; no toque vale a caixa tocada)
    const alvoSobre = tocada?.caixa ?? (ponteiro.dentro && !ponteiro.toque && !arrasto?.moveu ? acharCaixa(ponteiro.x, ponteiro.y) : null);
    if (alvoSobre !== sobre) {
      sobre = alvoSobre;
      canvas.style.cursor = sobre ? 'pointer' : 'grab';
    }
    const fileiraSobre = sobre ? fileiras.findIndex((f) => f.caixas.includes(sobre!)) : -1;

    fileiras.forEach((f, k) => {
      const alvoLento = k === fileiraSobre || (tocada && tocada.fileira === k) ? 0.1 : 1;
      f.lento += (alvoLento - f.lento) * (1 - Math.exp(-dt * 7));
      const vel = f.dir * f.velocidade * f.lento + f.extra;
      if (!f.arrastando) {
        f.off += vel * dt;
        f.extra *= Math.exp(-dt * 2.2);
      }
      const inclina = limitar(vel * 0.045, -0.18, 0.18);
      f.caixas.forEach((c) => {
        const x = envolver(c.j * ESP + f.off);
        const alvoEscala = c === sobre ? 1.1 : 1;
        c.escala += (alvoEscala - c.escala) * (1 - Math.exp(-dt * 12));
        const alvoLevanta = c === sobre ? 0.14 : 0;
        c.levanta += (alvoLevanta - c.levanta) * (1 - Math.exp(-dt * 12));
        const aperto = 1 - c.aperto * 0.1;
        const bal = estatica ? 0 : Math.sin(t * 1.5 + c.fase) * 0.012;
        const flutua = estatica ? 0 : Math.sin(t * 1.7 + c.fase) * 0.025;
        c.grupo.position.set(x, f.y + flutua + c.levanta, f.z);
        c.grupo.rotation.z = -inclina + bal;
        c.grupo.rotation.y = -x * 0.025 + (c === sobre ? 0.0 : 0);
        c.grupo.scale.setScalar(c.escala * aperto);
      });
    });

    if (abrindo) {
      const p = (performance.now() - abrindo.t0) / 160;
      abrindo.caixa.aperto = p < 0.5 ? limitar(p * 2, 0, 1) : limitar(1 - (p - 0.5) * 2.6, -0.8, 1);
      if (p >= 1) {
        const o = abrindo.caixa.oferta;
        abrindo = null;
        opcoes.aoAbrir?.(o);
      }
    }
  }

  function laco(ms: number) {
    quadro = 0;
    if (!vivo || !visivel || document.hidden) return;
    const dt = Math.min((ms - ultimo) / 1000 || 0.016, 0.05);
    ultimo = ms;
    t += dt;
    atualizar(dt);
    renderer.render(scene, camera);
    // com movimento reduzido a esteira fica parada (as caixas continuam tocáveis)
    if (!reduzido) quadro = requestAnimationFrame(laco);
  }

  function acordar() {
    if (vivo && visivel && !quadro && !document.hidden) {
      ultimo = performance.now();
      quadro = requestAnimationFrame(laco);
    }
  }

  medir();
  if (estatica) {
    atualizar(0.016);
    renderer.render(scene, camera);
    (window as unknown as { __cenaPronta: boolean }).__cenaPronta = true;
    return { dispose: () => renderer.dispose() };
  }

  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', aoPressionar);
  canvas.addEventListener('pointermove', aoMover);
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', aoCancelar);
  canvas.addEventListener('pointerleave', aoSair);
  const aoRedimensionar = () => {
    medir();
    acordar();
  };
  addEventListener('resize', aoRedimensionar);
  document.addEventListener('visibilitychange', acordar);
  const ro = new ResizeObserver(aoRedimensionar);
  ro.observe(canvas);
  // só desenha enquanto o palco está à vista: rolou pra vitrine, a esteira dorme
  const io = new IntersectionObserver(([en]) => {
    visivel = !!en?.isIntersecting;
    if (visivel) acordar();
  });
  io.observe(opcoes.palco ?? canvas);

  acordar();

  return {
    dispose() {
      vivo = false;
      cancelAnimationFrame(quadro);
      canvas.removeEventListener('pointerdown', aoPressionar);
      canvas.removeEventListener('pointermove', aoMover);
      canvas.removeEventListener('pointerup', soltar);
      canvas.removeEventListener('pointercancel', aoCancelar);
      canvas.removeEventListener('pointerleave', aoSair);
      removeEventListener('resize', aoRedimensionar);
      document.removeEventListener('visibilitychange', acordar);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => (o as Mesh).geometry?.dispose?.());
      texturas.forEach((x) => x.dispose());
      renderer.dispose();
    },
  };
}
