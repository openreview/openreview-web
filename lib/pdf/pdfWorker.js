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
}
Comlink.expose(new PdfWorker())
