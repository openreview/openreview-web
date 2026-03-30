/* globals promptError: false */

import { useState } from 'react'
import api from '../lib/api-client'
import SpinnerButton from './SpinnerButton'

const DownloadPDFButton = ({ records, fileName, text = 'Download PDFs' }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownloadPDFClick = async () => {
    setIsLoading(true)
    try {
      let ids = records.flatMap((p) => (p.note.content?.pdf?.value ? p.note.id : []))

      if (ids.length > 50) {
        ids = ids.slice(0, 50)
        promptError('Max 50 PDFs allowed.')
      }
      const zipBlob = await api.get(
        '/attachment',
        { [ids.length === 1 ? 'id' : 'ids']: ids, name: 'pdf' },
        { contentType: 'blob' }
      )
      const url = window.URL || window.webkitURL
      const link = document.createElement('a')
      link.href = url.createObjectURL(zipBlob)
      link.download = fileName
      link.click()
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  return (
    <SpinnerButton
      className="btn btn-export-data"
      disabled={!records?.some((p) => p.note.content?.pdf?.value) || isLoading}
      loading={isLoading}
      onClick={handleDownloadPDFClick}
    >
      {text}
    </SpinnerButton>
  )
}

export default DownloadPDFButton
