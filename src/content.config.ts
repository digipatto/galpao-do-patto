import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

/**
 * O blog. Um arquivo .md em src/content/blog/ = um artigo.
 * O nome do arquivo vira a URL: "achados-de-outubro.md" -> /blog/achados-de-outubro
 *
 * O frontmatter é validado no build, igual às ofertas: campo faltando
 * derruba o build com mensagem clara.
 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string().min(3),
    /** Aparece na listagem e na prévia de compartilhamento. */
    resumo: z.string().min(10).max(220),
    publicadoEm: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /** Rascunho não aparece na listagem nem ganha página no build. */
    rascunho: z.boolean().default(false),
  }),
});

export const collections = { blog };
