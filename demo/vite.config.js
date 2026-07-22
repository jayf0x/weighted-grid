import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Import the library straight from source so the demo tracks local changes.
const rectPack = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const rectPackReact = fileURLToPath(new URL('../src/react.tsx', import.meta.url));

// react is an *optional* peer dep of rect-pack, so vite stubs it when resolving ../src/react.tsx.
// Force it onto the demo's real react install.
const require = createRequire(import.meta.url);
const reactMod = require.resolve('react');
const jsxRuntime = require.resolve('react/jsx-runtime');
const jsxDevRuntime = require.resolve('react/jsx-dev-runtime');

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/rect-pack/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: 'rect-pack/react', replacement: rectPackReact },
      { find: 'rect-pack', replacement: rectPack },
      { find: /^react\/jsx-runtime$/, replacement: jsxRuntime },
      { find: /^react\/jsx-dev-runtime$/, replacement: jsxDevRuntime },
      { find: /^react$/, replacement: reactMod },
    ],
  },
});
