import { StaticModuleRecord } from '@endo/static-module-record'

export interface PlugxOptions {
  /**
   * @default '.static.json'
   */
  staticJsonSuffix?: string
}

export default function plugx (options: PlugxOptions = {}): import('vite').Plugin {
  const staticJsonSuffix = options.staticJsonSuffix ?? '.static.json'
  return {
    name: 'plugx',
    enforce: 'post',
    renderChunk: function (code, chunk) {
      if (chunk.fileName.endsWith('js')) {
        const record = new StaticModuleRecord(code, chunk.fileName)
        const reexports = record.__reexportMap__ as Record<
          string,
          [localName: string, exportedName: string][]
        >
        const exports = Object.assign(
          {},
          record.__fixedExportMap__,
          record.__liveExportMap__
        )
        const fileName = chunk.fileName + staticJsonSuffix
        this.emitFile({
          type: 'asset',
          fileName,
          source: JSON.stringify(
            {
              exports: exports,
              imports: record.imports,
              reexports: reexports
            },
            null,
            2
          )
        })
        return record.__syncModuleProgram__
      }
      return code
    }
  }
}
