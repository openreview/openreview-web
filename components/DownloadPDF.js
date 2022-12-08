/* globals promptError: false */

import { useContext, useState } from 'react'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import SpinnerButton from './SpinnerButton'
import WebFieldContext from './WebFieldContext'

const DownloadPDF = ({ records, fileName }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { apiVersion } = useContext(WebFieldContext)
  const { accessToken } = useUser()
  const hasPdf = records?.some((p) =>
    apiVersion === 2 ? p.note?.content?.pdf?.value : p.note?.content?.pdf
  )

  const handleDownloadPDFClick = async () => {
    setIsLoading(true)
    try {
      const ids = records.map((p) => p.note.id)
      const zipBlob = await api.get(
        '/attachment',
        { ids, name: 'pdf' },
        { accessToken, contentType: 'blob' }
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
      disabled={!hasPdf}
      loading={isLoading}
      onClick={handleDownloadPDFClick}
    >
      Download PDF
    </SpinnerButton>
  )
}

export default DownloadPDF
