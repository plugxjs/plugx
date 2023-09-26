import { esbuildPlugin } from '@web/dev-server-esbuild'

export default {
  files: ['tests/**/*.spec.ts'],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'esnext'
    })
  ]
}
