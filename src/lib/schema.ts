import { z } from 'zod';

/**
 * O formato de uma oferta. Validado no build: dado ruim derruba o build com
 * mensagem apontando o campo, em vez de virar card quebrado no ar.
 *
 * Tudo que é prova social (nota, avaliações, ranking) é COPIADO do anúncio,
 * nunca estimado. Campo que você não conferiu, deixe de fora: o card só mostra
 * o que existe.
 */

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use o formato AAAA-MM-DD');

export const esquemaOferta = z
  .object({
    /** Slug legível e único. Vira o endereço do botão: /go/<id> */
    id: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use minúsculas, números e hífens (ex.: "fone-qcy-anc")')
      // "todas" é o endereço da vitrine geral (/go/todas). Uma oferta com esse
      // id seria engolida por ela.
      .refine((id) => id !== 'todas', { message: '"todas" é reservado pra vitrine geral, escolha outro id' }),
    titulo: z.string().min(3).max(120),
    preco: z.number().positive(),
    /** Preço cheio. Gera o desconto e a economia. */
    precoDe: z.number().positive().optional(),
    /**
     * Condição do `preco`, quando ele não vale pra qualquer pagamento
     * (ex.: "no Pix"). Aparece colado no preço: preço com condição escondida
     * é preço enganoso.
     */
    condicaoPreco: z.string().min(1).optional(),
    /** O outro preço do anúncio (ex.: o do cartão, quando o principal é o Pix). */
    precoAlternativo: z
      .object({ valor: z.number().positive(), rotulo: z.string().min(1) })
      .optional(),

    loja: z.string().min(1).optional(),
    lojaOficial: z.boolean().optional(),
    freteGratis: z.boolean().optional(),
    /** Selo Full do Mercado Livre. */
    full: z.boolean().optional(),

    parcelas: z
      .object({
        vezes: z.number().int().min(2),
        valor: z.number().positive(),
        semJuros: z.boolean().default(true),
      })
      .optional(),

    avaliacao: z.number().min(0).max(5).optional(),
    /** Quantas avaliações sustentam a nota. Nota sem volume não prova nada. */
    avaliacoes: z.number().int().nonnegative().optional(),
    /** Posição em ranking, como o anúncio escreve. */
    ranking: z.string().min(1).optional(),

    /** URL completa ou caminho a partir de public/ (ex.: "/produtos/fone.webp"). */
    img: z
      .union([z.url(), z.string().regex(/^\/[^\s]+$/, 'caminho local tem que começar com "/"')])
      .optional(),

    /** SEU link de afiliado. Nunca aparece no HTML: só atrás de /go/<id>. */
    linkAfiliado: z.url(),

    /** Data da publicação. Define a ordem do feed (mais nova no topo). */
    criadoEm: data,
    /** Quando você conferiu o preço. Aparece no card. */
    conferidoEm: data.optional(),
  })
  .refine((o) => o.precoDe === undefined || o.precoDe > o.preco, {
    message: 'precoDe tem que ser MAIOR que preco — senão não é desconto',
    path: ['precoDe'],
  });

export type OfertaBruta = z.infer<typeof esquemaOferta>;
