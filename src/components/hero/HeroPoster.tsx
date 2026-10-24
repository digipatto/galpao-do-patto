import { useEffect, useRef } from 'react';

/**
 * Só pra fotografar o poster (/hero-poster): monta a mesma cena, parada e
 * determinística, e avisa quando terminou em window.__heroPronto.
 */
export default function HeroPoster() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let cena: { dispose(): void } | null = null;
    import('./cena').then(async ({ montarCena }) => {
      const c = await montarCena(el, { estatica: true });
      cena = c;
      c.resize(el.clientWidth, el.clientHeight);
      c.render(0);
      (window as unknown as { __heroPronto: boolean }).__heroPronto = true;
    });
    return () => cena?.dispose();
  }, []);

  return <canvas ref={canvas} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
