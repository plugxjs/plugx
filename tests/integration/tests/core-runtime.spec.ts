import {
  createPlugxSandbox,
  NoPermissionError,
  Permission
} from '@plugxjs/core/runtime'
import type { SandboxEntry } from '@plugxjs/core'

Object.defineProperty(globalThis, 'NoPermissionError', {
  value: NoPermissionError
})

const createSimpleCode = (code: string) => `({ imports: $h‍_imports, liveVar: $h‍_live, onceVar: $h‍_once, importMeta: $h‍____meta }) => {$h‍_imports([]);${code}};`

describe('basic', () => {
  it('sandbox should work', () => {
    const sandbox = createPlugxSandbox()
    const response = sandbox.evaluate('1+1')
    if (response !== 2) {
      throw new Error('sandbox should work')
    }
  })

  it('should basic permission in sandbox works', () => {
    const sandbox = createPlugxSandbox()
    sandbox.evaluate(`try {
document.createElement('div')
} catch (e) {
  if (!(e instanceof NoPermissionError)) {
    throw new Error('should throw NoPermissionError')
  }
}`)
    sandbox.allowPermission(Permission.DOM)
    sandbox.evaluate(`document.createElement('div')`)
    sandbox.disallowPermission(Permission.DOM)
    try {
      sandbox.evaluate(`document.createElement('div')`)
    } catch (e) {
      if (!(e instanceof NoPermissionError)) {
        throw new Error('should throw NoPermissionError')
      }
    }
  })

  it('should custom elements works', () => {
    const sandbox = createPlugxSandbox()
    sandbox.evaluate(`
class WordCount extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const wrapper = document.createElement("span");
    const style = document.createElement("style");
    style.textContent = \`\`;
    wrapper.textContent = "Hello, World!";
    this.shadowRoot.append(style, wrapper);
  }
  
  testFn () {}
}
customElements.define('word-count', WordCount)`)
    {
      const elementConstructor = globalThis.customElements.get('word-count')
      if (elementConstructor != null) {
        throw new Error('elementConstructor should not be undefined')
      }
    }
    {
      const elementConstructor = sandbox.evaluate(
        `customElements.get('word-count')`)
      if (elementConstructor == null) {
        throw new Error('elementConstructor should be undefined')
      }
      customElements.define('word-count', elementConstructor as any)
      const element = document.createElement('word-count')
      const span = element.shadowRoot?.querySelector('span')
      if (span?.textContent !== 'Hello, World!') {
        throw new Error('textContent should be "Hello, World!"')
      }
    }
  })

  it('should escape', () => {
    let called = false
    // @ts-expect-error
    globalThis.someFn =
      (value: string) => {
        called = true
        if (value !== '1') {
          throw new Error('not equal')
        }
      }
    const sandbox = createPlugxSandbox()
    const f = sandbox.evaluate(
      createSimpleCode(`globalThis.someFn('1')`)) as SandboxEntry
    if (typeof f !== 'function') {
      throw new Error('`f` should be a function')
    }
    f({
      imports: () => {},
      liveVar: {},
      onceVar: {},
      importMeta: {}
    })
    // @ts-expect-error
    delete globalThis.someFn
    if (!called) {
      throw new Error('someFn should be called')
    }
  })
})
