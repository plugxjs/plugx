import createVirtualEnvironment from '@locker/near-membrane-dom'
import CustomElementRegistry from 'happy-dom/lib/custom-element/CustomElementRegistry.js'

export interface Sandbox {
  evaluate (code: string): unknown

  allowPermission (permission: Permission): void

  disallowPermission (permission: Permission): void
}

export class NoPermissionError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'NoPermissionError'
  }
}

export enum Permission {
  DOM,
  NetWork,
  Worker,
  Storage,
  Clipboard,
}

export function createPlugxSandbox (): Sandbox {
  const DOMPermission = [
    document.createElement,
    document.createTextNode,
    document.createComment,
    document.createDocumentFragment,
    document.createEvent,
    document.createRange,
    document.createTreeWalker,
    document.importNode,
    document.adoptNode,
    document.elementFromPoint,
    document.elementsFromPoint,
    document.caretRangeFromPoint,
    document.getSelection,
    document.createNodeIterator,
    document.createEvent,
    document.querySelector,
    document.querySelectorAll,
    document.getElementById,
    document.getElementsByClassName,
    document.getElementsByName,
    document.getElementsByTagName,
    document.getElementsByTagNameNS
  ]

  const NetWorkPermission = [
    fetch,
    XMLHttpRequest,
    WebSocket
  ]

  const permissionListMap = new Map<Permission, object[]>([
    [Permission.DOM, DOMPermission],
    [Permission.NetWork, NetWorkPermission]
  ])

  const sandboxCustomElements = new CustomElementRegistry()

  const {
    get: getCustomElements
  } = Object.getOwnPropertyDescriptor(window, 'customElements')!

  const distortionMap = new Map<unknown, () => unknown>([
    [getCustomElements, () => sandboxCustomElements]
  ])
  const environment = createVirtualEnvironment(window, {
    distortionCallback (v) {
      return distortionMap.get(v) ?? v
    },
    globalObjectShape: window
  })
  const sandbox = {
    allowPermission (permission: Permission) {
      permissionListMap.get(permission)?.forEach((v) => {
        distortionMap.set(v, () => {
          throw new NoPermissionError(`No permission to call ${v}`)
        })
      })
    },
    disallowPermission (permission: Permission) {
      permissionListMap.get(permission)?.forEach((v) => {
        distortionMap.delete(v)
      })
    },
    evaluate (code: string) {
      return environment.evaluate(code)
    }
  }

  permissionListMap.forEach((_, permission) => {
    sandbox.disallowPermission(permission)
  })

  Object.freeze(sandbox)

  return sandbox
}
