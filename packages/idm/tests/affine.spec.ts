import { describe, it, beforeEach } from 'vitest'
import { createDownloader, Domain } from '@plugxjs/idm'

let downloader: ReturnType<typeof createDownloader>

const repository = 'toeverything/AFFiNE'

beforeEach(() => {
  downloader = createDownloader({
    domain: Domain.GitHub,
    network: {
      fetch: globalThis.fetch
    },
    packageSection: 'affinePlugin'
  })
})

// fixme(himself65): use a mock server in unit tests
describe('compatible with toeverything/AFFiNE', () => {
  it('download should work', async () => {
    await downloader.download(repository, './plugins/copilot/package.json')
  })
})
