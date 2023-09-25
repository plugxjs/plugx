import { describe, it, expect, beforeEach } from 'vitest'
import { createDownloader, Domain } from '../src/index.js'

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
