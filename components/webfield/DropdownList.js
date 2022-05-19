import { nanoid } from 'nanoid'
import { prettyField } from '../../lib/utils'
import Dropdown from '../Dropdown'

export const DropdownList = ({ field, onChange, value }) => {
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  // eslint-disable-next-line prefer-destructuring
  const required = field[fieldName].required
  const options = field[fieldName]['value-dropdown'].map((p) => ({ label: p, value: p }))

  return (
    <div className="dropdown-list" key={nanoid()}>
      {required && <span className="required_field">*</span>}
      <span className="line_heading" title={fieldDescription}>
        {prettyField(fieldName)}
      </span>
      <Dropdown
        options={options}
        onChange={(e) => onChange({ field: fieldName, value: e.value })}
        value={options.find((p) => p.value === value)}
      />
    </div>
  )
}
export const DropdownListV2 = ({ field, onChange, value }) => {
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  const required = !field[fieldName].value?.optional
  const options = field[fieldName].value?.enum?.map((p) => ({ label: p, value: p }))

  return (
    <div className="dropdown-list" key={nanoid()}>
      {required && <span className="required_field">*</span>}
      <span className="line_heading" title={fieldDescription}>
        {prettyField(fieldName)}
      </span>
      <Dropdown
        options={options}
        onChange={(e) => onChange({ field: fieldName, value: e.value })}
        value={options.find((p) => p.value === value)}
      />
    </div>
  )
}
