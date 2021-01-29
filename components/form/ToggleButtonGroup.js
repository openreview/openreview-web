import { useState } from 'react'

export default function ToggleButtonGroup({
  name, className, options, isDisabled, onChange,
}) {
  const [selectedOptions, setSelectedOptions] = useState(new Array(options.length).fill(null))

  const onButtonClick = (e) => {
    const targetIndex = parseInt(e.target.attributes['data-index'].value, 10)
    const newSelectedOptions = [...selectedOptions]
    newSelectedOptions[targetIndex] = newSelectedOptions[targetIndex] ? null : options[targetIndex]
    setSelectedOptions(newSelectedOptions)

    onChange(newSelectedOptions.filter(Boolean))
  }

  return (
    <div
      className={`btn-group btn-group-sm ${className || ''} ${isDisabled ? 'disabled' : ''}`}
      role="group"
      data-toggle="buttons"
    >
      {options.map((option, i) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <label key={option.value} className="btn btn-default" data-index={i} onClick={onButtonClick}>
          <input
            type="checkbox"
            name={name}
            value={option.value}
          />
          {' '}
          {option.label}
        </label>
      ))}
    </div>
  )
}
