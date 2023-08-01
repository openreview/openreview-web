// this file is used only for v1 venue that has RecruitmentForm component
// remove when v1 is deprecated

import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import Dropdown from '../Dropdown'

const DropdownList = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const options = field[fieldName]['value-dropdown'].map((p) => ({ label: p, value: p }))

  return (
    <div className="dropdown-list">
      <Dropdown
        options={options}
        onChange={(e) => onChange({ fieldName, value: e.value })}
        value={options.find((p) => p.value === value)}
      />
    </div>
  )
}

const TextArea = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  return (
    <div className="textarea">
      <div className="content">
        <textarea
          className="note_content_value form-control"
          onChange={(e) => onChange({ fieldName, value: e.target.value })}
          value={value ?? ''}
        />
      </div>
    </div>
  )
}

const RecruitFormWidget = () => {
  const { field } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  if (field[fieldName]['value-dropdown']) {
    return <DropdownList />
    // eslint-disable-next-line no-else-return
  } else if (field[fieldName]['value-regex']) {
    return <TextArea />
  }
  return null
}

export default RecruitFormWidget
