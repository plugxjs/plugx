import {
  bundleAnalysisSchema,
  type PluginResource,
  pluginRuntimeSectionSchema,
} from '@plugxjs/core';
import type { z } from 'zod';

export enum Domain {
  GitHub = 'github.com',
}

export interface DownloaderConfig {
  /**
   * The number of files to keep in the cache.
   * @default 20
   */
  cache?: number;
  /**
   * The domain of the repository.
   */
  domain: Domain;
  network: {
    fetch: typeof fetch;
  };
  /**
   * The section in the package.json file where the plugin schema is defined.
   */
  packageSection: string;
  /**
   * @default '.static.json'
   */
  staticJsonSuffix?: string;
}

// Format: `:owner/:repo`.
const validRepositoryNameRegex =
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function createDownloader(config: DownloaderConfig) {
  const {
    cache = 20,
    network: { fetch: originalFetch },
    staticJsonSuffix = '.static.json',
  } = config;
  if (config.domain !== Domain.GitHub) {
    throw new Error(`Unsupported domain: ${config.domain}`);
  }
  const cacheMap = new Map<string, Response>();
  const baseURL = new URL('https://api.github.com/repos/');

  const downloaderFetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const key = args.join('\n');
    const cached = cacheMap.get(key);
    if (cached) {
      return cached;
    }
    const response = await originalFetch(...args);
    if (cacheMap.size >= cache) {
      cacheMap.delete(cacheMap.keys().next().value);
    }
    cacheMap.set(key, response);
    return response;
  };

  const fetchText = async (...args: Parameters<typeof fetch>): Promise<string> => {
    const response = await originalFetch(...args);
    return response.text();
  };

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
    ): Promise<PluginResource> => {
      if (!rootPackageJson) {
        rootPackageJson = 'package.json';
      }
      if (!validRepositoryNameRegex.test(repository)) {
        throw new Error(`Invalid repository name: ${repository}`);
      }
      const queryParameters = new URLSearchParams();
      if (ref) {
        queryParameters.set('ref', ref);
      }
      // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
      const repositoryContentURL = new URL(`${repository}/contents/`, baseURL);
      /**
       * The entry point for downloading the whole repository is `package.json` file.
       */
      const packageJsonURL = new URL(rootPackageJson, repositoryContentURL);
      const packageJsonDirectoryURL = new URL('.', packageJsonURL);
      const packageJsonText = await fetchText(packageJsonURL, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.raw',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      const packageJson = JSON.parse(packageJsonText);
      const configSection = packageJson[config.packageSection] as z.infer<
        typeof pluginRuntimeSectionSchema
      >;
      pluginRuntimeSectionSchema.parse(configSection);
      const coreEntry = configSection.entry.core;
      const coreEntryURL = new URL(coreEntry, packageJsonDirectoryURL);
      const coreEntryText = await fetchText(coreEntryURL, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.raw',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      const js = new Map<string, string>();
      const css = new Map<string, string>();
      const queue = [new URL(coreEntry + staticJsonSuffix, coreEntryURL)];
      while (queue.length > 0) {
        const head = queue.shift() as URL;
        const bundleAnalysis = (await downloaderFetch(head, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.github.v3.raw',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }).then((response) => response.json())) as z.infer<typeof bundleAnalysisSchema>;
        bundleAnalysisSchema.parse(bundleAnalysis);
        const moduleImports = bundleAnalysis.imports as string[];
        for (const moduleImport of moduleImports) {
          if (moduleImport.startsWith('./')) {
            const moduleImportURL = new URL(moduleImport, head);
            // download module source code
            js.set(
              moduleImport,
              await fetchText(moduleImportURL, {
                method: 'GET',
                headers: {
                  Accept: 'application/vnd.github.v3.raw',
                  'X-GitHub-Api-Version': '2022-11-28',
                },
              })
            );

            // analyze inner imports
            queue.push(new URL(moduleImport + staticJsonSuffix, moduleImportURL));
          } else {
            // IDM should not resolve external imports.
            // TODO: tell outside what external imports need to be resolved.
          }
        }
      }

      return {
        entry: {
          core: coreEntryText,
        },
        js,
        css,
      };
    },
  };
}
