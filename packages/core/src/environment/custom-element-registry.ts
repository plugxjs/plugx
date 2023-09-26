/**
 * MIT License
 *
 * Copyright (c) 2019 David Ortner (capricorn86)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Custom elements registry.
 */
export class CustomElementRegistry {
  public _registry: { [k: string]: { elementClass: typeof HTMLElement; extends: string } } = {};
  public _callbacks: { [k: string]: (() => void)[] } = {};

  /**
   * Defines a custom element class.
   *
   * @param tagName Tag name of element.
   * @param elementClass Element class.
   * @param [options] Options.
   * @param options.extends
   */
  public define(
    tagName: string,
    elementClass: typeof HTMLElement,
    options?: { extends: string }
  ): void {
    const upperTagName = tagName.toUpperCase();

    if (!upperTagName.includes('-')) {
      throw new DOMException(
        "Failed to execute 'define' on 'CustomElementRegistry': \"" +
        tagName +
        '" is not a valid custom element name.'
      );
    }

    this._registry[upperTagName] = {
      elementClass,
      // @ts-ignore
      extends: options && options.extends ? options.extends.toLowerCase() : null
    };

    // ObservedAttributes should only be called once by CustomElementRegistry (see #117)
    // @ts-ignore
    if (elementClass.prototype.attributeChangedCallback) {
      // @ts-ignore
      elementClass._observedAttributes = elementClass.observedAttributes;
    }

    if (this._callbacks[upperTagName]) {
      const callbacks = this._callbacks[upperTagName];
      delete this._callbacks[upperTagName];
      for (const callback of callbacks) {
        callback();
      }
    }
  }

  /**
   * Returns a defined element class.
   *
   * @param tagName Tag name of element.
   * @param HTMLElement Class defined.
   */
  public get(tagName: string): typeof HTMLElement {
    const upperTagName = tagName.toUpperCase();
    // @ts-ignore
    return this._registry[upperTagName] ? this._registry[upperTagName].elementClass : undefined;
  }

  /**
   * Upgrades a custom element directly, even before it is connected to its shadow root.
   *
   * Not implemented yet.
   *
   * @param _root Root node.
   */
  public upgrade(_root: Node): void {
    // Do nothing
  }

  /**
   * When defined.
   *
   * @param tagName Tag name of element.
   * @returns Promise.
   */
  public whenDefined(tagName: string): Promise<void> {
    const upperTagName = tagName.toUpperCase();
    if (this.get(upperTagName)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this._callbacks[upperTagName] = this._callbacks[upperTagName] || [];
      this._callbacks[upperTagName].push(resolve);
    });
  }
}
