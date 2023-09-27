import { z } from 'zod';

export interface SandboxEntry {
  (options: {
    imports: (newUpdaters: [string, [string, ((val: any) => void)[]][]][]) => void;
    liveVar: Record<string, unknown>;
    onceVar: Record<string, unknown>;
    importMeta: Record<string, unknown>;
  }): void;
}

export const pluginRuntimeSectionSchema = z.object({
  /**
   * The entry point for the plugin.
   */
  entry: z.object({
    core: z.string(),
  }),
  assets: z.array(z.string()).optional(),
});

export const bundleAnalysisSchema = z.object({
  exports: z.record(z.array(z.string())),
  imports: z.array(z.string()),
  reexports: z.record(z.array(z.tuple([z.string(), z.string()]))),
});

export type PluginResource = {
  entry: {
    core: string;
  };
  js: Map<string, string>;
  css: Map<string, string>;
};
