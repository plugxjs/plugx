import { describe, expect, it } from 'vitest'
import { build } from 'vite'
import { fileURLToPath } from 'node:url'
import plugx from '../src/index.js'
import type { RollupOutput } from 'rollup'
import type { OutputAsset, OutputChunk } from 'rollup'

describe('basic', () => {
  it('should works', async () => {
    const [{ output }] = await build({
      build: {
        minify: false,
        lib: {
          entry: fileURLToPath(
            new URL('./fixtures/basic.ts', import.meta.url)),
          fileName: 'test',
          formats: ['es']
        }
      },
      plugins: [plugx()]
    }) as RollupOutput[]
    expect(output.length).toBe(2)
    const main = output[0] as OutputChunk
    const staticJson = output[1] as OutputAsset
    expect(main.fileName).toBe('test.js')
    expect(staticJson.fileName).toBe('test.js.static.json')
    expect(main.code).toMatchSnapshot()
    expect(staticJson.source).toMatchSnapshot()
  })
})
