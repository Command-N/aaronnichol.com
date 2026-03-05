import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aaronnichol.com',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
