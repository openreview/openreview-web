import { useEffect, useRef, useState } from 'react'
import useQuery from '../hooks/useQuery'
import LoadingSpinner from '../components/LoadingSpinner'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import usePdf from '../hooks/usePdf'
import PDFCanvas from '../components/PdfCanvas'

export default function PDFViewer() {
  const [noteId, setNoteId] = useState(null)
  const [pageContents, setPageContents] = useState([])
  const query = useQuery()
  const { accessToken } = useUser()
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
    if (!query || !initialized) return
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
