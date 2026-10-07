// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// Site estático puro: nenhuma ilha de framework. A única rota que roda no
// servidor é /go/[id], que declara `export const prerender = false`.
export default defineConfig({
  adapter: netlify(),
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
