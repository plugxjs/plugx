import { fake } from 'sinon';
import { expect } from '@esm-bundle/chai';
import { createDownloader, Domain } from '@plugxjs/idm';

let downloader: ReturnType<typeof createDownloader>;

const repository = 'plugxjs/examples';

const mockFetch = fake(async (_input: RequestInfo | URL): Promise<any> => {
  expect(_input).to.instanceof(URL);
  const input = _input as URL;
  const url = input.toString();
  if (url.endsWith('plugins/copilot/package.json')) {
    return new Response(
      JSON.stringify({
        type: 'module',
        affinePlugin: {
          release: false,
          entry: {
            core: './dist/index.js',
          },
        },
      })
    );
  } else if (url.endsWith('plugins/copilot/dist/index.js')) {
    return new Response(`console.log('hello, world!')`);
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
    const pluginResource = await downloader.download(repository, './plugins/copilot/package.json');
    expect(pluginResource.entry.core).to.eq(`console.log('hello, world!')`);
  });
});
