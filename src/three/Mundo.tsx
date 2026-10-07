import { useCallback, useRef } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import Galpao, { GALPAO } from './Galpao';
import { useCorToken } from './hooks/useCorToken';

/**
 * O mundo: <Canvas>, câmera, luz e navegação.
 *
 * Este arquivo cuida da moldura. O cenário mora no Galpao.tsx e os produtos
 * virão dos dados na Parte 3 — nada de produto hardcodado aqui.
 */

/**
 * Até onde dá pra arrastar, a partir do centro. Acompanha o tamanho do piso,
 * com uma folga — dá pra encostar na borda, não dá pra se perder no vazio.
 * Na Parte 6 isto cresce junto com o galpão.
 */
const LIMITE_PAN_X = GALPAO.piso.largura / 2 - 2;
const LIMITE_PAN_Z = GALPAO.piso.profundidade / 2 + 2;

/** Limites de zoom da câmera ortográfica. */
const ZOOM_MIN = 6; // o galpão inteiro cabe na tela
const ZOOM_MAX = 80; // dá pra encostar numa prateleira

/** Posição isométrica clássica: 45° na horizontal, ~35° de inclinação. */
const CAMERA_POS: [number, number, number] = [34, 32, 34];

function prender(valor: number, limite: number) {
  return Math.min(limite, Math.max(-limite, valor));
}

/**
 * Enquadramento inicial, calculado pelo tamanho da tela.
 *
 * Numa câmera ortográfica o mundo visível é `pixels / zoom`, então um zoom fixo
 * que fica bom no desktop deixa o celular colado numa prateleira. O celular
 * abre mostrando um pedaço generoso do galpão; o desktop, o galpão inteiro.
 */
function zoomInicial() {
  if (typeof window === 'undefined') return 14;

  const { innerWidth: largura, innerHeight: altura } = window;
  const estreito = largura < 640;

  const mundoNaLargura = estreito ? 52 : 86;
  const mundoNaAltura = estreito ? 62 : 58;

  const zoom = Math.min(largura / mundoNaLargura, altura / mundoNaAltura);
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

function Cena() {
  const fundo = useCorToken('--fundo', '#0f1320');
  const holo = useCorToken('--holo', '#3fe0d0');
  const acento = useCorToken('--acento', '#ffc400');

  const controles = useRef<MapControlsImpl>(null);

  // Impede que o visitante arraste pro infinito e perca o mundo de vista.
  // Move alvo e câmera pelo mesmo delta, pra não desalinhar o enquadramento.
  const prenderNaArea = useCallback(() => {
    const c = controles.current;
    if (!c) return;

    const alvo = c.target;
    const dx = prender(alvo.x, LIMITE_PAN_X) - alvo.x;
    const dz = prender(alvo.z, LIMITE_PAN_Z) - alvo.z;
    if (dx === 0 && dz === 0) return;

    alvo.x += dx;
    alvo.z += dz;
    c.object.position.x += dx;
    c.object.position.z += dz;
    invalidate();
  }, []);

  return (
    <>
      <color attach="background" args={[fundo]} />

      {/* Preenchimento frio por cima, quente do chão — dá volume sem custo. */}
      <hemisphereLight args={[holo, fundo, 0.9]} />
      <ambientLight intensity={0.35} />

      {/*
        UMA luz com sombra, mapa pequeno: é a regra de performance do plano.
        O frustum da sombra é apertado na área do galpão de propósito — quanto
        menor, mais nítida a sombra pro mesmo tamanho de mapa.
      */}
      <directionalLight
        position={[26, 34, 18]}
        intensity={1.5}
        color={acento}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />

      <Galpao />

      {/*
        Arrastar = mover (pan no plano do chão), pinça/scroll = zoom.
        Sem rotação livre, de propósito: visão de maquete, clareza no celular.
      */}
      <MapControls
        ref={controles}
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.12}
        screenSpacePanning={false}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        onChange={prenderNaArea}
      />
    </>
  );
}

export default function Mundo() {
  return (
    <Canvas
      orthographic
      // Regra de performance: só renderiza quando algo muda.
      frameloop="demand"
      dpr={[1, 2]}
      shadows="soft"
      camera={{ position: CAMERA_POS, zoom: zoomInicial(), near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <Cena />
    </Canvas>
  );
}
