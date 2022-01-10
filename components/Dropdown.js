import { useEffect, useRef } from 'react'
import Select, { components } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import List from 'rc-virtual-list'

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

const customMenuList = ({ children }) => (
  <List data={children} height={300} itemHeight={20} itemKey="key">
    {option => <div className="item">{option}</div>}
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
      MenuList: customMenuList,
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
      formatCreateLabel={value => value}
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
      ref={props.selectRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  )
}
