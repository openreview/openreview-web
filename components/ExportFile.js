import { Button } from 'antd'

const ExportFile = ({
  records,
  fileName,
  exportColumns,
  buttonText = 'Export',
  customTransformFn,
  exportType = 'text/csv',
}) => {
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
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      promptError(error.message)
    }
  }
  return (
    <Button type="primary" onClick={handleExportClick}>
      {buttonText}
    </Button>
  )
}

export default ExportFile
