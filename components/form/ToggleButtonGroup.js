/* globals $: false */
import { useEffect, useState } from 'react'
import truncate from 'lodash/truncate'
import findIndex from 'lodash/findIndex'
import Icon from '../Icon'

export default function ToggleButtonGroup({
  name,
  className,
  options,
  values,
  isDisabled,
  onChange,
  includeReset,
}) {
  const [optionStates, setOptionStates] = useState(new Array(options?.length || 0).fill(0))
  const numStates = 3
  const maxLabelLength = 22

  const onButtonClick = (e) => {
    const { value } = e.target
    const index = findIndex(options, (option) => option.value === value)
    const newOptionStates = [...optionStates]
    newOptionStates[index] = (newOptionStates[index] + 1) % numStates

    // Special case for adding "everyone" to the list of excluded options
    if (newOptionStates[index] === 2 && newOptionStates[0] !== 2) {
      newOptionStates[0] = 2
    } else if (newOptionStates[index] === 0 && newOptionStates[0] === 2) {
      if (newOptionStates.every((state, i) => i === 0 || state !== 2)) {
        newOptionStates[0] = 0
      }
    }
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

  const onResetClick = () => {
    setOptionStates(new Array(options?.length || 0).fill(0))

    onChange(new Array(numStates - 1).fill([]))
  }

  useEffect(() => {
    if (!values || !options?.length) return

    const newOptionStates = new Array(options.length).fill(0)
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
      className={`btn-group btn-group-sm toggle-group ${className || ''} ${
        isDisabled ? 'disabled' : ''
      }`}
      role="group"
    >
      {options.map((option, i) => {
        const selected = optionStates[i] > 0
        return (
          <label
            key={option.value}
            className={`btn btn-default ${selected ? 'active' : ''} state-${optionStates[i]}`}
            data-toggle="tooltip"
            title={option.label}
            onMouseEnter={(e) => {
              $(e.target).tooltip({ container: 'body' })
            }}
            onMouseLeave={(e) => {
              $(e.target).tooltip('hide')
            }}
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selected}
              onChange={onButtonClick}
            />{' '}
            {truncate(option.label, {
              length: maxLabelLength,
              omission: '...',
              separator: ' ',
            })}
          </label>
        )
      })}
      {includeReset && (
        <label className="btn btn-default reset-btn">
          <input
            type="checkbox"
            name="reset"
            value="reset"
            checked={false}
            onChange={onResetClick}
          />{' '}
          <Icon name="remove" tooltip="Reset" />
          <span className="sr-only">Reset</span>
        </label>
      )}
    </div>
  )
}
