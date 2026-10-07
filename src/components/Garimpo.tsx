import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * O garimpo — o campo de achados, em WebGL.
 *
 * O que ele desenha é o posicionamento do site, não enfeite: dezenas de
 * caixas apagadas (o que foi descartado) e as poucas acesas (o que passou no
 * filtro). Quanto mais produtos publicados, mais caixas acendem — o visual
 * cresce com o catálogo sem ninguém tocar nele.
 *
 * Regras que ele respeita:
 *  - sem WebGL, o componente não renderiza nada e a página segue inteira;
 *  - `prefers-reduced-motion` desenha um quadro e para;
 *  - fora da tela, o laço de animação pausa (bateria do celular);
 *  - toque e mouse inclinam o campo; nada depende de hover pra funcionar.
 */

interface Props {
  /** Quantos achados aprovados acender. Vem do tamanho do catálogo. */
  aprovados?: number;
  /** Quantas caixas descartadas desenhar ao redor. */
  descartados?: number;
}

/** Aleatório com semente: mesmo campo em todo carregamento, sem piscar. */
function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default function Garimpo({ aprovados = 1, descartados = 88 }: Props) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = alvo.current;
    if (!host) return;

    // Sem WebGL a seção simplesmente não ganha o campo. Nada quebra.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }

    const paradoPorPreferencia = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const lerToken = (nome: string, reserva: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || reserva;

    const corDescartado = new THREE.Color(lerToken('--superficie-alta', '#24314b'));
    const corAprovado = new THREE.Color(lerToken('--marca', '#e8913f'));
    const corLuz = new THREE.Color(lerToken('--texto', '#f5f1e8'));
    const corTerno = new THREE.Color(lerToken('--terno', '#3a5a86'));

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearAlpha(0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      host.clientWidth / host.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 17);

    cena.add(new THREE.AmbientLight(corLuz, 0.75));
    const direcional = new THREE.DirectionalLight(corLuz, 2.1);
    direcional.position.set(5, 8, 7);
    cena.add(direcional);
    const preenchimento = new THREE.DirectionalLight(corTerno, 1.1);
    preenchimento.position.set(-7, -3, 4);
    cena.add(preenchimento);

    const campo = new THREE.Group();
    cena.add(campo);

    // Uma só geometria pros dois grupos: caixa com quina arredondada, que é o
    // que diferencia "pacote" de "cubo de tutorial".
    const geometria = new RoundedBoxGeometry(1, 1, 1, 3, 0.16);

    const materialDescartado = new THREE.MeshStandardMaterial({
      color: corDescartado,
      roughness: 0.72,
      metalness: 0.15,
      transparent: true,
      opacity: 0.5,
    });

    const materialAprovado = new THREE.MeshStandardMaterial({
      color: corAprovado,
      roughness: 0.35,
      metalness: 0.25,
      emissive: corAprovado,
      emissiveIntensity: 0.55,
    });

    const malhaDescartados = new THREE.InstancedMesh(
      geometria,
      materialDescartado,
      descartados,
    );
    const malhaAprovados = new THREE.InstancedMesh(
      geometria,
      materialAprovado,
      Math.max(aprovados, 1),
    );
    campo.add(malhaDescartados, malhaAprovados);

    interface Caixa {
      base: THREE.Vector3;
      giro: THREE.Euler;
      escala: number;
      fase: number;
      velocidade: number;
    }

    const aleatorio = sorteio(20261007);
    const montarCaixas = (quantos: number, raio: number, menor: number, maior: number) => {
      const lista: Caixa[] = [];
      for (let i = 0; i < quantos; i++) {
        // Distribuição em casca esférica achatada: nada no centro, pra não
        // tapar o conteúdo que fica por cima.
        const angulo = aleatorio() * Math.PI * 2;
        const altura = (aleatorio() - 0.5) * 2;
        const distancia = raio * (0.55 + aleatorio() * 0.45);
        lista.push({
          base: new THREE.Vector3(
            Math.cos(angulo) * distancia,
            altura * raio * 0.52,
            Math.sin(angulo) * distancia * 0.75 - aleatorio() * 4,
          ),
          giro: new THREE.Euler(
            aleatorio() * Math.PI,
            aleatorio() * Math.PI,
            aleatorio() * Math.PI,
          ),
          escala: menor + aleatorio() * (maior - menor),
          fase: aleatorio() * Math.PI * 2,
          velocidade: 0.25 + aleatorio() * 0.4,
        });
      }
      return lista;
    };

    const caixasDescartadas = montarCaixas(descartados, 11, 0.38, 0.92);

    // O primeiro aprovado tem posição fixa, à esquerda e abaixo do centro:
    // solto ao acaso ele caía em cima do Patto e os dois brigavam. Do segundo
    // em diante é o sorteio que decide, espalhando pelo campo.
    const caixasAprovadas = montarCaixas(Math.max(aprovados, 1), 4.2, 1.15, 1.5).map(
      (c, i) => ({
        ...c,
        escala: i === 0 ? 1.35 : c.escala,
        base: new THREE.Vector3(
          i === 0 ? -0.8 : c.base.x * 0.8,
          i === 0 ? -0.3 : c.base.y * 0.7,
          i === 0 ? 2.8 : c.base.z * 0.6 + 1.2,
        ),
      }),
    );

    const matriz = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const posicao = new THREE.Vector3();
    const escala = new THREE.Vector3();

    const posicionar = (
      malha: THREE.InstancedMesh,
      caixas: Caixa[],
      t: number,
      amplitude: number,
    ) => {
      for (let i = 0; i < caixas.length; i++) {
        const c = caixas[i];
        posicao.copy(c.base);
        posicao.y += Math.sin(t * c.velocidade + c.fase) * amplitude;
        quaternion.setFromEuler(
          new THREE.Euler(
            c.giro.x + t * 0.08 * c.velocidade,
            c.giro.y + t * 0.11 * c.velocidade,
            c.giro.z,
          ),
        );
        escala.setScalar(c.escala);
        matriz.compose(posicao, quaternion, escala);
        malha.setMatrixAt(i, matriz);
      }
      malha.instanceMatrix.needsUpdate = true;
    };

    // Inclinação pelo ponteiro ou pelo toque. Sem isso o campo é um papel de
    // parede; com isso o visitante percebe que é um objeto.
    const desejado = { x: 0, y: 0 };
    const atual = { x: 0, y: 0 };

    const aoMover = (ev: PointerEvent) => {
      const r = host.getBoundingClientRect();
      desejado.x = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      desejado.y = ((ev.clientY - r.top) / r.height - 0.5) * 2;
    };
    const aoSair = () => {
      desejado.x = 0;
      desejado.y = 0;
    };
    host.addEventListener('pointermove', aoMover, { passive: true });
    host.addEventListener('pointerleave', aoSair, { passive: true });

    const aoRedimensionar = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const observadorTamanho = new ResizeObserver(aoRedimensionar);
    observadorTamanho.observe(host);

    let quadro = 0;
    let visivel = true;
    // performance.now() em vez de THREE.Clock, que o three 0.186 depreciou.
    const inicio = performance.now();

    const desenhar = () => {
      const t = (performance.now() - inicio) / 1000;

      atual.x += (desejado.x - atual.x) * 0.045;
      atual.y += (desejado.y - atual.y) * 0.045;

      campo.rotation.y = t * 0.045 + atual.x * 0.3;
      campo.rotation.x = atual.y * 0.2;

      posicionar(malhaDescartados, caixasDescartadas, t, 0.22);
      posicionar(malhaAprovados, caixasAprovadas, t, 0.14);

      materialAprovado.emissiveIntensity = 0.5 + Math.sin(t * 1.1) * 0.12;

      renderer.render(cena, camera);
      if (visivel) quadro = requestAnimationFrame(desenhar);
    };

    if (paradoPorPreferencia) {
      posicionar(malhaDescartados, caixasDescartadas, 0, 0);
      posicionar(malhaAprovados, caixasAprovadas, 0, 0);
      renderer.render(cena, camera);
    } else {
      // Fora da tela não gasta bateria desenhando.
      const observadorVisao = new IntersectionObserver(
        ([entrada]) => {
          visivel = entrada.isIntersecting;
          if (visivel && !quadro) {
            quadro = requestAnimationFrame(desenhar);
          } else if (!visivel && quadro) {
            cancelAnimationFrame(quadro);
            quadro = 0;
          }
        },
        { threshold: 0 },
      );
      observadorVisao.observe(host);
      quadro = requestAnimationFrame(desenhar);

      return () => {
        observadorVisao.disconnect();
        cancelAnimationFrame(quadro);
        observadorTamanho.disconnect();
        host.removeEventListener('pointermove', aoMover);
        host.removeEventListener('pointerleave', aoSair);
        geometria.dispose();
        materialDescartado.dispose();
        materialAprovado.dispose();
        renderer.dispose();
        host.removeChild(renderer.domElement);
      };
    }

    return () => {
      observadorTamanho.disconnect();
      host.removeEventListener('pointermove', aoMover);
      host.removeEventListener('pointerleave', aoSair);
      geometria.dispose();
      materialDescartado.dispose();
      materialAprovado.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [aprovados, descartados]);

  return <div ref={alvo} className="garimpo" aria-hidden="true" />;
}
