import { z } from 'zod';
import dados from '../data/ofertas.json';
import { esquemaOferta, type OfertaBruta } from './schema';

/**
 * Carrega, valida e deriva as ofertas de src/data/ofertas.json.
 *
 * Única porta de entrada dos dados: nenhuma página lê o JSON direto, então a
 * validação nunca é contornada por engano.
 */

/**
 * Preço conferido há mais que isso não é mostrado: o card troca o preço por
 * "Ver preço atual". Preço velho é pior que preço nenhum. O script de preços
 * roda a cada 12h, então com tudo funcionando o preço nunca chega perto disso.
 */
export const VALIDADE_PRECO_DIAS = 2;

export type Oferta = OfertaBruta & {
  /** O preço foi conferido recentemente e pode ser mostrado. */
  precoValido: boolean;
  /** % de desconto, arredondado. Só existe quando há precoDe. */
  desconto?: number;
  /** Quanto o visitante deixa de gastar, em reais. */
  economia?: number;
  /** Para onde o botão aponta. O link de afiliado cru nunca sai daqui. */
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

  // id repetido quebraria o /go e é fácil de cometer copiando uma oferta pra
  // fazer a próxima.
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const oferta of resultado.data) {
    if (vistos.has(oferta.id)) repetidos.add(oferta.id);
    vistos.add(oferta.id);
  }
  if (repetidos.size > 0) {
    throw new Error(
      `src/data/ofertas.json tem id repetido: ${[...repetidos].join(', ')}.\n` +
        'Cada oferta precisa de um id único — ele vira o endereço em /go/<id>.',
    );
  }

  return resultado.data;
}

/** Dias entre duas datas AAAA-MM-DD (b - a). */
function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Hoje, AAAA-MM-DD, no fuso do Brasil (o build roda em UTC). */
function hojeBR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function derivar(oferta: OfertaBruta): Oferta {
  const precoValido =
    oferta.conferidoEm !== undefined && diasEntre(oferta.conferidoEm, hojeBR()) <= VALIDADE_PRECO_DIAS;

  const desconto =
    oferta.precoDe !== undefined
      ? Math.round((1 - oferta.preco / oferta.precoDe) * 100)
      : undefined;

  const economia =
    oferta.precoDe !== undefined
      ? Math.round((oferta.precoDe - oferta.preco) * 100) / 100
      : undefined;

  return { ...oferta, precoValido, desconto, economia, href: `/go/${oferta.id}` };
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
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
