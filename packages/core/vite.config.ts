import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        runtime: './src/runtime.ts'
      },
      formats: ['cjs', 'es']
    },
    rollupOptions: {
      external: ['zod', /^@plugxjs/, '@locker/near-membrane-dom']
    }
  },
  plugins: [dts(), tsconfigPaths()]
})
