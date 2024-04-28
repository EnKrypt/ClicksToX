import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: resolve(
        __dirname,
        process.env.LIB === 'background-script'
          ? 'src/background.ts'
          : 'src/main.tsx'
      ),
      formats: ['cjs'],
      fileName:
        process.env.LIB === 'background-script' ? 'background' : 'index',
    },
  },
  define: {
    'process.env': {},
  },
});
