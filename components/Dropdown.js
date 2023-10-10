import { useEffect, useRef } from 'react'
import Select, { components, createFilter } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import List from 'rc-virtual-list'
import { getDefaultTimezone, prettyId, timezoneOptions } from '../lib/utils'

// For more details see https://react-select.com/styles#overriding-the-theme
const createCustomTheme = (height) => (theme) => ({
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

export const TimezoneDropdown = ({ className, onChange, value }) => {
  const defaultValue = getDefaultTimezone()

  return (
    <Dropdown
      className={className}
      placeholder="Select a timezone"
      options={timezoneOptions}
      value={timezoneOptions.find((p) => p.value === value) ?? defaultValue}
      onChange={onChange}
    />
  )
}

export const NoteEditorReadersDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select readers',
}) => {
  const styles = {
    multiValueLabel: (base, state) =>
      state.data.optional
        ? base
        : { ...base, opacity: '60%', cursor: 'not-allowed', paddingRight: 6 },
    multiValueRemove: (base, state) =>
      state.data.optional ? base : { ...base, display: 'none' },
  }
  return (
    <Dropdown
      styles={styles}
      options={options}
      placeholder={placeholder}
      isMulti
      value={value}
      onChange={onChange}
      components={{
        DropdownIndicator: () => null,
      }}
    />
  )
}

const CustomOption = ({ children, ...props }) => {
  const { onMouseMove, onMouseOver, ...rest } = props.innerProps
  const newProps = { ...props, innerProps: rest }
  return (
    <components.Option
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...newProps}
    >
      {children}
    </components.Option>
  )
}

const CustomMenuList = ({ children }) => (
  <List
    data={Array.isArray(children) ? children : [children]}
    height={300}
    itemHeight={20}
    itemKey="key"
  >
    {(option) => <div className="item">{option}</div>}
  </List>
)

export const CreatableDropdown = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const customTheme = createCustomTheme(props.height)
  const dropdownRef = useRef(null)
  let customComponents = {}
  // eslint-disable-next-line react/destructuring-assignment
  if (props.hideArrow) {
    customComponents = {
      ...customComponents,
      DropdownIndicator: () => null,
      IndicatorSeparator: () => null,
    }
  }
  // eslint-disable-next-line react/destructuring-assignment
  if (props.disableMouseMove) {
    customComponents = {
      ...customComponents,
      Option: CustomOption,
    }
  }
  // eslint-disable-next-line react/destructuring-assignment
  if (props.virtualList) {
    customComponents = {
      ...customComponents,
      MenuList: CustomMenuList,
    }
  }
  // eslint-disable-next-line react/destructuring-assignment
  if (props.hideArrow) {
    // eslint-disable-next-line no-param-reassign
    props = {
      ...props,
      components: customComponents,
    }
  }
  useEffect(() => {
    if (props.autofocus) dropdownRef.current.focus()
  }, [])

  return (
    <CreatableSelect
      ref={dropdownRef}
      theme={customTheme}
      formatCreateLabel={(value) => value}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  )
}

export default function Dropdown(props) {
  const customTheme = createCustomTheme(props.height)
  const defaultFilterOption = {
    ignoreCase: true,
    ignoreAccents: true,
    matchFrom: 'any',
    stringify: (option) => `${option.label} ${option.value}`,
    trim: true,
  }
  const filterOption = createFilter(props.filterOption ?? defaultFilterOption)

  if (props.hideArrow) {
    // eslint-disable-next-line no-param-reassign
    props = {
      ...props,
      components: {
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
      },
    }
  }

  return (
    <Select
      className="dropdown-select"
      classNamePrefix="dropdown-select"
      theme={customTheme}
      ref={props.selectRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      filterOption={filterOption}
    />
  )
}
