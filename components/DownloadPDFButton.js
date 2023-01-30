/* globals promptError: false */

import { useContext, useState } from 'react'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import SpinnerButton from './SpinnerButton'
import WebFieldContext from './WebFieldContext'

const DownloadPDFButton = ({ records, fileName, text = 'Download PDFs' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { apiVersion } = useContext(WebFieldContext)
  const { accessToken } = useUser()

  const hasPdf = (record) =>
    apiVersion === 2 ? record.note?.content?.pdf?.value : record.note?.content?.pdf

  const handleDownloadPDFClick = async () => {
    setIsLoading(true)
    try {
      let ids = records.flatMap((p) => (hasPdf(p) ? p.note.id : []))

      if (ids.length > 50) {
        ids = ids.slice(0, 50)
        promptError('Max 50 PDFs allowed.')
      }
      const zipBlob = await api.get(
        '/attachment',
        { [ids.length === 1 ? 'id' : 'ids']: ids, name: 'pdf' },
        { accessToken, contentType: 'blob', version: apiVersion }
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
      disabled={!records?.some(hasPdf) || isLoading}
      loading={isLoading}
      onClick={handleDownloadPDFClick}
    >
      {text}
    </SpinnerButton>
  )
}

export default DownloadPDFButton
