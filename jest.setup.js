globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.MessageChannel = class MessageChannel {
  constructor() {
    this.port1 = { onmessage: null, close() {} }
    this.port2 = {
      postMessage: (data) => {
        setTimeout(() => this.port1.onmessage?.({ data }), 0)
      },
      close() {},
    }
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    },
  }),
})
