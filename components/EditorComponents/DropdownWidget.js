import { useContext } from 'react'
import Dropdown from '../Dropdown'
import EditorComponentContext from '../EditorComponentContext'

const DropdownWidget = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const options = field[fieldName].value?.param?.enum?.map((p) => ({ label: p, value: p }))

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

export default DropdownWidget
