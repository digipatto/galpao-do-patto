import { useEffect, useMemo, useState } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { invalidate } from '@react-three/fiber';
import * as THREE from 'three';
import { useCorToken } from './hooks/useCorToken';

/**
 * Parte 2 — o kit do galpão: ambiente estático e modular.
 *
 * Tudo aqui é cenário: piso, prateleiras, parede de vidro, LED de teto e o
 * letreiro da marca. NENHUM produto mora neste arquivo — produto vem dos dados
 * na Parte 3. As peças repetidas são InstancedMesh desde já, porque o galpão
 * cresce e isso não pode virar milhares de draw calls.
 *
 * Geometria é primitivo, de propósito (placeholder-first, seção 10 do plano).
 * Trocar por .glb com Draco depois não muda nada fora deste arquivo.
 */

/**
 * As medidas do galpão, num lugar só.
 * A Parte 3 vai importar isto no `layout.ts` pra encaixar os produtos nas
 * prateleiras — as vagas precisam cair exatamente em cima destes racks.
 */
export const GALPAO = {
  piso: { largura: 64, profundidade: 44 },
  parede: { altura: 10, fundoZ: -22, lateralX: -32 },
  teto: { altura: 9 },
  rack: { largura: 4.2, profundidade: 1.6, altura: 5.2, niveis: 4 },
  /** z de cada fileira de racks. */
  fileirasZ: [-16, -8, 8, 16],
  /** z de cada corredor, entre as fileiras. */
  corredoresZ: [-12, 0, 12],
  /** vagas (racks) por fileira, da esquerda pra direita. */
  vagasPorFileira: 10,
  vagaXInicial: -24.75,
  vagaPassoX: 5.5,
} as const;

/** x do centro de uma vaga, contando da esquerda. */
export function vagaX(indice: number) {
  return GALPAO.vagaXInicial + indice * GALPAO.vagaPassoX;
}

type Ponto = [number, number, number];

/* ------------------------------------------------------------------ */
/* Piso + linhas-guia                                                  */
/* ------------------------------------------------------------------ */

