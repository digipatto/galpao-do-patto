import { useCallback, useEffect, useRef } from 'react';
import { Canvas, invalidate, useThree } from '@react-three/fiber';
import type { OrthographicCamera } from 'three';
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
 * Enquadramento, calculado pelo tamanho real do canvas.
 *
 * Numa câmera ortográfica o mundo visível é `pixels / zoom`, então um zoom fixo
 * que fica bom no desktop deixa o celular colado numa prateleira.
 *
 * O cálculo mora num componente dentro do <Canvas>, e não numa prop, porque
 * `window.innerWidth` na hora de montar pode não ser o tamanho final — o layout
 * ainda está assentando. Lido daqui, o tamanho é o que o R3F mediu de verdade,
 * e ele se corrige sozinho quando a tela muda (girar o celular, por exemplo).
 */
function calcularZoom(largura: number, altura: number) {
  const estreito = largura < 640;

  // O galpão projetado em isometria tem ~55 unidades de largura. No celular
  // vale enxergar ele inteiro de cara, mesmo pequeno: é o "parece um galpão"
  // que importa na primeira impressão. Dá pra chegar perto com a pinça.
  const mundoNaLargura = estreito ? 60 : 52;
  const mundoNaAltura = estreito ? 54 : 36;

  const zoom = Math.min(largura / mundoNaLargura, altura / mundoNaAltura);
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

/**
 * Reenquadra enquanto o visitante não tocou na cena. Depois do primeiro
 * arrastar ou pinçar, a câmera é dele — redimensionar não joga a vista fora
 * do lugar que ele escolheu.
 */
function Enquadramento({ automatico }: { automatico: React.RefObject<boolean> }) {
  const camera = useThree((estado) => estado.camera) as OrthographicCamera;
  const tamanho = useThree((estado) => estado.size);

  useEffect(() => {
    if (!automatico.current) return;
    camera.zoom = calcularZoom(tamanho.width, tamanho.height);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, tamanho, automatico]);

  return null;
}

function Cena() {
  const fundo = useCorToken('--fundo', '#0f1320');
  const holo = useCorToken('--holo', '#3fe0d0');
  const luz = useCorToken('--mundo-luz', '#fbf8f1');
  const metal = useCorToken('--mundo-metal-claro', '#3a4356');

  const controles = useRef<MapControlsImpl>(null);
  const enquadrarAuto = useRef(true);

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

      {/* Preenchimento frio por cima, escuro do chão — dá volume sem custo.
          Generoso de propósito: a versão anterior ficou escura demais e os
          racks sumiam no piso. */}
      <hemisphereLight args={[holo, metal, 1.15]} />
      <ambientLight intensity={0.7} />

      {/*
        UMA luz com sombra, mapa pequeno: é a regra de performance do plano.
        O frustum da sombra é apertado na área do galpão de propósito — quanto
        menor, mais nítida a sombra pro mesmo tamanho de mapa.
      */}
      <directionalLight
        position={[26, 34, 18]}
        intensity={1.7}
        // Branco-creme, nao ambar: a luz ambar tingia a cena inteira de
        // amarelo-esverdeado. Ambar agora e so acento (luminaria, etiqueta).
        color={luz}
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

      <Enquadramento automatico={enquadrarAuto} />

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
        // Alvo acima do piso: centraliza o galpão com a parede e o letreiro
        // dentro do quadro, em vez de cortar o topo.
        target={[0, 3, 0]}
        screenSpacePanning={false}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        onChange={prenderNaArea}
        onStart={() => {
          enquadrarAuto.current = false;
        }}
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
      // O zoom real vem do <Enquadramento>, que mede o canvas. Este valor é só
      // pra primeira matriz de projeção não nascer absurda.
      camera={{ position: CAMERA_POS, zoom: 14, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <Cena />
    </Canvas>
  );
}
