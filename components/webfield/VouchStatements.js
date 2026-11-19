export default function VouchStatements({ statements, checked, setChecked }) {
  return (
    <div className="form-group">
      {statements.map((statement) => (
        <div className="checkbox" key={statement}>
          <label>
            <input
              type="checkbox"
              checked={checked.includes(statement)}
              onChange={(e) =>
                setChecked((existing) =>
                  e.target.checked
                    ? [...existing, statement]
                    : existing.filter((p) => p !== statement)
                )
              }
            />{' '}
            {statement}
          </label>
        </div>
      ))}
    </div>
  )
}
