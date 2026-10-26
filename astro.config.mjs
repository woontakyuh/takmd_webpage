// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

// Every build carries an id; the page compares it with /build.json when it is shown again and reloads if the site has moved on.
const buildId = process.env.BUILD_ID ?? (() => { try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() + '-' + Date.now().toString(36); } catch { return Date.now().toString(36); } })();


// https://astro.build/config
export default defineConfig({
  integrations: [react(), {
    name: 'build-id',
    hooks: {
      // Only a real build carries an id: Layout.astro renders it into the page, and build.json publishes it beside the
      // build. The dev server and the poster capture stay unmarked, so the page never asks them for a file they lack.
      'astro:config:setup': ({ command }) => { if (command === 'build') process.env.BUILD_ID = buildId; },
      'astro:build:done': async ({ dir }) => { await writeFile(new URL('build.json', dir), JSON.stringify({ id: buildId })); },
    },
  }],

  devToolbar: {
    enabled: false
  },

  vite: {
    cacheDir: '.astro/vite',
    optimizeDeps: { include: ['suncalc'] },
    plugins: [tailwindcss()]
  }
});