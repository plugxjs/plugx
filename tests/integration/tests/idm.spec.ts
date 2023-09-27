import { fake } from 'sinon';
import { expect } from '@esm-bundle/chai';
import { createDownloader, Domain } from '@plugxjs/idm';
import { createPlugxSandbox } from '@plugxjs/core/runtime';

let downloader: ReturnType<typeof createDownloader>;

const repository = 'plugxjs/examples';

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
  $h‍_imports([["./utils-c2950b.mjs", []], ["not-exist-module", [["c", [($h‍_a) => c = $h‍_a]]]]]);
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
  } else if (url.endsWith('plugins/basic/utils-c2950b.mjs')) {
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
    "./utils-c2950b.mjs",
    "not-exist-module"
  ],
  "reexports": {}
}`);
  } else if (url.endsWith('plugins/basic/utils-c2950b.mjs.static.json')) {
    return new Response(`{
  "exports": {},
  "imports": [],
  "reexports": {}
}`);
  } else {
    throw new Error(`Unexpected URL: ${url}`);
  }
});

beforeEach(() => {
  downloader = createDownloader({
    domain: Domain.GitHub,
    network: {
      fetch: mockFetch,
    },
    packageSection: 'affinePlugin',
  });
});

describe('idm', () => {
  it('download should work', async () => {
    const { js, entry } = await downloader.download(repository, './plugins/basic/package.json');
    const sandbox = createPlugxSandbox();
    const fn = sandbox.evaluate(entry.core);
    expect(fn).to.instanceof(Function);
    expect(js.has('./utils-c2950b.mjs')).to.be.true;
  });
});
