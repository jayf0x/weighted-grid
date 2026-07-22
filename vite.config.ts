import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        react: resolve(__dirname, 'src/react.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    sourcemap: true,
    rollupOptions: {
      // Keep React out of the bundle so `@rect-pack/react` tree-shakes away when unused.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { exports: 'named' },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
