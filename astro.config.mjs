import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com', // Replace with your domain
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
