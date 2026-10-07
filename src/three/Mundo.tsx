import { useCallback, useRef } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { Grid, MapControls } from '@react-three/drei';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import { useCorToken } from './hooks/useCorToken';

/**
 * Parte 1 — o mundo vazio: <Canvas>, câmera isométrica, luz e navegação.
 *
 * O galpão em si (piso, prateleiras, parede de vidro) entra na Parte 2;
 * os produtos vêm dos dados na Parte 3. Aqui não há nada hardcodado de cena
 * além da grade de referência, que é andaime temporário.
 */

/** Até onde dá pra arrastar, em unidades de mundo, a partir do centro. */
const LIMITE_PAN = 32;

/** Limites de zoom da câmera ortográfica. Crescem junto com o galpão na Parte 6. */
const ZOOM_MIN = 16;
const ZOOM_MAX = 110;

/** Posição isométrica clássica: 45° na horizontal, ~35° de inclinação. */
const CAMERA_POS: [number, number, number] = [24, 24, 24];

function prender(valor: number, limite: number) {
  return Math.min(limite, Math.max(-limite, valor));
}

function Cena() {
  const fundo = useCorToken('--fundo', '#0f1320');
  const holo = useCorToken('--holo', '#3fe0d0');
  const linha = useCorToken('--superficie-borda', '#262d3d');
  const acento = useCorToken('--acento', '#ffc400');

  const controles = useRef<MapControlsImpl>(null);

  // Impede que o visitante arraste pro infinito e perca o mundo de vista.
  // Move alvo e câmera pelo mesmo delta, pra não desalinhar o enquadramento.
  const prenderNaArea = useCallback(() => {
    const c = controles.current;
    if (!c) return;

    const alvo = c.target;
    const dx = prender(alvo.x, LIMITE_PAN) - alvo.x;
    const dz = prender(alvo.z, LIMITE_PAN) - alvo.z;
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

      {/* Luz base. O clima de verdade (emissivos, LED, sombra) é da Parte 5. */}
      <hemisphereLight args={[holo, fundo, 1.1]} />
      <directionalLight position={[12, 20, 8]} intensity={1.4} color={acento} />

      {/*
        ANDAIME DA PARTE 1 — grade de referência.
        Sem ela não dá pra perceber que o arrastar e o zoom funcionam: um
        <Canvas> vazio é um retângulo azul parado. Isto NÃO é o piso do galpão:
        a Parte 2 substitui por piso de verdade com linhas-guia, e esta grade sai.
      */}
      <Grid
        args={[80, 80]}
        cellSize={2}
        cellThickness={0.6}
        cellColor={linha}
        sectionSize={10}
        sectionThickness={1.1}
        sectionColor={holo}
        fadeDistance={95}
        fadeStrength={1.5}
        infiniteGrid={false}
      />

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
      // Sombra custa caro e não tem o que sombrear ainda; liga na Parte 2.
      shadows={false}
      camera={{ position: CAMERA_POS, zoom: 38, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <Cena />
    </Canvas>
  );
}
