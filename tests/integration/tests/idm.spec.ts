import { fake } from 'sinon';
import { expect } from '@esm-bundle/chai';
import { createDownloader, Domain } from '@plugxjs/idm';
import { createPlugxSandbox } from '@plugxjs/core/runtime';

let downloader: ReturnType<typeof createDownloader>;

const repository = 'plugxjs/examples';

describe('idm', () => {
  it('download should work with domain GitHub', async () => {
    const mockFetch = fake(async (_input: RequestInfo | URL): Promise<any> => {
      expect(_input).to.instanceof(URL);
      const input = _input as URL;
      const url = input.toString();
      if (url.endsWith('plugins/basic/package.json')) {
        return new Response(
          JSON.stringify({
            type: 'module',
            affinePlugin: {
              release: false,
              entry: {
                core: './index.js',
              },
            },
          })
        );
      } else if (url.endsWith('plugins/basic/index.js')) {
        return new Response(`({ imports: $h‍_imports, liveVar: $h‍_live, onceVar: $h‍_once, importMeta: $h‍____meta }) => {
  let c;
  $h‍_imports([["./utils.js", []], ["not-exist-module", [["c", [($h‍_a) => c = $h‍_a]]]]]);
  Object.defineProperty(d, "name", { value: "d" });
  $h‍_once.d(d);
  const a = "1";
  const b = a + 1;
  $h‍_once.b(b);
  function d() {
    return c;
  }
};
`);
      } else if (url.endsWith('plugins/basic/utils.js')) {
        return new Response(`({ imports: $h‍_imports, liveVar: $h‍_live, onceVar: $h‍_once, importMeta: $h‍____meta }) => {
  $h‍_imports([]);
  function test() {
  }
  for (let i = 0; i < 10; i++) {
    test();
  }
};
`);
      } else if (url.endsWith('plugins/basic/index.js.static.json')) {
        return new Response(`{
  "exports": {
    "b": [
      "b"
    ],
    "d": [
      "d"
    ],
    "e": [
      "d"
    ]
  },
  "imports": [
    "./utils.js",
    "not-exist-module"
  ],
  "reexports": {}
}`);
      } else if (url.endsWith('plugins/basic/utils.js.static.json')) {
        return new Response(`{
  "exports": {},
  "imports": [],
  "reexports": {}
}`);
      } else {
        throw new Error(`Unexpected URL: ${url}`);
      }
    });
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
  });

  it('download should work with domain URL', async () => {
    const mockFetch = fake(async (_input: RequestInfo | URL): Promise<any> => {
      const input = _input as URL;
      const url = input.toString();
      if (url === `http://localhost:8080/relative/${repository}/package.json`) {
        return new Response(
          JSON.stringify({
            type: 'module',
            affinePlugin: {
              release: false,
              entry: {
                core: './index.js',
              },
            },
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
