// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 entra como plugin do Vite (nao mais como integracao Astro).
export default defineConfig({
  integrations: [react()],
  adapter: netlify(),
  // 'static': tudo pre-renderizado. Na Parte 4, a rota /go/[id].ts vai declarar
  // `export const prerender = false` pra rodar on-demand (redirect 302) sem
  // tirar o resto do site do estatico.
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
