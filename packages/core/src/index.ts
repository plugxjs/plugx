import { z } from 'zod'

export const pluginRuntimeSectionSchema = z.object({
  /**
   * The entry point for the plugin.
   */
  entry: z.object({
    core: z.string(),
  }),
  assets: z.array(z.string()).optional()
})
