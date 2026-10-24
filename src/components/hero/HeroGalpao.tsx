import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Cena } from './cena';

gsap.registerPlugin(useGSAP);

/**
 * Ilha do hero 3D. Por cima do poster (que já está na página, em HTML), o canvas
 * entra assim que a cena monta. Se não houver WebGL, ou se a pessoa pede menos
 * movimento, não monta nada: o poster fica.
 *
 * O poster está debaixo o tempo todo, então o hero nunca fica vazio esperando.
 */
export default function HeroGalpao() {
  const raiz = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cenaRef = useRef<Cena | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    const caixa = raiz.current;
    if (!el || !caixa) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let vivo = true;
    let cena: Cena | null = null;
    let quadro = 0;
    let visivel = true;
    const limpezas: Array<() => void> = [];

    const laco = (ms: number) => {
      quadro = 0;
      if (!vivo || !cena || !visivel || document.hidden) return;
      cena.render(ms / 1000);
      quadro = requestAnimationFrame(laco);
    };
    const acordar = () => {
      if (!quadro && vivo && cena && visivel && !document.hidden) quadro = requestAnimationFrame(laco);
    };

    import('./cena')
      .then(({ montarCena }) => montarCena(el))
      .then((c) => {
        if (!vivo) {
          c.dispose();
          return;
        }
        cena = c;
        cenaRef.current = c;

        const medir = () => c.resize(caixa.clientWidth, caixa.clientHeight);
        medir();
        const ro = new ResizeObserver(() => {
          medir();
          acordar();
        });
        ro.observe(caixa);
        limpezas.push(() => ro.disconnect());

        // O hero é vitrine: o laço só roda com ele na tela e a aba à vista.
        const io = new IntersectionObserver(([e]) => {
          visivel = e.isIntersecting;
          acordar();
        });
        io.observe(caixa);
        limpezas.push(() => io.disconnect());
        document.addEventListener('visibilitychange', acordar);
        limpezas.push(() => document.removeEventListener('visibilitychange', acordar));

        // Parallax leve: a câmera segue o cursor.
        const mover = (e: PointerEvent) => {
          c.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
          c.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('pointermove', mover, { passive: true });
        limpezas.push(() => window.removeEventListener('pointermove', mover));

        c.render(0);
        setPronto(true);
        acordar();
      })
      .catch(() => {
        /* sem WebGL ou falha ao montar: o poster continua à vista */
      });

    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
      limpezas.forEach((f) => f());
      cena?.dispose();
      cenaRef.current = null;
    };
  }, []);

  // Entrada: o canvas aparece sobre o poster (idêntico, então ninguém vê a troca)
  // e a câmera faz um movimento curto de apresentação.
  useGSAP(
    () => {
      const cena = cenaRef.current;
      if (!pronto || !cena) return;
      gsap.to(canvas.current, { opacity: 1, duration: 0.35, ease: 'power1.out' });
      gsap.fromTo(
        cena.estado,
        { avanco: 0.4, holo: 0.4 },
        { avanco: 0, holo: 1, duration: 2.2, ease: 'power3.out' },
      );
    },
    { dependencies: [pronto], scope: raiz },
  );

  return (
    <div ref={raiz} className="hero-3d" aria-hidden="true">
      <canvas ref={canvas} style={{ opacity: 0 }} />
    </div>
  );
}
