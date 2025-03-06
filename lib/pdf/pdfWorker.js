import * as Comlink from 'comlink'

// eslint-disable-next-line import/prefer-default-export
export class PdfWorker {
  #document

  #muPdfInstance

  constructor() {
    this.initializeMuPdf()
  }

  async initializeMuPdf() {
    const instance = await import('./mupdf')
    this.#muPdfInstance = instance
    postMessage('MUPDF_LOADED')
  }

  async loadDocument(arrayBuffer) {
    try {
      if (!this.#muPdfInstance) return false
      this.#document = this.#muPdfInstance.Document.openDocument(
        arrayBuffer,
        'application/pdf'
      )
      return true
    } catch (error) {
      return false
    }
  }

  async getDocumentMeta(meta) {
    if (!this.#muPdfInstance || !this.#document) return null
    return this.#document.getMetaData(meta)
  }

  async getDocumentPageCount() {
    if (!this.#muPdfInstance || !this.#document) return null
    return this.#document.countPages()
  }

  async getDocumentCoverImage() {
    if (!this.#muPdfInstance || !this.#document) return null
    try {
      const firstPage = this.#document.loadPage(0)
      return firstPage
        .toPixmap([0.1, 0, 0, 0.1, 0, 0], this.#muPdfInstance.ColorSpace.DeviceRGB)
        .asPNG()
    } catch (error) {
      return null
    }
  }

  async loadPageImageData(pageNumber, devicePixelRatio) {
    if (!this.#muPdfInstance || !this.#document) return null
    try {
      const page = this.#document.loadPage(pageNumber)

      const doc_to_screen = this.#muPdfInstance.Matrix.scale(
        devicePixelRatio / 72,
        devicePixelRatio / 72
      )
      const bbox = this.#muPdfInstance.Rect.transform(page.getBounds(), doc_to_screen)

      const pixmap = new this.#muPdfInstance.Pixmap(
        this.#muPdfInstance.ColorSpace.DeviceRGB,
        bbox,
        true
      )

      pixmap.clear(255)

      let device = new this.#muPdfInstance.DrawDevice(doc_to_screen, pixmap)
      page.run(device, this.#muPdfInstance.Matrix.identity)
      device.close()

      const imageData = new ImageData(
        pixmap.getPixels().slice(),
        pixmap.getWidth(),
        pixmap.getHeight()
      )
      pixmap.destroy()
      return imageData
    } catch (error) {
      return null
    }
  }
}
Comlink.expose(new PdfWorker())
