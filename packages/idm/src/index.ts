import { pluginRuntimeSectionSchema } from '@plugxjs/core'
import { z } from 'zod'

export enum Domain {
  GitHub = 'github.com',
}

export interface DownloaderConfig {
  /**
   * The number of files to keep in the cache.
   * @default 20
   */
  cache?: number
  /**
   * The domain of the repository.
   */
  domain: Domain
  network: {
    fetch: typeof fetch
  }
  // Every response from the network is a UTF-8 text.
  /**
   * The section in the package.json file where the plugin schema is defined.
   */
  packageSection: string
}

// Format: `:owner/:repo`.
const validRepositoryNameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export function createDownloader (config: DownloaderConfig) {
  const {
    network: {
      fetch: downloaderFetch
    }
  } = config
  if (config.domain !== Domain.GitHub) {
    throw new Error(`Unsupported domain: ${config.domain}`)
  }
  const baseURL = new URL('https://api.github.com/repos/')
  return {
    download: async (
      /**
       * Full repository name in the format of `:owner/:repo`.
       *
       * @example "plugxjs/plugx"
       */
      repository: string,
      /**
       * The path to the root package.json file.
       *
       * @example "packages/idm/package.json"
       * @default "package.json"
       */
      rootPackageJson?: string,
      /**
       * The name of the commit/branch/tag.
       *
       * @example "refs/heads/main"
       * @default the repository’s default branch.
       */
      ref?: string
    ) => {
      if (!rootPackageJson) {
        rootPackageJson = 'package.json'
      }
      if (!validRepositoryNameRegex.test(repository)) {
        throw new Error(`Invalid repository name: ${repository}`)
      }
      const queryParameters = new URLSearchParams()
      if (ref) {
        queryParameters.set('ref', ref)
      }
      // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
      const repositoryContentURL = new URL(`${repository}/contents/`, baseURL)
      /**
       * The entry point for downloading the whole repository is `package.json` file.
       */
      const packageJsonURL = new URL(rootPackageJson, repositoryContentURL)
      const fileResponse = await downloaderFetch(packageJsonURL, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.raw',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
      const packageJsonText = await fileResponse.text()
      const packageJson = JSON.parse(packageJsonText)
      const configSection = packageJson[config.packageSection] as z.infer<typeof pluginRuntimeSectionSchema>
      pluginRuntimeSectionSchema.parse(configSection)
    }
  }
}
