/**
 * Constantes do site. Um lugar só pra o que não é oferta.
 */
export const SITE = {
  nome: 'Achados & Ofertas',
  instagram: 'https://instagram.com/achadoseofertas.patto',
  arroba: '@achadoseofertas.patto',
  /**
   * Link de afiliado que lista TODOS os produtos que o dono já gerou. É o
   * destino do botão principal e nunca aparece no HTML: o botão aponta pra
   * /go/todas, e a rota faz o 302.
   */
  vitrineAfiliado: 'https://mercadolivre.com/sec/2qyWK1Z',
} as const;
