/**
 * O galpão 3D: a página inteira. Um corredor minimalista (piso com faixas, fita
 * de LED no teto, estantes ao fundo) e, ao longo dele, um pedestal por oferta
 * com uma caixa que mostra a foto do produto. Rolar a página caminha pelo
 * corredor: a oferta que está na tela é a caixa que está na câmera.
 *
 * O texto, o preço e os links NÃO estão aqui: ficam em HTML por cima da cena
 * (nítidos, clicáveis, acessíveis). A cena é só o palco.
 *
 * Só roda no cliente, carregada sob demanda. Cores vêm dos tokens CSS
 * (getComputedStyle), então nenhum hex mora aqui. Peças repetidas são
 * InstancedMesh. Sem framework: three puro, pra pesar o mínimo no celular.
 */
import {
  AdditiveBlending,
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
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

export interface Estacao {
  /** A seção HTML da oferta: é a posição dela na página que move a câmera. */
  el: HTMLElement | null;
  /** Foto da caixa (caminho ou URL). Sem ela, a caixa leva a inicial. */
  img?: string;
  /** Inicial usada quando não há foto. */
  letra?: string;
}

export interface Opcoes {
  estacoes: Estacao[];
  /** Quadro parado e determinístico: é como o poster é fotografado. */
  estatica?: boolean;
  /** Tamanho fixo (poster). Sem isso, segue o tamanho do canvas. */
  tamanho?: { w: number; h: number };
  /** Força o modo leve (celular), mesmo em tela grande. */
  leve?: boolean;
  /** O quanto a caixa sobe na tela, em fração da altura (o card fica embaixo). */
  foco?: number;
}

export interface Cena {
  dispose(): void;
}

const ESPACO = 9; // distância entre pedestais, ao longo do corredor

function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function cor(nome: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return new Color(v || 'gray');
}

const css = (c: Color) => `#${c.getHexString()}`;

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

/** Foto de anúncio tem fundo branco: vai sobre tom claro com multiply, como no card. */
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
      const r = Math.min((w - 70) / img.width, (h - 70) / img.height);
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

/** Letreiro holográfico do fundo do corredor. */
async function texturaLetreiro(holo: Color) {
  try {
    await document.fonts.load('700 100px "Clash Display"');
  } catch {
    /* sem a fonte, cai na do sistema */
  }
  const w = 1024;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 100px "Clash Display", "Satoshi", sans-serif';
  g.shadowColor = css(holo);
  g.shadowBlur = 32;
  g.fillStyle = css(holo);
  g.fillText('Achados & Ofertas', w / 2, h / 2 + 4);
  g.shadowBlur = 6;
  g.fillText('Achados & Ofertas', w / 2, h / 2 + 4);
  g.globalCompositeOperation = 'destination-out';
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(0,0,0,0.38)';
  for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Sombra de contato: um degradê escuro no topo do pedestal, sob a caixa. */
function texturaSombra() {
  const n = 128;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, n, n);
  return new CanvasTexture(c);
}

export async function montar(canvas: HTMLCanvasElement, opcoes: Opcoes): Promise<Cena> {
  const estatica = !!opcoes.estatica;
  const estacoes = opcoes.estacoes.length ? opcoes.estacoes : [{ el: null }];
  const N = estacoes.length;
  const leve = opcoes.leve ?? (matchMedia('(pointer: coarse)').matches || innerWidth < 768);

  const tinta950 = cor('--p-tinta-950');
  const tinta900 = cor('--p-tinta-900');
  const tinta800 = cor('--p-tinta-800');
  const tinta700 = cor('--p-tinta-700');
  const tinta600 = cor('--p-tinta-600');
  const tinta500 = cor('--p-tinta-500');
  const bico = cor('--p-bico');
  const bicoClaro = cor('--p-bico-claro');
  const terno = cor('--p-terno');
  const ternoClaro = cor('--p-terno-claro');
  const holo = cor('--p-holo');
  const fotoFundo = cor('--foto-fundo');
  const fotoTinta = cor('--foto-tinta');

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, leve ? 1.5 : 2));
  renderer.setClearColor(tinta950);

  const scene = new Scene();
  scene.background = tinta950;
  scene.fog = new Fog(tinta950, 12, 42);

  const camera = new PerspectiveCamera(38, 0.5, 0.1, 120);

  // ---------- luz: hemisfério + 1 direcional (acompanha a câmera) + emissivos ----------
  scene.add(new HemisphereLight(ternoClaro, tinta900, 1.25));
  const sol = new DirectionalLight(new Color('white').lerp(bicoClaro, 0.3), 1.9);
  scene.add(sol, sol.target);

  const zFim = -N * ESPACO - 13; // parede de vidro
  const comprimento = 8 - zFim;
  const zMeio = (8 + zFim) / 2;

  // ---------- piso e faixas-guia ----------
  const piso = new Mesh(
    new PlaneGeometry(40, comprimento + 20),
    new MeshStandardMaterial({ color: tinta900, roughness: 0.5, metalness: 0.12 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.z = zMeio - 6;
  scene.add(piso);

  const guiaMat = new MeshBasicMaterial({ color: bico });
  for (const lado of [-1, 1]) {
    const guia = new Mesh(new PlaneGeometry(0.12, comprimento + 20), guiaMat);
    guia.rotation.x = -Math.PI / 2;
    guia.position.set(lado * 1.7, 0.012, zMeio - 6);
    scene.add(guia);
  }

  // ---------- estantes ao fundo (InstancedMesh), calmas: o palco é o pedestal ----------
  const LARG_BAIA = 2.4;
  const BAIAS = Math.ceil(comprimento / LARG_BAIA);
  const NIVEIS = [0.55, 1.55, 2.55, 3.55];
  const X_FRENTE = 2.9;
  const X_FUNDO = 3.9;
  const ALTURA = 4.1;
  const m4 = new Matrix4();

  const montantes = new InstancedMesh(
    new BoxGeometry(0.1, ALTURA, 0.1),
    new MeshStandardMaterial({ color: terno, roughness: 0.55, metalness: 0.25 }),
    (BAIAS + 1) * 4,
  );
  const travessas = new InstancedMesh(
    new BoxGeometry(0.07, 0.13, LARG_BAIA),
    new MeshStandardMaterial({ color: bico, roughness: 0.45, metalness: 0.1, emissive: bico, emissiveIntensity: 0.16 }),
    BAIAS * NIVEIS.length * 4,
  );
  let im = 0;
  let it = 0;
  for (const lado of [-1, 1]) {
    for (let b = 0; b <= BAIAS; b++) {
      for (const x of [X_FRENTE, X_FUNDO]) {
        m4.makeTranslation(lado * x, ALTURA / 2, 8 - b * LARG_BAIA);
        montantes.setMatrixAt(im++, m4);
      }
    }
    for (let b = 0; b < BAIAS; b++) {
      for (const y of NIVEIS) {
        for (const x of [X_FRENTE, X_FUNDO]) {
          m4.makeTranslation(lado * x, y, 8 - b * LARG_BAIA - LARG_BAIA / 2);
          travessas.setMatrixAt(it++, m4);
        }
      }
    }
  }

  const rnd = sorteio(11);
  const paleta = [tinta600, tinta700, tinta500, tinta600];
  const maxCaixas = BAIAS * NIVEIS.length * 4;
  const caixas = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.8 }), maxCaixas);
  let ic = 0;
  const cx = new Color();
  for (const lado of [-1, 1]) {
    for (let b = 0; b < BAIAS; b++) {
      const zc = 8 - b * LARG_BAIA - LARG_BAIA / 2;
      for (const y of NIVEIS) {
        if (rnd() < 0.42 || ic >= maxCaixas) continue;
        const w = 0.62 + rnd() * 0.2;
        const h = 0.34 + rnd() * 0.3;
        const d = 0.7 + rnd() * 0.5;
        m4.makeScale(w, h, d);
        m4.setPosition(lado * ((X_FRENTE + X_FUNDO) / 2) + (rnd() - 0.5) * 0.08, y + 0.065 + h / 2, zc + (rnd() - 0.5) * 0.5);
        caixas.setMatrixAt(ic, m4);
        cx.copy(paleta[Math.floor(rnd() * paleta.length)]);
        caixas.setColorAt(ic, cx);
        ic++;
      }
    }
  }
  caixas.count = ic;
  for (const m of [montantes, travessas, caixas]) {
    m.instanceMatrix.needsUpdate = true;
    scene.add(m);
  }
  if (caixas.instanceColor) caixas.instanceColor.needsUpdate = true;

  // ---------- teto: fita de LED e barras transversais ----------
  const ledMat = new MeshBasicMaterial({ color: holo, fog: false });
  const ledAmbar = new MeshBasicMaterial({ color: bicoClaro, fog: false });
  for (const lado of [-1, 1]) {
    const fita = new Mesh(new BoxGeometry(0.1, 0.06, comprimento + 20), ledMat);
    fita.position.set(lado * 1.55, 4.75, zMeio - 6);
    scene.add(fita);
  }
  const nBarras = Math.floor(comprimento / 3) + 1;
  const barras = new InstancedMesh(new BoxGeometry(3.1, 0.08, 0.08), ledAmbar, nBarras);
  for (let i = 0; i < nBarras; i++) {
    m4.makeTranslation(0, 4.8, 8 - i * 3);
    barras.setMatrixAt(i, m4);
  }
  scene.add(barras);

  // ---------- fundo do corredor: parede de vidro e letreiro ----------
  const vidro = new Mesh(
    new PlaneGeometry(14, 5.4),
    new MeshBasicMaterial({ color: holo, transparent: true, opacity: 0.07, depthWrite: false, fog: false }),
  );
  vidro.position.set(0, 2.7, zFim);
  scene.add(vidro);

  const texLetreiro = await texturaLetreiro(holo);
  const letreiroMat = new MeshBasicMaterial({
    map: texLetreiro,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const letreiro = new Mesh(new PlaneGeometry(9, 2.25), letreiroMat);
  letreiro.position.set(0, 3.4, zFim + 0.15);
  scene.add(letreiro);

  // ---------- pedestais e caixas: um por oferta, mais um vazio no fim ----------
  const geoPedestal = new BoxGeometry(2.3, 0.5, 2.3);
  const matPedestal = new MeshStandardMaterial({ color: tinta800, roughness: 0.55, metalness: 0.2 });
  const geoAroLado = new BoxGeometry(2.3, 0.04, 0.05);
  const matAro = new MeshBasicMaterial({ color: bico });
  const geoCaixa = new BoxGeometry(1.5, 1.15, 1.15);
  const geoFita = new BoxGeometry(0.34, 0.014, 1.16);
  const matFita = new MeshBasicMaterial({ color: bicoClaro });
  const matPapelao = new MeshStandardMaterial({ color: bico.clone().lerp(tinta900, 0.55), roughness: 0.85 });
  const texSombra = texturaSombra();
  const matSombra = new MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false });
  const geoSombra = new PlaneGeometry(2.1, 2.1);

  const caixasOferta: Group[] = [];
  const texturas: CanvasTexture[] = [];
  const materiaisFoto: MeshBasicMaterial[] = [];

  for (let i = 0; i <= N; i++) {
    const z = -i * ESPACO;
    const g = new Group();
    g.position.set(0, 0, z);

    const pedestal = new Mesh(geoPedestal, matPedestal);
    pedestal.position.y = 0.25;
    // o aro âmbar: moldura fina no topo do pedestal, não uma laje
    const aro = new Group();
    for (const [x, zz, giro] of [[0, 1.125, 0], [0, -1.125, 0], [1.125, 0, Math.PI / 2], [-1.125, 0, Math.PI / 2]] as const) {
      const lado = new Mesh(geoAroLado, matAro);
      lado.position.set(x, 0.52, zz);
      lado.rotation.y = giro;
      aro.add(lado);
    }
    const sombra = new Mesh(geoSombra, matSombra);
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = 0.535;
    g.add(pedestal, aro);
    scene.add(g);

    if (i < N) {
      g.add(sombra);
      const est = estacoes[i];
      const tex = await texturaFoto(est.img, est.letra ?? '•', fotoFundo, fotoTinta);
      texturas.push(tex);
      const matFoto = new MeshBasicMaterial({ map: tex, toneMapped: false });
      materiaisFoto.push(matFoto);
      // ordem das faces do BoxGeometry: +x, -x, +y, -y, +z (frente), -z
      const caixa = new Mesh(geoCaixa, [matPapelao, matPapelao, matPapelao, matPapelao, matFoto, matPapelao]);
      caixa.position.y = 0.535 + 0.575;
      const fita = new Mesh(geoFita, matFita);
      fita.position.y = 0.535 + 1.15 + 0.007;
      const par = new Group();
      par.add(caixa, fita);
      g.add(par);
      caixasOferta.push(par);
    }
  }

  // ---------- câmera: caminha pelo corredor conforme a página rola ----------
  const foco = opcoes.foco ?? 0.2;
  const pointer = { x: 0, y: 0 };
  const suave = { x: 0, y: 0 };
  let tops: number[] = [];
  let alvoP = 0;
  let p = 0;
  let intro = estatica ? 1 : 0;
  let t0 = 0;
  let w = 1;
  let h = 1;

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
    // Retrato é estreito: abre o campo de visão pra a caixa caber com folga.
    camera.fov = camera.aspect < 0.8 ? 58 : camera.aspect < 1.3 ? 46 : 38;
    camera.setViewOffset(w, h, 0, Math.round(h * foco), w, h);
    camera.updateProjectionMatrix();
    // posição de cada seção na página, quando ela está no centro da tela
    tops = estacoes.map((e) => {
      if (!e.el) return 0;
      const r = e.el.getBoundingClientRect();
      return r.top + scrollY + r.height / 2 - innerHeight / 2;
    });
  }

  function lerScroll() {
    if (estatica || tops.length < 2) {
      alvoP = 0;
      return;
    }
    const y = scrollY;
    if (y <= tops[0]) alvoP = 0;
    else if (y >= tops[tops.length - 1]) alvoP = tops.length - 1;
    else {
      let i = 0;
      while (i < tops.length - 2 && y > tops[i + 1]) i++;
      alvoP = i + (y - tops[i]) / Math.max(tops[i + 1] - tops[i], 1);
    }
  }

  // Distância da câmera à caixa: em tela estreita (retrato) afasta pra caber a largura.
  const distancia = () => (camera.aspect < 1.3 ? 6.0 : 7.6);

  let quadro = 0;
  let vivo = true;

  function desenhar(t: number) {
    if (!estatica) {
      const seg = Math.min((t - t0) / 1.6, 1);
      intro = 1 - Math.pow(1 - seg, 3);
      suave.x += (pointer.x - suave.x) * 0.06;
      suave.y += (pointer.y - suave.y) * 0.06;
    }
    const folga = 1 - intro; // 1 = câmera recuada (começo da entrada)
    const d = distancia();

    camera.position.set(
      suave.x * 0.5,
      2.05 - suave.y * 0.12 + folga * 0.5,
      -p * ESPACO + d + folga * 1.8,
    );
    camera.lookAt(0, 1.2, -p * ESPACO);

    sol.position.set(camera.position.x + 3.5, 7, camera.position.z + 2);
    sol.target.position.set(0, 0.5, -p * ESPACO);

    // cada caixa gira conforme se afasta do centro: dá volume ao passar
    caixasOferta.forEach((par, i) => {
      const dist = p - i;
      par.rotation.y = estatica ? -0.32 : dist * 0.85 + suave.x * 0.25;
    });

    const brilho = estatica ? 1 : 0.4 + 0.6 * intro;
    letreiroMat.opacity = brilho;
    renderer.render(scene, camera);
  }

  function laco(ms: number) {
    quadro = 0;
    if (!vivo || document.hidden) return;
    const t = ms / 1000;
    if (!t0) t0 = t;
    p += (alvoP - p) * 0.14;
    if (Math.abs(alvoP - p) < 0.0008) p = alvoP;
    desenhar(t);
    // Só desenha enquanto algo se move (entrada, rolagem, parallax do cursor).
    // Parado, não gasta bateria nem GPU.
    const movendo =
      intro < 1 || p !== alvoP || Math.abs(pointer.x - suave.x) > 0.002 || Math.abs(pointer.y - suave.y) > 0.002;
    if (movendo) quadro = requestAnimationFrame(laco);
  }

  function acordar() {
    if (vivo && !quadro && !document.hidden) quadro = requestAnimationFrame(laco);
  }

  medir();
  lerScroll();
  p = alvoP;

  if (estatica) {
    desenhar(0);
    (window as unknown as { __cenaPronta: boolean }).__cenaPronta = true;
    return { dispose: () => renderer.dispose() };
  }

  const aoRolar = () => {
    lerScroll();
    acordar();
  };
  const aoMover = (e: PointerEvent) => {
    if (leve) return;
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
    acordar();
  };
  const aoRedimensionar = () => {
    medir();
    lerScroll();
    acordar();
  };
  addEventListener('scroll', aoRolar, { passive: true });
  addEventListener('pointermove', aoMover, { passive: true });
  addEventListener('resize', aoRedimensionar);
  document.addEventListener('visibilitychange', acordar);
  // Fontes e fotos mudam a altura das seções depois da primeira medida.
  const ro = new ResizeObserver(aoRedimensionar);
  estacoes.forEach((e) => e.el && ro.observe(e.el));

  acordar();

  return {
    dispose() {
      vivo = false;
      cancelAnimationFrame(quadro);
      removeEventListener('scroll', aoRolar);
      removeEventListener('pointermove', aoMover);
      removeEventListener('resize', aoRedimensionar);
      document.removeEventListener('visibilitychange', acordar);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose?.();
      });
      texturas.forEach((t) => t.dispose());
      materiaisFoto.forEach((m) => m.dispose());
      texLetreiro.dispose();
      texSombra.dispose();
      renderer.dispose();
    },
  };
}
