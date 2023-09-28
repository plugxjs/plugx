import { Buffer } from 'buffer';

if (!globalThis.Buffer) {
  Object.defineProperty(globalThis, 'Buffer', {
    value: Buffer,
  });
}

const staticModuleRecordPromise = import('@endo/static-module-record').then(
  ({ StaticModuleRecord }) => {
    return StaticModuleRecord;
  }
);

export interface PlugxOptions {
  /**
   * @default '.static.json'
   */
  staticJsonSuffix?: string;
}

export interface CompileResult {
  metadata: {
    exports: Record<string, string>;
    imports: string[];
    reexports: Record<string, [string, string][]>;
  };
  source: string;
}

/**
 * @internal
 */
export async function compile(code: string, fileName: string): Promise<CompileResult> {
  const StaticModuleRecord = await staticModuleRecordPromise;
  const record = new StaticModuleRecord(code, fileName);
  const reexports = record.__reexportMap__ as Record<
    string,
    [localName: string, exportedName: string][]
  >;
  const exports = Object.assign({}, record.__fixedExportMap__, record.__liveExportMap__);
  return {
    source: record.__syncModuleProgram__,
    metadata: {
      exports: exports,
      imports: record.imports,
      reexports: reexports,
    },
  };
}

export function plugx(options: PlugxOptions = {}): import('vite').Plugin {
  const staticJsonSuffix = options.staticJsonSuffix ?? '.static.json';
  return {
    name: 'plugx',
    enforce: 'post',
    renderChunk: async function (code, chunk) {
      if (chunk.fileName.endsWith('js')) {
        const { metadata, source } = await compile(code, chunk.fileName);
        const fileName = chunk.fileName + staticJsonSuffix;
        this.emitFile({
          type: 'asset',
          fileName,
          source: JSON.stringify(metadata, null, 2),
        });
        return source;
      }
      return code;
    },
  };
}
