import { useEffect, useMemo, useState } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { invalidate } from '@react-three/fiber';
import * as THREE from 'three';
import { useCorToken } from './hooks/useCorToken';

/**
 * Parte 2 — o kit do galpão: ambiente estático e modular.
 *
 * Direção: minimalista. Poucas peças, muito respiro, neon só onde significa
 * alguma coisa. O galpão tem que ler num piscar de olho — se precisa de
 * esforço pra entender o que é, tem elemento sobrando.
 *
 * NENHUM produto mora neste arquivo — produto vem dos dados na Parte 3.
 * Peças repetidas são InstancedMesh, porque o galpão cresce.
 *
 * Geometria é primitivo, de propósito (placeholder-first, seção 10 do plano).
 */

/**
 * As medidas do galpão, num lugar só.
 * A Parte 3 importa isto no `layout.ts` pra encaixar os produtos nas
 * prateleiras — as vagas precisam cair exatamente em cima destes racks.
 */
export const GALPAO = {
  piso: { largura: 46, profundidade: 32 },
  parede: { altura: 6, fundoZ: -16 },
  rack: { largura: 4.6, profundidade: 1.8, altura: 4.2, niveis: 3 },
  /** z de cada fileira de racks. */
  fileirasZ: [-10, 0, 10],
  /** z de cada corredor, entre as fileiras. */
  corredoresZ: [-5, 5],
  /** vagas (racks) por fileira, da esquerda pra direita. */
  vagasPorFileira: 6,
  vagaXInicial: -16.5,
  vagaPassoX: 6.6,
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

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[largura, profundidade]} />
        <meshStandardMaterial color={piso} roughness={0.82} metalness={0.1} />
      </mesh>

      {/* Duas linhas-guia, discretas. Marcam o corredor, não competem com nada. */}
      {GALPAO.corredoresZ.map((z) => (
        <mesh key={z} position={[0, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[largura - 10, 0.22]} />
          <meshBasicMaterial color={holo} toneMapped={false} transparent opacity={0.26} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Prateleiras (racks)                                                 */
/* ------------------------------------------------------------------ */

function Prateleiras() {
  const metal = useCorToken('--mundo-metal-claro', '#3a4356');
  const tabua = useCorToken('--mundo-metal-topo', '#6f7b93');

  const { rack, fileirasZ, vagasPorFileira } = GALPAO;

  const { montantes, tabuas } = useMemo(() => {
    const montantes: Ponto[] = [];
    const tabuas: Ponto[] = [];

    const meiaLargura = rack.largura / 2;
    const meiaProfundidade = rack.profundidade / 2;
    const alturaNivel = rack.altura / (rack.niveis + 0.4);

    for (const z of fileirasZ) {
      for (let vaga = 0; vaga < vagasPorFileira; vaga++) {
        const x = vagaX(vaga);

        for (const dx of [-meiaLargura, meiaLargura]) {
          for (const dz of [-meiaProfundidade, meiaProfundidade]) {
            montantes.push([x + dx, rack.altura / 2, z + dz]);
          }
        }

        for (let n = 1; n <= rack.niveis; n++) {
          tabuas.push([x, n * alturaNivel, z]);
        }
      }
    }

    return { montantes, tabuas };
  }, [rack, fileirasZ, vagasPorFileira]);

  return (
    <group>
      <Instances limit={montantes.length} castShadow receiveShadow>
        <boxGeometry args={[0.14, GALPAO.rack.altura, 0.14]} />
        <meshStandardMaterial color={metal} roughness={0.5} metalness={0.6} />
        {montantes.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>

      {/* As tábuas são a superfície que pega luz — mais claras, dão a leitura
          de prateleira. É o que faz o rack aparecer contra o piso escuro. */}
      <Instances limit={tabuas.length} castShadow receiveShadow>
        <boxGeometry args={[GALPAO.rack.largura, 0.12, GALPAO.rack.profundidade]} />
        <meshStandardMaterial color={tabua} roughness={0.65} metalness={0.25} />
        {tabuas.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Parede de vidro                                                     */
/* ------------------------------------------------------------------ */

function ParedeDeVidro() {
  const vidro = useCorToken('--mundo-vidro', '#3fe0d0');
  const metal = useCorToken('--mundo-metal-claro', '#3a4356');
  const acento = useCorToken('--acento', '#ffc400');

  const { altura, fundoZ } = GALPAO.parede;
  const { largura } = GALPAO.piso;

  // Só a parede do fundo. A lateral fechada da versão anterior virava um
  // bloco preto na vista isométrica — sem ela o galpão respira.
  const caixilhos = useMemo<Ponto[]>(() => {
    const lista: Ponto[] = [];
    for (let x = -largura / 2; x <= largura / 2 + 0.001; x += 5.75) {
      lista.push([x, altura / 2, fundoZ]);
    }
    return lista;
  }, [largura, altura, fundoZ]);

  return (
    <group>
      {/* Transparência simples de propósito: `transmission` do
          MeshPhysicalMaterial é bonito e caro demais pro orçamento mobile. */}
      <mesh position={[0, altura / 2, fundoZ]}>
        <planeGeometry args={[largura, altura]} />
        <meshStandardMaterial
          color={vidro}
          transparent
          opacity={0.14}
          roughness={0.1}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Instances limit={caixilhos.length}>
        <boxGeometry args={[0.1, altura, 0.1]} />
        <meshStandardMaterial color={metal} roughness={0.45} metalness={0.65} />
        {caixilhos.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>

      {/*
        A viga de topo É a luz do galpão. Tentei fitas de LED soltas no teto
        duas vezes: em projeção isométrica uma linha fina e brilhante lê como
        arranhão, e baixa demais ela cai em cima das prateleiras. Na viga a luz
        vira arquitetura, fica no fundo e não atravessa nada.
      */}
      <mesh position={[0, altura, fundoZ]}>
        <boxGeometry args={[largura, 0.18, 0.24]} />
        <meshStandardMaterial
          color={metal}
          emissive={acento}
          emissiveIntensity={0.35}
          roughness={0.45}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Letreiro holográfico                                                */
/* ------------------------------------------------------------------ */

const LETREIRO_TEXTO = 'O GALPÃO DO PATTO';
const LETREIRO_LARGURA = 13;
const LETREIRO_ALTURA = 3.25; // 4:1, igual ao canvas

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
      const fonte = (px: number) =>
        `700 ${px}px "Clash Display", "Space Grotesk", sans-serif`;

      // Encolhe até caber. Sem isso o texto vaza do canvas e aparece cortado —
      // e a largura depende da fonte que o navegador conseguiu carregar.
      const util = canvas.width - 72;
      let px = 112;
      ctx.font = fonte(px);
      while (ctx.measureText(LETREIRO_TEXTO).width > util && px > 24) {
        px -= 2;
        ctx.font = fonte(px);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = fonte(px);
      ctx.fillStyle = holo;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LETREIRO_TEXTO, canvas.width / 2, canvas.height / 2);
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
    // Holograma solto no ar, sobre o fundo do galpão. A rotação de 45° encara
    // a câmera isométrica de frente — como ela nunca gira, o letreiro fica
    // sempre legível, sem precisar de billboard por frame.
    <group position={[-1, GALPAO.parede.altura + 5, -13]} rotation={[0, Math.PI / 4, 0]}>
      <mesh>
        <planeGeometry args={[LETREIRO_LARGURA, LETREIRO_ALTURA]} />
        <meshBasicMaterial
          map={textura}
          toneMapped={false}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
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
      <ParedeDeVidro />
      <Letreiro />
    </group>
  );
}
