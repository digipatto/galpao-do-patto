/**
 * A cena 3D do hero: a entrada do galpão do Patto, vista do corredor.
 *
 * Só é importada no cliente (dynamic import no HeroGalpao), nunca no servidor.
 * Cores vêm dos tokens CSS (getComputedStyle), então nenhum hex mora aqui.
 *
 * Peças repetidas são InstancedMesh: a cena inteira fecha em ~10 draw calls.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

export interface EstadoCena {
  /** 1 = câmera recuada (começo da entrada), 0 = posição final. Animado pelo GSAP. */
  avanco: number;
  /** brilho do letreiro, 0–1. Animado pelo GSAP. */
  holo: number;
}

export interface Cena {
  estado: EstadoCena;
  /** Alvo do parallax, de -1 a 1 em cada eixo. */
  pointer: { x: number; y: number };
  render(segundos: number): void;
  resize(largura: number, altura: number): void;
  dispose(): void;
}

interface Opcoes {
  /** Cena parada e determinística: é como o poster é fotografado. */
  estatica?: boolean;
}

/** Aleatório com semente: a cena sai igual em toda carga (e no poster). */
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

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

/** Letreiro holográfico: texto ciano com brilho e linhas de varredura. */
async function texturaLetreiro(holo: Color) {
  try {
    await document.fonts.load('700 120px "Clash Display"');
  } catch {
    /* sem a fonte, cai na do sistema */
  }
  const w = 1024;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const css = `#${holo.getHexString()}`;

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 92px "Clash Display", "Satoshi", sans-serif';
  g.shadowColor = css;
  g.shadowBlur = 36;
  g.fillStyle = css;
  g.fillText('Achados & Ofertas', w / 2, h / 2 + 4);
  g.shadowBlur = 8;
  g.fillText('Achados & Ofertas', w / 2, h / 2 + 4);

  // linhas de varredura: apagam uma fatia fina a cada 6px
  g.globalCompositeOperation = 'destination-out';
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(0,0,0,0.38)';
  for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** O Patto como anfitrião: recorte 2D circular com anel âmbar, que encara a câmera. */
async function texturaPatto(anel: Color) {
  const img = await carregarImagem('/marca/patto.webp');
  const n = 512;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const g = c.getContext('2d')!;
  const m = 14;
  g.beginPath();
  g.arc(n / 2, n / 2, n / 2 - m, 0, Math.PI * 2);
  g.save();
  g.clip();
  g.drawImage(img, m, m, n - m * 2, n - m * 2);
  g.restore();
  g.lineWidth = 12;
  g.strokeStyle = `#${anel.getHexString()}`;
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export async function montarCena(canvas: HTMLCanvasElement, opcoes: Opcoes = {}): Promise<Cena> {
  const estatica = !!opcoes.estatica;

  const tinta950 = cor('--p-tinta-950');
  const tinta900 = cor('--p-tinta-900');
  const tinta700 = cor('--p-tinta-700');
  const tinta600 = cor('--p-tinta-600');
  const tinta500 = cor('--p-tinta-500');
  const bico = cor('--p-bico');
  const bicoClaro = cor('--p-bico-claro');
  const terno = cor('--p-terno');
  const ternoClaro = cor('--p-terno-claro');
  const holo = cor('--p-holo');
  const tenue = cor('--p-camisa-tenue');

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(tinta950);

  const scene = new Scene();
  scene.background = tinta950;
  scene.fog = new Fog(tinta950, 14, 34);

  const camera = new PerspectiveCamera(30, 3.4, 0.1, 80);
  const alvo = new Vector3(0, 2.3, -13);
  const base = { x: 0, y: 1.75, z: 7 };
  camera.position.set(base.x, base.y, base.z);
  camera.lookAt(alvo);

  // ---------- luz: ambiente + 1 direcional com sombra suave + emissivos ----------
  scene.add(new HemisphereLight(ternoClaro, tinta900, 1.15));
  const sol = new DirectionalLight(new Color('white').lerp(bicoClaro, 0.35), 1.6);
  sol.position.set(-5, 10, 6);
  sol.target.position.set(0, 0, -6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.radius = 5;
  sol.shadow.bias = -0.0006;
  const sc = sol.shadow.camera;
  sc.left = -8;
  sc.right = 8;
  sc.top = 14;
  sc.bottom = -14;
  sc.near = 1;
  sc.far = 28;
  scene.add(sol, sol.target);

  // ---------- piso e linhas-guia ----------
  const piso = new Mesh(
    new PlaneGeometry(40, 60),
    new MeshStandardMaterial({ color: tinta900, roughness: 0.42, metalness: 0.15 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.z = -12;
  piso.receiveShadow = true;
  scene.add(piso);

  const guiaMat = new MeshBasicMaterial({ color: bico, fog: true });
  for (const lado of [-1, 1]) {
    const guia = new Mesh(new PlaneGeometry(0.14, 40), guiaMat);
    guia.rotation.x = -Math.PI / 2;
    guia.position.set(lado * 1.05, 0.012, -12);
    scene.add(guia);
  }

  // ---------- estantes (InstancedMesh) ----------
  const BAIAS = 4;
  const LARG_BAIA = 2.4;
  const Z0 = 4;
  const NIVEIS = [0.55, 1.55, 2.55, 3.55];
  const X_FRENTE = 3.0;
  const X_FUNDO = 4.0;
  const ALTURA = 4.1;
  const dummy = new Matrix4();

  const geoMontante = new BoxGeometry(0.1, ALTURA, 0.1);
  const matMontante = new MeshStandardMaterial({ color: terno, roughness: 0.55, metalness: 0.25 });
  const nMontantes = (BAIAS + 1) * 2 * 2;
  const montantes = new InstancedMesh(geoMontante, matMontante, nMontantes);

  const geoTravessa = new BoxGeometry(0.07, 0.13, LARG_BAIA);
  const matTravessa = new MeshStandardMaterial({ color: bico, roughness: 0.45, metalness: 0.1, emissive: bico, emissiveIntensity: 0.18 });
  const nTravessas = BAIAS * NIVEIS.length * 2 * 2;
  const travessas = new InstancedMesh(geoTravessa, matTravessa, nTravessas);

  let im = 0;
  let it = 0;
  for (const lado of [-1, 1]) {
    for (let b = 0; b <= BAIAS; b++) {
      const z = Z0 - b * LARG_BAIA;
      for (const x of [X_FRENTE, X_FUNDO]) {
        dummy.makeTranslation(lado * x, ALTURA / 2, z);
        montantes.setMatrixAt(im++, dummy);
      }
    }
    for (let b = 0; b < BAIAS; b++) {
      const z = Z0 - b * LARG_BAIA - LARG_BAIA / 2;
      for (const y of NIVEIS) {
        for (const x of [X_FRENTE, X_FUNDO]) {
          dummy.makeTranslation(lado * x, y, z);
          travessas.setMatrixAt(it++, dummy);
        }
      }
    }
  }

  // Caixas: uma geometria só, tamanho por instância (escala), cor por instância.
  const rnd = sorteio(7);
  const paleta = [tinta500, tinta600, tinta500, tenue, tinta700, bico];
  const geoCaixa = new BoxGeometry(1, 1, 1);
  const matCaixa = new MeshStandardMaterial({ roughness: 0.78, metalness: 0 });
  const maxCaixas = BAIAS * NIVEIS.length * 2 * 3;
  const caixas = new InstancedMesh(geoCaixa, matCaixa, maxCaixas);
  let ic = 0;
  const cx = new Color();
  for (const lado of [-1, 1]) {
    for (let b = 0; b < BAIAS; b++) {
      const zBaia = Z0 - b * LARG_BAIA - LARG_BAIA / 2;
      for (const y of NIVEIS) {
        const quantas = 2 + Math.floor(rnd() * 2);
        let z = zBaia - LARG_BAIA / 2 + 0.2;
        for (let k = 0; k < quantas && ic < maxCaixas; k++) {
          const w = 0.62 + rnd() * 0.2;
          const h = 0.34 + rnd() * 0.3;
          const d = 0.5 + rnd() * 0.28;
          z += d / 2;
          if (z + d / 2 > zBaia + LARG_BAIA / 2 - 0.1) break;
          dummy.makeScale(w, h, d);
          dummy.setPosition(lado * (X_FRENTE + X_FUNDO) / 2 + (rnd() - 0.5) * 0.08, y + 0.065 + h / 2, z);
          caixas.setMatrixAt(ic, dummy);
          cx.copy(paleta[Math.floor(rnd() * paleta.length)]);
          caixas.setColorAt(ic, cx);
          ic++;
          z += d / 2 + 0.12;
        }
      }
    }
  }
  caixas.count = ic;

  for (const m of [montantes, travessas, caixas]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.instanceMatrix.needsUpdate = true;
    scene.add(m);
  }
  if (caixas.instanceColor) caixas.instanceColor.needsUpdate = true;

  // ---------- teto: fita de LED e barras transversais (emissivos) ----------
  const ledMat = new MeshBasicMaterial({ color: holo, fog: false });
  const ledAmbar = new MeshBasicMaterial({ color: bicoClaro, fog: false });
  for (const lado of [-1, 1]) {
    const fita = new Mesh(new BoxGeometry(0.1, 0.06, 44), ledMat);
    fita.position.set(lado * 1.55, 4.75, -14);
    scene.add(fita);
  }
  const barras = new InstancedMesh(new BoxGeometry(3.1, 0.08, 0.08), ledAmbar, 9);
  for (let i = 0; i < 9; i++) {
    dummy.makeTranslation(0, 4.8, 4 - i * 3);
    barras.setMatrixAt(i, dummy);
  }
  scene.add(barras);

  // ---------- parede de vidro no fundo, com o letreiro ----------
  const Z_VIDRO = -15;
  const vidro = new Mesh(
    new PlaneGeometry(15, 5.4),
    new MeshBasicMaterial({ color: holo, transparent: true, opacity: 0.07, depthWrite: false, fog: false }),
  );
  vidro.position.set(0, 2.7, Z_VIDRO);
  scene.add(vidro);

  const caibros = new InstancedMesh(
    new BoxGeometry(0.1, 5.4, 0.1),
    new MeshStandardMaterial({ color: ternoClaro, roughness: 0.5, metalness: 0.3 }),
    8,
  );
  for (let i = 0; i < 8; i++) {
    dummy.makeTranslation(-7 + i * 2, 2.7, Z_VIDRO);
    caibros.setMatrixAt(i, dummy);
  }
  scene.add(caibros);

  const texLetreiro = await texturaLetreiro(holo);
  const letreiroMat = new MeshBasicMaterial({
    map: texLetreiro,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const letreiro = new Mesh(new PlaneGeometry(10, 2.5), letreiroMat);
  letreiro.position.set(0, 3.4, Z_VIDRO + 0.15);
  scene.add(letreiro);

  // ---------- o Patto: billboard 2D, anfitrião na entrada ----------
  let patto: Sprite | null = null;
  try {
    const texPatto = await texturaPatto(bico);
    patto = new Sprite(new SpriteMaterial({ map: texPatto, fog: false, toneMapped: false }));
    patto.scale.set(1.0, 1.0, 1);
    patto.position.set(1.7, 1.15, 1.8);
    scene.add(patto);
  } catch {
    /* sem a arte, a cena fica sem anfitrião: o resto continua de pé */
  }

  const estado: EstadoCena = { avanco: estatica ? 0 : 0.4, holo: estatica ? 1 : 0.4 };
  const pointer = { x: 0, y: 0 };
  const suave = { x: 0, y: 0 };

  function resize(largura: number, altura: number) {
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / Math.max(altura, 1);
    camera.updateProjectionMatrix();
  }

  function render(t: number) {
    if (!estatica) {
      suave.x += (pointer.x - suave.x) * 0.06;
      suave.y += (pointer.y - suave.y) * 0.06;
    }
    const deriva = estatica ? 0 : Math.sin(t * 0.22) * 0.35;
    camera.position.set(
      base.x + suave.x * 0.7 + deriva,
      base.y + suave.y * -0.18 + estado.avanco * 0.7,
      base.z + estado.avanco * 2.4,
    );
    camera.lookAt(alvo);

    const piscar = estatica ? 1 : 0.94 + Math.sin(t * 9) * 0.03 * estado.holo;
    letreiroMat.opacity = estado.holo * piscar;
    letreiro.position.y = 3.4 + (estatica ? 0 : Math.sin(t * 0.8) * 0.05);
    renderer.render(scene, camera);
  }

  function dispose() {
    scene.traverse((o) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as MeshBasicMaterial | MeshBasicMaterial[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    texLetreiro.dispose();
    patto?.material.map?.dispose();
    renderer.dispose();
  }

  return { estado, pointer, render, resize, dispose };
}
