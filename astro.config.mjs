import { defineConfig } from 'astro/config';
import { remarkFigure } from './src/plugins/remark-figure.mjs';
import { rehypeTableWrap } from './src/plugins/rehype-table-wrap.mjs';

export default defineConfig({
  site: 'https://aaronnichol.com',
  markdown: {
    remarkPlugins: [remarkFigure],
    rehypePlugins: [rehypeTableWrap],
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
