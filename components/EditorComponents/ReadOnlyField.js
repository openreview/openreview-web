import { prettyField } from '../../lib/utils'

const ReadOnlyField = ({ field, value }) => {
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

export default ReadOnlyField
