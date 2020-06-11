import { useState, useEffect } from 'react'

const MultiSelectorDropdown = ({
  filters, onChange, parentId,
}) => {
  const allValues = [...filters.map(f => f.value), 'all']
  const [checkedValues, setCheckedValues] = useState(allValues)

  const handleSelectChange = (value) => {
    if (checkedValues.includes(value)) {
      if (value === 'all') {
        setCheckedValues([])
      } else {
        setCheckedValues(checkedValues.filter(v => v !== value && v !== 'all'))
      }
    } else {
      // select
      // eslint-disable-next-line no-lonely-if
      if (value === 'all') {
        setCheckedValues(filters)
      } else {
        setCheckedValues([...checkedValues, value])
      }
    }
  }

  const getButtonText = () => {
    if (checkedValues.includes('all')) return 'All'
    if (checkedValues.length === 0) return 'None'
    if (checkedValues.length === 1) return checkedValues[0]
    return `${checkedValues.length} items`
  };

  useEffect(() => {
    onChange(parentId, checkedValues.filter(v => v !== 'all'))
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
      >
        {getButtonText()}
      </button>
      <ul className="dropdown-menu checkbox-menu allow-focus" aria-labelledby="{{id}}">
        <li className="select-all-item">
          <label>
            <input value="all" className="select-all-checkbox" type="checkbox" checked={checkedValues.includes('all')} onChange={(e) => { handleSelectChange(e.target.value) }} />
            Select All
          </label>
        </li>
        {filters.map(filter => (
          <li key={filter.value}>
            <label>
              <input value={filter.value} type="checkbox" checked={checkedValues.includes(filter.value)} onChange={(e) => { handleSelectChange(e.target.value) }} />
              {filter.text}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MultiSelectorDropdown
