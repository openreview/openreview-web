import { useState } from 'react'

export default function ToggleButtonGroup({
  name, className, options, isDisabled, onChange,
}) {
  const [selectedOptions, setSelectedOptions] = useState([])

  const onButtonClick = (e) => {
    const { checked, value } = e.target
    const newSelectedOptions = checked
      ? [...selectedOptions, options.find(option => option.value === value)]
      : selectedOptions.filter(option => option.value !== value)

    setSelectedOptions(newSelectedOptions)
    onChange(newSelectedOptions)
  }

  return (
    <div
      className={`btn-group btn-group-sm toggle-group ${className || ''} ${isDisabled ? 'disabled' : ''}`}
      role="group"
    >
      {options?.map((option) => {
        const selected = selectedOptions.includes(option)
        return (
          <label key={option.value} className={`btn btn-default ${selected ? 'active' : ''}`}>
            <input
              type="checkbox"
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
