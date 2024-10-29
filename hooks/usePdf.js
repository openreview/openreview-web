import { useEffect, useRef, useState } from 'react'
import * as Comlink from 'comlink'

export default function usePdf() {
  const [initialized, setInitialized] = useState(false)
  const mupdfWorker = useRef(null)
  const document = useRef(null)

  const initializeMuPdf = async () => {
    const worker = new Worker(new URL('../lib/pdf/pdfWorker.js', import.meta.url), {
      type: 'module',
    })

    worker.addEventListener('message', (event) => {
      if (event.data === 'MUPDF_LOADED') {
        setInitialized(true)
      }
    })
    mupdfWorker.current = Comlink.wrap(worker)
  }

  const loadDocument = async (doc) => {
    document.current = doc
    return mupdfWorker.current.loadDocument(doc)
  }

  const getMeta = async (meta) => {
    if (!document.current) return null
    return mupdfWorker.current.getDocumentMeta(meta)
  }

  const getPagesCount = async () => {
    if (!document.current) return null
    return mupdfWorker.current.getDocumentPageCount()
  }

  const getCoverImage = async () => {
    if (!document.current) return null
    return mupdfWorker.current.getDocumentCoverImage()
  }

  useEffect(() => {
    initializeMuPdf()
  }, [])
  return { initialized, loadDocument, getMeta, getPagesCount, getCoverImage }
}
