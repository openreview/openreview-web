export default function RadioButtonGroup({
  name, className, options, isDisabled, onChange, selectedOptionValue,
}) {
  const onButtonClick = (e) => {
    const { value } = e.target
    const newSelectedOption = options.find(option => option.value === value)

    onChange(newSelectedOption)
  }

  return (
    <div
      className={`btn-group btn-group-sm toggle-group ${className || ''} ${isDisabled ? 'disabled' : ''}`}
      role="group"
    >
      {options?.map((option) => {
        const selected = option.value === selectedOptionValue
        return (
          <label key={option.value} className={`btn btn-default ${selected ? 'active' : ''}`}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={onButtonClick}
            />
            {' '}
            {option.label}
          </label>
        )
      })}
    </div>
  )
}
