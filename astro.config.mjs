// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // O Netlify injeta URL no build; o endereço fixo é o do link da bio do
  // Instagram. canonical e og:image precisam ser absolutos pra prévia de link.
  site: process.env.URL || 'https://achadoseofertaspatto.netlify.app',
  // React fica integrado mas a página não usa nenhuma ilha: 0 KB de JS no
  // visitante. Está aqui pra uma ilha futura entrar sem mexer em config.
  integrations: [react()],
  adapter: netlify(),
  // Estático. A única rota de servidor é /go/[id] (`prerender = false`).
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
