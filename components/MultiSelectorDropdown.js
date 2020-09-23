import { useState } from 'react'

export default function MultiSelectorDropdown({
  id, options, selectedOptions, onSelectionChange, disabled,
}) {
  console.log('dropdown', {selectedOptions});
  const [selectedValues, setSelectedValues] = useState(selectedOptions)
  console.log('after selectedValues', selectedValues);
  const allValues = options.map(f => f.value)
  const numOptions = allValues.length

  const handleSelectAllChange = () => {
    console.log('handleSelectAllChange', selectedValues, numOptions);
    if (selectedValues.length === numOptions) {
      console.log('set empty selected vakyes');
      setSelectedValues([])
      onSelectionChange([])
    } else {
      setSelectedValues(allValues)
      onSelectionChange(allValues)
    }
  }

  const handleSelectValueChange = (value) => {
    console.log('handleSelectValueChange');
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value))
      onSelectionChange(selectedValues.filter(v => v !== value))
    } else {
      setSelectedValues([...selectedValues, value])
      onSelectionChange([...selectedValues, value])
    }
  }

  const getButtonText = () => {
    console.log('buttonText', selectedValues);
    if (selectedValues.length === numOptions) return 'All'
    if (selectedValues.length === 0) return 'None'
    if (selectedValues.length === 1) return selectedValues[0]
    return `${selectedValues.length} items`
  }

  return (
    <div className="multiselector dropdown">
      <button
        className="form-control dropdown-toggle"
        type="button"
        id={id}
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="true"
        disabled={disabled}
      >
        {getButtonText()}
      </button>
      <ul className="dropdown-menu checkbox-menu allow-focus">
        <li className="select-all-item">
          <label>
            <input
              value="all"
              className="select-all-checkbox"
              type="checkbox"
              checked={selectedValues.length === numOptions}
              onChange={e => handleSelectAllChange(e.target.value)}
            />
            Select All
          </label>
        </li>
        {options.map(option => (
          <li key={option.value}>
            <label>
              <input
                value={option.value}
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={e => handleSelectValueChange(e.target.value)}
              />
              {option.text}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
