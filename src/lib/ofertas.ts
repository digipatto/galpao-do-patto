import { z } from 'zod';
import dados from '../data/ofertas.json';
import { esquemaOferta, type OfertaBruta } from './schema';

/**
 * Carrega, valida e deriva as ofertas de src/data/ofertas.json.
 *
 * Esta é a ÚNICA porta de entrada dos dados. Nenhuma página lê o JSON direto —
 * assim a validação nunca é contornada por engano.
 */

export type Oferta = OfertaBruta & {
  /** % de desconto, arredondado. Só existe quando há precoDe. */
  desconto?: number;
  /** Quanto o visitante deixa de gastar, em reais. Mais concreto que o %. */
  economia?: number;
  /** Para onde o botão aponta. O link cru nunca sai daqui. */
  href: string;
};

function formatarErro(erro: z.ZodError): string {
  const linhas = erro.issues.map((p) => {
    const onde = p.path.length ? p.path.join('.') : '(raiz)';
    return `  • ${onde}: ${p.message}`;
  });
  return [
    'src/data/ofertas.json tem dado inválido:',
    ...linhas,
    '',
    'Corrija o arquivo e rode de novo. O build não publica dado quebrado.',
  ].join('\n');
}

function validar(): OfertaBruta[] {
  const resultado = z.array(esquemaOferta).safeParse(dados);
  if (!resultado.success) {
    throw new Error(formatarErro(resultado.error));
  }

  // id duplicado quebraria o /go e a chave da lista, e é fácil de cometer
  // copiando uma oferta pra fazer a próxima.
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const oferta of resultado.data) {
    if (vistos.has(oferta.id)) repetidos.add(oferta.id);
    vistos.add(oferta.id);
  }
  if (repetidos.size > 0) {
    throw new Error(
      `src/data/ofertas.json tem id repetido: ${[...repetidos].join(', ')}.\n` +
        'Cada oferta precisa de um id único — ele vira a URL em /go/[id].',
    );
  }

  return resultado.data;
}

function derivar(oferta: OfertaBruta): Oferta {
  const desconto =
    oferta.precoDe !== undefined
      ? Math.round((1 - oferta.preco / oferta.precoDe) * 100)
      : undefined;

  const economia =
    oferta.precoDe !== undefined
      ? Math.round((oferta.precoDe - oferta.preco) * 100) / 100
      : undefined;

  return { ...oferta, desconto, economia, href: `/go/${oferta.id}` };
}

/** Todas as ofertas, da mais nova pra mais antiga. */
export function listarOfertas(): Oferta[] {
  return validar()
    .map(derivar)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Uma oferta pelo id, ou undefined. Usado pelo redirect /go/[id]. */
export function acharOferta(id: string): Oferta | undefined {
  return listarOfertas().find((o) => o.id === id);
}

/** R$ 129,90 */
export function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
