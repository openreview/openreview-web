/* globals promptError: false */
import { useState } from 'react'

const ExportCSV = ({ records, fileName, exportColumns }) => {
  const [href, setHref] = useState(null)

  const handleExportClick = () => {
    const headerRow = `${exportColumns.map((p) => p.header).join(',')}\n`
    try {
      const dataRows = records.map(
        (p) =>
          `${exportColumns
            .map((column) => {
              let getValueFn = column.getValue
              if (typeof column.getValue === 'string') {
                // user defined in config
                getValueFn = Function('row', column.getValue) // eslint-disable-line no-new-func
              }
              const value = getValueFn(p)?.toString()
              return `"${value?.replaceAll('"', '""')}"`
            })
            .join(',')}\n`
      )
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), headerRow, ...dataRows], {
        type: 'text/csv',
      })
      const url = window.URL || window.webkitURL
      setHref(url.createObjectURL(blob))
    } catch (error) {
      promptError(error.message)
    }
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
