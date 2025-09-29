// webfield.ui.header
import { inflect, pluralizeString } from '../../lib/utils'
import Markdown from '../EditorComponents/Markdown'

const BasicHeader = ({ title, instructions, customLoad, submissionName, options }) => {
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
          {/* eslint-disable-next-line eqeqeq */}
          {customLoad && customLoad != 0 ? (
            <p className="dark">
              You have agreed to review up to{' '}
              <strong>
                {inflect(
                  customLoad,
                  submissionName.toLowerCase(),
                  pluralizeString(submissionName.toLowerCase()),
                  true
                )}
              </strong>
              .
            </p>
          ) : null}
        </div>
      )}
      {options?.underline && <hr className="spacer" />}
      {options?.extra}
    </div>
  )
}

export default BasicHeader
