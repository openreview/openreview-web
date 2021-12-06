import { useEffect, useState } from 'react'
import findIndex from 'lodash/findIndex'

export default function ToggleButtonGroup({
  name, className, options, values, isDisabled, onChange,
}) {
  const [optionStates, setOptionStates] = useState((new Array(options?.length || 0)).fill(0))
  const numStates = 3

  const onButtonClick = (e) => {
    const { value } = e.target
    const index = findIndex(options, option => option.value === value)
    const newOptionStates = [...optionStates]
    newOptionStates[index] = (newOptionStates[index] + 1) % numStates
    setOptionStates(newOptionStates)

    // Initialize empty arrays
    const selectedOptions = []
    for (let i = 0; i < numStates - 1; i += 1) {
      selectedOptions[i] = []
    }

    options.forEach((option, i) => {
      const groupIndex = newOptionStates[i] - 1
      // Option not selected
      if (groupIndex === -1) return

      selectedOptions[groupIndex].push(option)
    })
    onChange(selectedOptions)
  }

  useEffect(() => {
    if (!values || !options?.length) return

    const newOptionStates = (new Array(options.length)).fill(0)
    values.forEach((selectedValues, state) => {
      options.forEach((option, i) => {
        if (selectedValues.includes(option.value)) {
          newOptionStates[i] = state + 1
        }
      })
    })

    setOptionStates(newOptionStates)
  }, [options, values])

  if (!options) return null

  return (
    <div
      className={`btn-group btn-group-sm toggle-group ${className || ''} ${isDisabled ? 'disabled' : ''}`}
      role="group"
    >
      {options.map((option, i) => {
        const selected = optionStates[i] > 0
        return (
          <label key={option.value} className={`btn btn-default ${selected ? 'active' : ''} state-${optionStates[i]}`}>
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
