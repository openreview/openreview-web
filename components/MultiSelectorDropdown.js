export default function MultiSelectorDropdown({
  id,
  options,
  selectedValues,
  setSelectedValues,
  disabled,
  optionsDisabled = false,
  extraClass = undefined,
  displayTextFn = undefined,
}) {
  const allValues = options.map((f) => f.value)
  const numOptions = allValues.length

  const handleSelectAllChange = () => {
    if (optionsDisabled) return
    if (selectedValues?.length === numOptions) {
      setSelectedValues([])
    } else {
      setSelectedValues(allValues)
    }
  }

  const handleSelectValueChange = (value) => {
    if (optionsDisabled) return
    if (selectedValues?.includes(value)) {
      setSelectedValues(selectedValues?.filter((v) => v !== value))
    } else {
      setSelectedValues([...(selectedValues ?? []), value])
    }
  }

  const getButtonText = () => {
    if (displayTextFn) return displayTextFn(selectedValues)
    if (selectedValues?.length === numOptions) return 'All'
    if (selectedValues?.length === 0) return 'None'
    if (selectedValues?.length === 1) return selectedValues[0]
    return `${selectedValues?.length} items`
  }

  return (
    <div className={`multiselector dropdown ${extraClass}`}>
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
              checked={selectedValues?.length === numOptions}
              onChange={(e) => handleSelectAllChange(e.target.value)}
              disabled={optionsDisabled}
            />
            Select All
          </label>
        </li>
        {options.map((option) => (
          <li key={option.value}>
            <label>
              <input
                value={option.value}
                type="checkbox"
                checked={selectedValues?.includes(option.value)}
                onChange={(e) => handleSelectValueChange(e.target.value)}
                disabled={optionsDisabled}
              />
              {option.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
