import { defineConfig } from 'astro/config';
import { remarkFigure } from './src/plugins/remark-figure.mjs';

export default defineConfig({
  site: 'https://aaronnichol.com',
  markdown: {
    remarkPlugins: [remarkFigure],
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
