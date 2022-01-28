
export default function ConsoleTable({ tableHeadings, rows, RowComponents, columnWidths }) {
  return (
    <div className="table-container">
      <table className="table table-striped console-table">
        {tableHeadings?.length > 0 && (
          <thead>
            <tr>
              {tableHeadings.map((heading, i) => (
                <th
                  key={i}
                  className={`row-${i}`}
                  style={columnWidths ? { width: columnWidths[i] } : null}
                >
                  {heading === '[]' ? <input type="checkbox" className="select-all-papers" /> : heading}
                </th>
              ))}
            </tr>
          </thead>
        )}

        <tbody>
          {rows?.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => {
                const RowComponent = RowComponents[j]
                return (
                  <td key={`${j},${i}`}>
                    <RowComponent data={cell} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