function Piso() {
  const piso = useCorToken('--mundo-piso', '#15203c');
  const holo = useCorToken('--holo', '#3fe0d0');

  const { largura, profundidade } = GALPAO.piso;

  // Linhas-guia dos corredores: fitas finas no chão, como num CD de verdade.
  const guias = useMemo<Ponto[]>(
    () => GALPAO.corredoresZ.map((z) => [0, 0.015, z]),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[largura, profundidade]} />
        <meshStandardMaterial color={piso} roughness={0.85} metalness={0.08} />
      </mesh>

      <Instances limit={16}>
        <boxGeometry args={[largura - 8, 0.02, 0.22]} />
        {/* toneMapped={false} mantém o neon saturado depois do tone mapping. */}
        <meshBasicMaterial color={holo} toneMapped={false} transparent opacity={0.5} />
        {guias.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Prateleiras (racks) — o grosso do instancing                        */
/* ------------------------------------------------------------------ */

function Prateleiras() {
  const metal = useCorToken('--mundo-metal', '#262d3d');
  const metalClaro = useCorToken('--mundo-metal-claro', '#3a4356');
  const acento = useCorToken('--acento', '#ffc400');

  const { rack, fileirasZ, vagasPorFileira } = GALPAO;

  const { montantes, tabuas, faixas } = useMemo(() => {
    const montantes: Ponto[] = [];
    const tabuas: Ponto[] = [];
    const faixas: Ponto[] = [];

    const meiaLargura = rack.largura / 2;
    const meiaProfundidade = rack.profundidade / 2;
    // Níveis distribuídos de baixo pra cima, sem encostar no topo.
    const alturaNivel = rack.altura / (rack.niveis + 0.5);

    for (const z of fileirasZ) {
      for (let vaga = 0; vaga < vagasPorFileira; vaga++) {
        const x = vagaX(vaga);

        // 4 montantes nos cantos.
        for (const dx of [-meiaLargura, meiaLargura]) {
          for (const dz of [-meiaProfundidade, meiaProfundidade]) {
            montantes.push([x + dx, rack.altura / 2, z + dz]);
          }
        }

        // Tábuas: uma por nível.
        for (let n = 1; n <= rack.niveis; n++) {
          tabuas.push([x, n * alturaNivel, z]);
        }

        // Faixa âmbar na base — sinalização de vaga.
        faixas.push([x, 0.06, z + meiaProfundidade + 0.1]);
      }
    }

    return { montantes, tabuas, faixas };
  }, [rack, fileirasZ, vagasPorFileira]);

  return (
    <group>
      <Instances limit={montantes.length} castShadow receiveShadow>
        <boxGeometry args={[0.16, GALPAO.rack.altura, 0.16]} />
        <meshStandardMaterial color={metal} roughness={0.42} metalness={0.72} />
        {montantes.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>

      <Instances limit={tabuas.length} castShadow receiveShadow>
        <boxGeometry args={[GALPAO.rack.largura, 0.1, GALPAO.rack.profundidade]} />
        <meshStandardMaterial color={metalClaro} roughness={0.6} metalness={0.35} />
        {tabuas.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>

      <Instances limit={faixas.length}>
        <boxGeometry args={[GALPAO.rack.largura, 0.03, 0.14]} />
        <meshBasicMaterial color={acento} toneMapped={false} transparent opacity={0.55} />
        {faixas.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Parede de vidro + parede lateral                                    */
/* ------------------------------------------------------------------ */

function Paredes() {
  const vidro = useCorToken('--mundo-vidro', '#3fe0d0');
  const metal = useCorToken('--mundo-metal', '#262d3d');

  const { altura, fundoZ, lateralX } = GALPAO.parede;
  const { largura, profundidade } = GALPAO.piso;

  // Montantes verticais do vidro, a cada 4 unidades.
  const caixilhos = useMemo<Ponto[]>(() => {
    const lista: Ponto[] = [];
    for (let x = -largura / 2; x <= largura / 2; x += 4) {
      lista.push([x, altura / 2, fundoZ]);
    }
    return lista;
  }, [largura, altura, fundoZ]);

  return (
    <group>
      {/* Vidro: transparência simples de propósito. `transmission` do
          MeshPhysicalMaterial é bonito e caro demais pro orçamento mobile. */}
      <mesh position={[0, altura / 2, fundoZ]}>
        <planeGeometry args={[largura, altura]} />
        <meshStandardMaterial
          color={vidro}
          transparent
          opacity={0.1}
          roughness={0.08}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Instances limit={caixilhos.length}>
        <boxGeometry args={[0.12, altura, 0.12]} />
        <meshStandardMaterial color={metal} roughness={0.4} metalness={0.7} />
        {caixilhos.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>

      {/* Parede lateral fechada, pra ancorar a vista isométrica. */}
      <mesh position={[lateralX, altura / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[profundidade, altura]} />
        <meshStandardMaterial color={metal} roughness={0.9} metalness={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Fitas de LED no teto                                                */
/* ------------------------------------------------------------------ */

function LuzesDeTeto() {
  const acento = useCorToken('--acento', '#ffc400');
  const { largura } = GALPAO.piso;

  // Sobre cada corredor. Sem malha de teto: a vista isométrica precisa do topo
  // aberto, então só as fitas ficam penduradas no ar.
  const fitas = useMemo<Ponto[]>(
    () => GALPAO.corredoresZ.map((z) => [0, GALPAO.teto.altura, z]),
    [],
  );

  return (
    <Instances limit={fitas.length}>
      <boxGeometry args={[largura - 10, 0.14, 0.4]} />
      <meshBasicMaterial color={acento} toneMapped={false} />
      {fitas.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  );
}

/* ------------------------------------------------------------------ */
/* Letreiro holográfico                                                */
/* ------------------------------------------------------------------ */

const LETREIRO_TEXTO = 'O GALPÃO DO PATTO';
const LETREIRO_LARGURA = 19;
const LETREIRO_ALTURA = 4.75; // 4:1, igual ao canvas

function Letreiro() {
  const holo = useCorToken('--holo', '#3fe0d0');

  // A marca é desenhada num <canvas> 2D e vira textura. Assim o letreiro usa a
  // MESMA Clash Display da página, sem baixar fonte extra pro 3D nem puxar o
  // troika pro bundle.
  const [fontesProntas, setFontesProntas] = useState(false);

  useEffect(() => {
    let vivo = true;
    document.fonts?.ready.then(() => {
      if (!vivo) return;
      setFontesProntas(true);
      invalidate(); // frameloop="demand": precisa pedir o redesenho
    });
    return () => {
      vivo = false;
    };
  }, []);

  const textura = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '700 118px "Clash Display", "Space Grotesk", sans-serif';
      ctx.fillStyle = holo;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LETREIRO_TEXTO, canvas.width / 2, canvas.height / 2 + 6);
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // `fontesProntas` entra de propósito: redesenha quando a Clash Display
    // termina de carregar, senão o letreiro congela no fallback.
  }, [holo, fontesProntas]);

  useEffect(() => () => textura.dispose(), [textura]);

  return (
    // Virado 45° pra encarar a câmera isométrica de frente.
    <group position={[-4, 7.2, -13]} rotation={[0, Math.PI / 4, 0]}>
      {/* Brilho atrás do texto. */}
      <mesh>
        <planeGeometry args={[LETREIRO_LARGURA + 1.4, LETREIRO_ALTURA + 1]} />
        <meshBasicMaterial
          color={holo}
          toneMapped={false}
          transparent
          opacity={0.07}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[LETREIRO_LARGURA, LETREIRO_ALTURA]} />
        <meshBasicMaterial
          map={textura}
          toneMapped={false}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Linha de base, pra dar leitura de holograma projetado. */}
      <mesh position={[0, -LETREIRO_ALTURA / 2 - 0.5, 0.01]}>
        <planeGeometry args={[LETREIRO_LARGURA, 0.06]} />
        <meshBasicMaterial color={holo} toneMapped={false} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function Galpao() {
  return (
    <group>
      <Piso />
      <Prateleiras />
      <Paredes />
      <LuzesDeTeto />
      <Letreiro />
    </group>
  );
}
