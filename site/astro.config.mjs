// @ts-check
import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// Your public CV: the first PDF in public/cv/ (keep resume files out of git if they have your phone number).
// The Download button only shows when a PDF is there at build time.
const CV_FILE = existsSync('public/cv') ? readdirSync('public/cv').find((f) => f.toLowerCase().endsWith('.pdf')) : undefined;

export default defineConfig({
  // Public pages are prerendered to static HTML (the text paints before any JS). Private
  // /app and /api routes (P4+) opt out per page with `export const prerender = false`.
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough' }),
  // No Astro sessions (they would auto-provision a KV namespace); login is Cloudflare Access.
  session: false,
  integrations: [react()],
  server: { port: 4321 },
  build: {
    // One page, one stylesheet: inline it so the first paint doesn't wait for a second request.
    inlineStylesheets: 'always',
  },
  vite: {
    define: { __CV_PDF__: JSON.stringify(CV_FILE ? `/cv/${CV_FILE}` : null) },
  },
});
