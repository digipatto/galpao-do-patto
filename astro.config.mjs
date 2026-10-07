// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

// React existe pros componentes do Kokonut UI, que são React + Motion.
// Cada ilha é explícita (client:load / client:visible): o resto da página
// continua HTML estático, sem runtime.
export default defineConfig({
  // O Netlify injeta URL no build. Sem isso, og:image e canonical sairiam
  // relativos — e prévia de link exige endereço absoluto.
  site: process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:4321',
  integrations: [react()],
  adapter: netlify(),
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
