import { prettyField } from '../../lib/utils'

export const ReadOnlyField = ({ field, value }) => {
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  // eslint-disable-next-line prefer-destructuring
  const required = field[fieldName].required

  return (
    <div className="readonly-field">
      {required && <span className="required_field">*</span>}
      <span className="line_heading" title={fieldDescription}>
        {prettyField(fieldName)}
      </span>
      <span className="line_value">{value ?? ''}</span>
    </div>
  )
}

export const ReadOnlyFieldV2 = ({ field, value }) => {
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  const required = !field[fieldName].value?.param?.optional

  return (
    <div className="readonly-field">
      {required && <span className="required_field">*</span>}
      <span className="line_heading" title={fieldDescription}>
        {prettyField(fieldName)}
      </span>
      <span className="line_value">{value ?? ''}</span>
    </div>
  )
}
