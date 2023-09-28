import { fake } from 'sinon';
import { expect } from '@esm-bundle/chai';
import { createDownloader, Domain } from '@plugxjs/idm';
import { createPlugxSandbox } from '@plugxjs/core/runtime';
import { compile } from '@plugxjs/vite-plugin';
import { z } from 'zod';
import { pluginRuntimeSectionSchema } from '@plugxjs/core';

let downloader: ReturnType<typeof createDownloader>;

const repository = 'plugxjs/examples';

describe('idm', () => {
  it('download should work with domain GitHub', async () => {
    const resourceMap = new Map<string, string>();
    async function setupMockCode(code: string, path: string) {
      const { source, metadata } = await compile(code, path);
      resourceMap.set(`https://api.github.com/repos/${repository}/contents/${path}`, source);
      resourceMap.set(
        `https://api.github.com/repos/${repository}/contents/${path}.static.json`,
        JSON.stringify(metadata)
      );
      return {
        [Symbol.dispose]: () => {
          console.log('dispose');
          resourceMap.delete(`https://api.github.com/repos/${repository}/contents/${path}`);
          resourceMap.delete(
            `https://api.github.com/repos/${repository}/contents/${path}.static.json`
          );
        },
      };
    }

    const mockFetch = fake(async (_input: RequestInfo | URL): Promise<any> => {
      expect(_input).to.instanceof(URL);
      const input = _input as URL;
      const url = input.toString();
      const content = resourceMap.get(url);
      if (content) {
        return new Response(content);
      } else {
        throw new Error(`Unexpected URL: ${url}`);
      }
    });

    const runtimeConfig = {
      entry: {
        core: './index.js',
      },
      assets: [],
    } satisfies z.infer<typeof pluginRuntimeSectionSchema>;

    resourceMap.set(
      `https://api.github.com/repos/${repository}/contents/plugins/basic/package.json`,
      JSON.stringify({
        type: 'module',
        affinePlugin: runtimeConfig,
      })
    );
    await setupMockCode(
      `import './utils.js';
const a = 1;
export const b = a + 1;

import { c } from 'not-exist-module';

export function d() {
  return c;
}

export { d as e };
`,
      'plugins/basic/index.js'
    );

    await setupMockCode(
      `function test() {
}
for (let i = 0; i < 10; i++) {
  test();
}
`,
      'plugins/basic/utils.js'
    );
    downloader = createDownloader({
      domain: Domain.GitHub,
      network: {
        fetch: mockFetch,
      },
      packageSection: 'affinePlugin',
    });
    const { js, entry } = await downloader.download(repository, './plugins/basic/package.json');
    const sandbox = createPlugxSandbox();
    const fn = sandbox.evaluate(entry.core);
    expect(fn).to.instanceof(Function);
    expect(js.has('./utils.js')).to.be.true;

    resourceMap.clear();
  });

  it('download should work with domain URL', async () => {
    const runtimeConfig = {
      entry: {
        core: './index.js',
      },
    } satisfies z.infer<typeof pluginRuntimeSectionSchema>;

    const mockFetch = fake(async (_input: RequestInfo | URL): Promise<any> => {
      const input = _input as URL;
      const url = input.toString();
      if (url === `http://localhost:8080/relative/${repository}/package.json`) {
        return new Response(
          JSON.stringify({
            type: 'module',
            affinePlugin: runtimeConfig,
          })
        );
      } else if (url === `http://localhost:8080/relative/${repository}/index.js`) {
        return new Response('console.log("hello world");');
      } else if (url === `http://localhost:8080/relative/${repository}/index.js.static.json`) {
        return new Response(`{
  "exports": {},
  "imports": [],
  "reexports": {}}`);
      } else {
        throw new Error(`Unexpected URL: ${url}`);
      }
    });
    const downloader = createDownloader({
      domain: new URL('http://localhost:8080/relative/'),
      network: {
        fetch: mockFetch,
      },
      packageSection: 'affinePlugin',
    });
    const { js, entry } = await downloader.download(repository);
    expect(entry.core).to.be.eq('console.log("hello world");');
    expect(js.size).to.be.eq(0);
  });
});
