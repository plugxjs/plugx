import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    target: 'es2022',
    minify: false,
    lib: {
      entry: './src/index.ts',
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      // `@endo/static-module-record`
      //  will be bundled into the output as expected.
      external: ['zod', /^@plugxjs/],
    },
  },
  plugins: [dts(), tsconfigPaths()],
});
