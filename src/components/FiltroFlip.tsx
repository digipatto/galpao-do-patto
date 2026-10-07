import { useId, useState } from 'react';

/**
 * O filtro de curadoria num card que vira.
 *
 * Adaptado do @kokonutui/card-flip. Duas mudanças que o original não tinha e
 * que este público exige:
 *  - vira no TOQUE, não só no hover. O visitante vem do Instagram, no celular,
 *    onde hover não existe — o componente original nunca viraria pra ele.
 *  - é um <button> de verdade, então teclado e leitor de tela funcionam.
 *
 * Por que o filtro e não o produto: o card do produto não pode virar, senão o
 * link de afiliado fica a dois toques. Aqui o conteúdo é secundário e o gesto
 * cabe.
 */

const CRITERIOS = [
  {
    titulo: 'O histórico de preço',
    texto: 'Se o desconto apareceu junto com o cartaz, é encenação. Só entra o que está mais barato que a média recente.',
  },
  {
    titulo: 'A reputação do vendedor',
    texto: 'Preço bom com vendedor ruim é dor de cabeça com desconto. Olho reputação, volume e as perguntas recentes.',
  },
  {
    titulo: 'As avaliações de 3 estrelas',
    texto: 'As de 5 são entusiasmo, as de 1 são frete atrasado. As de 3 contam a verdade sobre o produto.',
  },
  {
    titulo: 'O preço final',
    texto: 'Frete, cupom e parcelamento mudam a conta. O mais barato nem sempre é o que sai mais barato.',
  },
];

export default function FiltroFlip() {
  const [virado, setVirado] = useState(false);
  const id = useId();

  return (
    <div className="filtro" data-virado={virado || undefined}>
      <button
        type="button"
        className="filtro-gatilho"
        aria-expanded={virado}
        aria-controls={id}
        onClick={() => setVirado((v) => !v)}
        onMouseEnter={() => setVirado(true)}
        onMouseLeave={() => setVirado(false)}
      >
        <span className="filtro-palco">
          <span className="filtro-face filtro-frente">
            <span className="filtro-numero numeros">4</span>
            <span className="filtro-titulo">perguntas antes de postar</span>
            <span className="filtro-dica">
              {virado ? 'Esconder' : 'Ver o filtro'}
            </span>
          </span>

          <span className="filtro-face filtro-verso" id={id}>
            <ol className="filtro-lista">
              {CRITERIOS.map((c) => (
                <li key={c.titulo}>
                  <strong>{c.titulo}</strong>
                  <span>{c.texto}</span>
                </li>
              ))}
            </ol>
          </span>
        </span>
      </button>
    </div>
  );
}
