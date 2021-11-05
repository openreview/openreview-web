import { useEffect, useState } from 'react'
import Select from 'react-select'
import { getDefaultTimezone, timezoneOptions } from '../lib/utils'

import '../styles/components/dropdown.less'

export const TimezoneDropdown = ({ className, onChange, value }) => {
  const defaultValue = getDefaultTimezone()

  return (
    <Dropdown
      className={className}
      placeholder="Select a timezone"
      options={timezoneOptions}
      value={timezoneOptions.find(p => p.value === value) ?? defaultValue}
      onChange={onChange}
    />
  )
}

export default function Dropdown(props) {
  // For more details see https://react-select.com/styles#overriding-the-theme
  const customTheme = theme => ({
    ...theme,
    borderRadius: 0,
    colors: {
      ...theme.colors,
      neutral0: '#fffaf4',
      primary25: '#ddd',
      primary: '#4d8093',
    },
    spacing: {
      baseUnit: 2,
      menuGutter: 4,
      controlHeight: props.height || 34,
    },
  })

  return (
    <Select
      className="dropdown-select"
      classNamePrefix="dropdown-select"
      theme={customTheme}
      // eslint-disable-next-line react/destructuring-assignment
      ref={props.selectRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  )
}
