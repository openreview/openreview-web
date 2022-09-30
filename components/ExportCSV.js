import { useState } from 'react'

const ExportCSV = ({ records, fileName, exportColumns }) => {
  const [href, setHref] = useState(null)

  const handleExportClick = () => {
    const headerRow = `${exportColumns.map((p) => p.header).join(',')}\n`
    const dataRows = records.map(
      (p) =>
        `${exportColumns
          .map((column) => {
            const value = column.getValue(p, p.note?.version === 2)?.toString()
            return `"${value?.replaceAll('"', '""')}"`
          })
          .join(',')}\n`
    )

    const blob = new Blob([headerRow, ...dataRows], { type: 'text/csv' })
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
