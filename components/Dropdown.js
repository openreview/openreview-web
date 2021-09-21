import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'

import '../styles/components/dropdown.less'

// For more details see https://react-select.com/styles#overriding-the-theme
const createCustomTheme = height => theme => ({
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
    controlHeight: height || 34,
  },
})

export const CreatableDropdown = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const customTheme = createCustomTheme(props.height)
  // eslint-disable-next-line max-len,no-param-reassign,react/destructuring-assignment
  if (props.hideArrow) props = { ...props, components: { DropdownIndicator: () => null, IndicatorSeparator: () => null } }
  return (
    <CreatableSelect
      theme={customTheme}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  )
}

export default function Dropdown(props) {
  // eslint-disable-next-line react/destructuring-assignment
  const customTheme = createCustomTheme(props.height)
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
