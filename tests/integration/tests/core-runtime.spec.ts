import { createPlugxSandbox, NoPermissionError, Permission } from '@plugxjs/core/runtime';
import { expect } from '@esm-bundle/chai';
import type { SandboxEntry } from '@plugxjs/core';

Object.defineProperty(globalThis, 'expect', {
  value: expect,
});

Object.defineProperty(globalThis, 'NoPermissionError', {
  value: NoPermissionError,
});

const createSimpleCode = (code: string) =>
  `({ imports: $h‍_imports, liveVar: $h‍_live, onceVar: $h‍_once, importMeta: $h‍____meta }) => {$h‍_imports([]);${code}};`;

describe('basic', () => {
  it('sandbox should work', () => {
    const sandbox = createPlugxSandbox();
    const response = sandbox.evaluate('1+1');
    expect(response).to.eq(2);
  });

  it('should basic permission in sandbox works', () => {
    const sandbox = createPlugxSandbox();
    sandbox.evaluate(`try {
document.createElement('div')
} catch (e) {
  expect(e instanceof NoPermissionError).to.eq(true);
}`);
    sandbox.allowPermission(Permission.DOM);
    sandbox.evaluate(`document.createElement('div')`);
    sandbox.disallowPermission(Permission.DOM);
    try {
      sandbox.evaluate(`document.createElement('div')`);
    } catch (e) {
      expect(e instanceof NoPermissionError).to.eq(true);
    }
  });

  it('should custom elements works', () => {
    const sandbox = createPlugxSandbox();
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
customElements.define('word-count', WordCount)`);
    {
      const elementConstructor = globalThis.customElements.get('word-count');
      expect(elementConstructor).to.be.undefined;
    }
    {
      const elementConstructor = sandbox.evaluate(`customElements.get('word-count')`);
      expect(elementConstructor).not.to.be.undefined;
      customElements.define('word-count', elementConstructor as any);
      const element = document.createElement('word-count');
      const span = element.shadowRoot?.querySelector('span');
      expect(span?.textContent).to.eq('Hello, World!');
    }
  });

  it('should escape', () => {
    let called = false;
    // @ts-expect-error
    globalThis.someFn = (value: string) => {
      called = true;
      expect(value).to.eq('1');
    };
    const sandbox = createPlugxSandbox();
    const f = sandbox.evaluate(createSimpleCode(`globalThis.someFn('1')`)) as SandboxEntry;
    expect(f).to.instanceof(Function);
    f({
      imports: () => {},
      liveVar: {},
      onceVar: {},
      importMeta: {},
    });
    // @ts-expect-error
    delete globalThis.someFn;
    expect(called).to.eq(true);
  });
});
