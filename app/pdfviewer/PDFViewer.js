'use client'

import { useEffect, useState } from 'react'
import usePdf from '../../hooks/usePdf'
import LoadingSpinner from '../../components/LoadingSpinner'
import PDFCanvas from '../../components/PDFCanvas'
import api from '../../lib/api-client'

export default function PDFViewer({ query, accessToken }) {
  const [noteId, setNoteId] = useState(null)
  const [pageContents, setPageContents] = useState([])
  const { initialized, loadDocument, getPageContent, getPagesCount } = usePdf(accessToken)

  const loadPdf = async (id) => {
    try {
      const result = await api.get('/pdf', { id }, { accessToken, contentType: 'blob' })
      await loadDocument(await result.arrayBuffer())
      // const pageImageData = await getPageContent(100, 80)
      const pages = await getPagesCount()

      const contents = await Promise.all(
        Array(pages)
          .keys()
          .map((_, index) => getPageContent(index, 96))
      )

      setPageContents(contents)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!query?.id || !initialized) return
    setNoteId(query.id)
    loadPdf(query.id)
  }, [query, initialized])

  if (!noteId || !pageContents.length) return <LoadingSpinner />
  return (
    <div className="pdf-container">
      {/* eslint-disable-next-line arrow-body-style */}
      {pageContents.map((pageContent, index) => {
        return <PDFCanvas key={index} pageContent={pageContent} />
      })}
    </div>
  )
}
