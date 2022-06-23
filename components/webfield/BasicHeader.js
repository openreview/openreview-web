// webfield.ui.header
const BasicHeader = ({ title, instructions, options }) => {
  if (options?.fullWidth) {
    return (
      <div id="header">
        <div className="container">
          <h1>{title}</h1>
          {instructions && <div className="description">{instructions}</div>}
          {options?.underline && <hr className="spacer" />}
        </div>
      </div>
    )
  }
  return (
    <div id="header">
      <h1>{title}</h1>
      {instructions && <div className="description">{instructions}</div>}
      {options?.underline && <hr className="spacer" />}
    </div>
  )
}

export default BasicHeader
