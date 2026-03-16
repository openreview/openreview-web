/* globals promptError: false */
import { useState } from 'react'

const ExportFile = ({
  records,
  fileName,
  exportColumns,
  buttonText = 'Export',
  customTransformFn,
  exportType = 'text/csv',
}) => {
  const [href, setHref] = useState(null)

  const handleExportClick = () => {
    const headerRow =
      exportType === 'text/csv' && `${exportColumns?.map((p) => p.header).join(',')}\n`
    try {
      let dataRows
      if (customTransformFn) {
        dataRows = customTransformFn(records)
      } else {
        dataRows = records.map(
          (p) =>
            `${exportColumns
              .map((column) => {
                let getValueFn = column.getValue
                if (typeof column.getValue === 'string') {
                  // user defined in config
                  getValueFn = Function('row', column.getValue)
                }
                const value = getValueFn(p)?.toString()
                return `"${value?.replaceAll('"', '""')}"`
              })
              .join(',')}\n`
        )
      }
      const blob = headerRow
        ? new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), headerRow, ...dataRows], {
            type: exportType,
          })
        : new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), ...dataRows], {
            type: exportType,
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
        {buttonText}
      </a>
    </button>
  )
}

export default ExportFile
