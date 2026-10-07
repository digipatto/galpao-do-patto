import type { APIRoute } from 'astro';
import { acharOferta } from '../../lib/ofertas';

/**
 * O único caminho do site pro Mercado Livre.
 *
 * Por que não botar o link de afiliado direto no card:
 *  - dá pra trocar o destino sem reeditar post nenhum;
 *  - dá pra contar clique aqui depois, sem mexer no resto;
 *  - o link cru nunca aparece na página.
 *
 * Roda no servidor (não é pré-renderizado) pra responder 302 de verdade.
 */
export const prerender = false;

export const GET: APIRoute = ({ params, redirect }) => {
  const id = params.id;
  const oferta = id ? acharOferta(id) : undefined;

  // Id que não existe (link velho, erro de digitação) volta pra vitrine em vez
  // de dar 404 na cara de quem veio do Instagram.
  if (!oferta) {
    return redirect('/', 302);
  }

  return redirect(oferta.linkAfiliado, 302);
};
