import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'


export default defineConfig({
  resolve: {
    alias: {
      '@plugxjs/idm': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node'
  }
})
