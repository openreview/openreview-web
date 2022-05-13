function Table({ className, headings, children }) {
  return (
    <table className={`table ${className || ''}`}>
      <thead>
        <tr>
          {headings.map((heading, index) => (
            <th
              key={heading.id || index}
              scope="col"
              style={heading.width ? { width: heading.width } : null}
            >
              {heading.content}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

export default Table
