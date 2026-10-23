import type { APIRoute } from 'astro';
import { acharOferta } from '../../lib/ofertas';
import { SITE } from '../../lib/site';

/**
 * O único caminho do site pro Mercado Livre.
 *
 * Por que não botar o link de afiliado direto na página:
 *  - dá pra trocar o destino sem mexer em nenhuma página;
 *  - dá pra contar clique aqui depois;
 *  - o link cru nunca aparece no HTML.
 *
 * /go/todas  -> a vitrine geral de afiliado (todos os produtos do dono)
 * /go/<id>   -> o link de afiliado de uma oferta específica
 *
 * Roda no servidor (não é pré-renderizado) pra responder 302 de verdade.
 */
export const prerender = false;

export const GET: APIRoute = ({ params, redirect }) => {
  const id = params.id;

  if (id === 'todas') {
    return redirect(SITE.vitrineAfiliado, 302);
  }

  const oferta = id ? acharOferta(id) : undefined;

  // Id que não existe (link velho, erro de digitação) volta pra home em vez de
  // dar 404 na cara de quem veio do Instagram.
  if (!oferta) {
    return redirect('/', 302);
  }

  return redirect(oferta.linkAfiliado, 302);
};
