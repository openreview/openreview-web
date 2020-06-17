import { useState, useEffect } from 'react'

const MultiSelectorDropdown = ({
  filters, onSelectionChange, disabled,
}) => {
  const allValues = [...filters.map(f => f.value), 'all']
  const [checkedValues, setCheckedValues] = useState(allValues)

  const handleSelectAllChange = (value) => {
    if (checkedValues.includes('all')) {
      setCheckedValues([])
    } else {
      setCheckedValues(allValues)
    }
  }

  const handleSelectValueChange = (value) => {
    if (checkedValues.includes(value)) {
      setCheckedValues(checkedValues.filter(v => v !== value && v !== 'all'))
    } else {
      setCheckedValues([...checkedValues, value])
    }
  }

  const getButtonText = () => {
    if (checkedValues.includes('all')) return 'All'
    if (checkedValues.length === 0) return 'None'
    if (checkedValues.length === 1) return checkedValues[0]
    return `${checkedValues.length} items`
  }

  useEffect(() => {
    onSelectionChange(checkedValues.filter(v => v !== 'all'))
  }, [checkedValues])

  return (
    <div className="multiselector dropdown">
      <button
        className="form-control dropdown-toggle"
        type="button"
        id="multiselection-button"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="true"
        disabled={disabled}
      >
        {getButtonText()}
      </button>
      <ul className="dropdown-menu checkbox-menu allow-focus" aria-labelledby="{{id}}">
        <li className="select-all-item">
          <label>
            <input value="all" className="select-all-checkbox" type="checkbox" checked={checkedValues.includes('all')} onChange={(e) => { handleSelectAllChange(e.target.value) }} />
            Select All
          </label>
        </li>
        {filters.map(filter => (
          <li key={filter.value}>
            <label>
              <input value={filter.value} type="checkbox" checked={checkedValues.includes(filter.value)} onChange={(e) => { handleSelectValueChange(e.target.value) }} />
              {filter.text}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MultiSelectorDropdown
