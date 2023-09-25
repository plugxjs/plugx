import { describe, it, expect, beforeEach } from 'vitest'
import { createDownloader, Domain } from '@plugxjs/idm'

let downloader: ReturnType<typeof createDownloader>

beforeEach(() => {
  downloader = createDownloader({
    domain: Domain.GitHub,
    network: {
      fetch: globalThis.fetch
    },
    packageSection: 'plugx'
  })
})

describe('basic', () => {
  it('should work', () => {
    expect(downloader).toBeDefined()
  })
})
