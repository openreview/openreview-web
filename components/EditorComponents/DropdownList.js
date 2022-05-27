import { useContext } from 'react'
import { prettyField } from '../../lib/utils'
import Dropdown from '../Dropdown'
import { EditorComponentContext } from '../EditorComponentContext'

export const DropdownList = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  // eslint-disable-next-line prefer-destructuring
  const required = field[fieldName].required
  const options = field[fieldName]['value-dropdown'].map((p) => ({ label: p, value: p }))

  return (
    <div className="dropdown-list">
      {required && <span className="required_field">*</span>}
      <span className="line_heading" title={fieldDescription}>
        {prettyField(fieldName)}
      </span>
      <Dropdown
        options={options}
        onChange={(e) => onChange({ fieldName, value: e.value })}
        value={options.find((p) => p.value === value)}
      />
    </div>
  )
}
export const DropdownListV2 = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  const required = !field[fieldName].value?.optional
  const options = field[fieldName].value?.enum?.map((p) => ({ label: p, value: p }))

  return (
    <div className="dropdown-list">
      {required && <span className="required_field">*</span>}
      <span className="line_heading" title={fieldDescription}>
        {prettyField(fieldName)}
      </span>
      <Dropdown
        options={options}
        onChange={(e) => onChange({ fieldName, value: e.value })}
        value={options.find((p) => p.value === value)}
      />
    </div>
  )
}
