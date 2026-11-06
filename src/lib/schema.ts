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

    /**
     * Id do anúncio no ML (MLB123...). Preenchido sozinho por
     * scripts/atualizar-precos.mjs na primeira leitura; é o que garante que o
     * preço atualizado é do MESMO anúncio.
     */
    mlb: z.string().regex(/^MLB\d+$/).optional(),

    /** SEU link de afiliado. Nunca aparece no HTML: só atrás de /go/<id>. */
    linkAfiliado: z.url(),

    /** Data da publicação. Define a ordem do feed (mais nova no topo). */
    criadoEm: data,
    /**
     * Quando o preço foi conferido (o script de preços preenche). Preço
     * conferido há mais de VALIDADE_PRECO_DIAS dias não aparece no site.
     */
    conferidoEm: data.optional(),
  })
  .refine((o) => o.precoDe === undefined || o.precoDe > o.preco, {
    message: 'precoDe tem que ser MAIOR que preco — senão não é desconto',
    path: ['precoDe'],
  });

export type OfertaBruta = z.infer<typeof esquemaOferta>;

/**
 * Um quiz de vídeo: o Reel faz a pergunta, a pessoa comenta a letra e a DM
 * leva ao /quiz/<id>?r=<letra>, que diz se acertou e mostra a oferta.
 *
 * `opcoes` são só os textos; a letra é a posição (A, B, C, D). A resposta certa
 * NUNCA vai pro HTML da pergunta: só a página de resultado (no servidor) lê.
 */
const letra = z.enum(['A', 'B', 'C', 'D']);

export const esquemaQuiz = z
  .object({
    /** Slug único. Vira o endereço /quiz/<id>. */
    id: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use minúsculas, números e hífens'),
    /** Oferta que aparece depois da resposta (id em ofertas.json). */
    ofertaId: z.string().min(2),
    pergunta: z.string().min(5).max(200),
    opcoes: z.array(z.string().min(1).max(80)).min(2).max(4),
    correta: letra,
    /** A história por trás da resposta. Só fatos que o dono confirmou. */
    revelacao: z.string().min(3).max(500),
    criadoEm: data,
  })
  .refine((q) => 'ABCD'.indexOf(q.correta) < q.opcoes.length, {
    message: 'correta aponta pra uma letra que não existe em opcoes',
    path: ['correta'],
  });

export type QuizBruto = z.infer<typeof esquemaQuiz>;
export type LetraQuiz = z.infer<typeof letra>;
