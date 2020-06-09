const Table = ({ headings, children }) => (
  <table className="table">
    <thead>
      <tr>
        {headings.map((heading, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <th scope="col" key={index} style={heading.width ? { width: heading.width } : {}}>
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
