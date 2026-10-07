// TODO Parte 4 — vira o redirect 302 pro linkAfiliado da oferta.
//
// Nesta parte o arquivo é só um marcador de rota: nenhuma lógica, nenhum handler.
// O `prerender = false` abaixo já entra agora por necessidade técnica — sem ele o
// build estático falha (`GetStaticPathsRequired`), porque uma rota dinâmica
// pré-renderizada exige `getStaticPaths()`. Mantendo a rota on-demand, ela só
// existe no servidor e hoje responde 404.
//
// Na Parte 4 entra aqui um `GET` que resolve o `id` em src/data/ofertas.json e
// responde 302 pro linkAfiliado. É o ÚNICO caminho pro Mercado Livre.
export const prerender = false;
