import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      fileName: 'index',
      formats: ['cjs', 'es']
    },
    rollupOptions: {
      external: ['zod', /^@plugxjs/, '@endo/static-module-record']
    }
  },
  plugins: [dts(), tsconfigPaths()]
})
