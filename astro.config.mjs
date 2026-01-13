import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  site: 'https://mepuka.com',
  build: {
    // Output static files to dist/
    format: 'directory',
  },
});
