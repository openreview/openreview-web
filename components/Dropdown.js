import Select from 'react-select'

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
