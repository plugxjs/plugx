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
