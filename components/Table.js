const Table = ({ headings, children }) => (
  <table className="table">
    <thead>
      <tr>
        {headings.map((heading, index) => (
          <th scope="col" key={heading.id} style={heading.width ? { width: heading.width } : {}}>
            {heading.content}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {children}
    </tbody>
  </table>
)

export default Table
