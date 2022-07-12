// webfield.ui.header
import Markdown from '../EditorComponents/Markdown'

const BasicHeader = ({ title, instructions, customLoad, options }) => {
  if (options?.fullWidth) {
    return (
      <div id="header">
        <div className="container">
          <h1>{title}</h1>
          {instructions && (
            <div className="description">
              <Markdown text={instructions} />
            </div>
          )}
          {options?.underline && <hr className="spacer" />}
        </div>
      </div>
    )
  }
  return (
    <div id="header">
      <h1>{title}</h1>
      {instructions && (
        <div className="description">
          <Markdown text={instructions} />
          {customLoad && customLoad !== 0 ? (
            <p className="dark">
              You have agreed to review up to <strong>{`${customLoad} papers`}</strong>.
            </p>
          ) : null}
        </div>
      )}
      {options?.underline && <hr className="spacer" />}
    </div>
  )
}

export default BasicHeader
