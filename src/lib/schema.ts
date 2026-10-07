import { z } from 'zod';

/**
 * O formato de uma oferta. Validado no build: dado ruim derruba o build com
 * mensagem clara, em vez de virar card quebrado no ar.
 */

/** Metadado de cor e filtro. Não separa o site em seções. */
export const NICHOS = [
  'eletronicos',
  'casa',
  'beleza',
  'informatica',
  'ferramentas',
  'automotivo',
  'pet',
  'fitness',
  'curiosos',
] as const;

export type Nicho = (typeof NICHOS)[number];

/** Como cada nicho aparece pro visitante. */
export const ROTULO_NICHO: Record<Nicho, string> = {
  eletronicos: 'Eletrônicos',
  casa: 'Casa',
  beleza: 'Beleza',
  informatica: 'Informática',
  ferramentas: 'Ferramentas',
  automotivo: 'Automotivo',
  pet: 'Pet',
  fitness: 'Fitness',
  curiosos: 'Curiosos',
};

export const esquemaOferta = z
  .object({
    /** Slug legível e único. Vira a URL: /go/fone-qcy-anc */
    id: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use minúsculas, números e hífens (ex.: "fone-qcy-anc")'),
    titulo: z.string().min(3).max(120),
    preco: z.number().positive(),
    /** Preço cheio, pra calcular o desconto. Opcional. */
    precoDe: z.number().positive().optional(),
    nicho: z.enum(NICHOS),
    loja: z.string().min(1).optional(),
    /** Selo "Full" do Mercado Livre (entrega rápida). */
    full: z.boolean().optional(),
    /** SEU link de afiliado. Nunca aparece na página — só atrás de /go/[id]. */
    linkAfiliado: z.url(),
    /** URL da foto do produto. Sem ela o card usa um fundo da cor do nicho. */
    img: z.url().optional(),
    /** Data de publicação (YYYY-MM-DD). Define a ordem da vitrine. */
    criadoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use o formato AAAA-MM-DD'),
  })
  .refine((o) => o.precoDe === undefined || o.precoDe > o.preco, {
    message: 'precoDe tem que ser MAIOR que preco — senão não é desconto',
    path: ['precoDe'],
  });

export type OfertaBruta = z.infer<typeof esquemaOferta>;
