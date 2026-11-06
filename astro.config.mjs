import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkFigure } from './src/plugins/remark-figure.mjs';
import { rehypeTableWrap } from './src/plugins/rehype-table-wrap.mjs';

export default defineConfig({
  site: 'https://aaronnichol.com',
  // Keep Astro 5's whitespace handling. Astro 7's default ('jsx') drops
  // spaces between inline elements, e.g. "on LinkedIn" became "onLinkedIn".
  compressHTML: true,
  markdown: {
    processor: unified({
      remarkPlugins: [remarkFigure],
      rehypePlugins: [rehypeTableWrap],
    }),
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
