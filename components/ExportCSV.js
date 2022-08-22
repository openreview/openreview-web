import { useState } from 'react'

const ExportCSV = ({ records, fileName }) => {
  const [href, setHref] = useState(null)
  const handleExportClick = () => {
    const blob = new Blob(['a,b,c\n', '1,2,3'], { type: 'text/csv' })
    const url = window.URL || window.webkitURL
    setHref(url.createObjectURL(blob))
  }
  return (
    <button className="btn btn-export-data">
      <a download={fileName} href={href} onClick={handleExportClick}>
        Export
      </a>
    </button>
  )
}

export default ExportCSV
