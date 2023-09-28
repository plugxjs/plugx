import { describe, expect, it } from 'vitest';
import { build } from 'vite';
import { compile } from '@plugxjs/vite-plugin';
import { plugx } from '@plugxjs/vite-plugin';
import type { RollupOutput } from 'rollup';
import type { OutputAsset, OutputChunk } from 'rollup';
import { resolveFixturePath } from './utils';

describe('basic', () => {
  it('compile', async () => {
    const { source, metadata } = await compile('export const a = 1', 'test.ts');
    expect(source).toMatchInlineSnapshot(`
      "(({   imports: $h‍_imports,   liveVar: $h‍_live,   onceVar: $h‍_once,   importMeta: $h‍____meta,  }) => {   $h‍_imports([]);   const        a=  1;$h‍_once.a(a);
      })
      //# sourceURL=test.ts
      "
    `);
    expect(metadata).toMatchInlineSnapshot(`
      {
        "exports": {
          "a": [
            "a",
          ],
        },
        "imports": [],
        "reexports": {},
      }
    `);
  });

  it('should works', async () => {
    for (const ext of ['.ts', '.js']) {
      const [{ output }] = (await build({
        build: {
          minify: false,
          lib: {
            entry: resolveFixturePath(`basic${ext}`),
            fileName: 'test',
            formats: ['es'],
          },
        },
        plugins: [plugx()],
      })) as RollupOutput[];
      expect(output.length).toBe(2);
      const main = output[0] as OutputChunk;
      const staticJson = output[1] as OutputAsset;
      expect(main.fileName).toBe('test.js');
      expect(staticJson.fileName).toBe('test.js.static.json');
      expect(main.code).toMatchSnapshot();
      expect(staticJson.source).toMatchSnapshot();
    }
  });

  it('should analysis multiple files', async () => {
    const [{ output }] = (await build({
      root: resolveFixturePath('import-module'),
      build: {
        minify: false,
        lib: {
          entry: './src/index.ts',
          fileName: 'index',
          formats: ['es'],
        },
        rollupOptions: {
          output: {
            chunkFileNames: '[name].js',
            manualChunks: (id) => {
              if (id.includes('utils.ts')) {
                return 'utils';
              }
              return;
            },
          },
          treeshake: false,
          external: ['not-exist-module'],
        },
      },
      plugins: [plugx()],
    })) as RollupOutput[];
    output.forEach((chunk) => {
      if (chunk.type === 'asset') {
        expect(chunk.source).toMatchSnapshot(chunk.fileName);
      } else if (chunk.type === 'chunk') {
        expect(chunk.code).toMatchSnapshot(chunk.fileName);
      }
    });
  });
});
