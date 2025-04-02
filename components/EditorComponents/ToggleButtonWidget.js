import { useContext, useEffect } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import ToggleButton from './ToggleButton'

const ToggleButtonWidget = () => {
  const { field, onChange, value, note } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  useEffect(() => {
    if (note) return
    const defaultValue = field[fieldName].value?.param?.default
    onChange({ fieldName, value: defaultValue ?? false })
  }, [])

  return (
    <ToggleButton
      value={value}
      onChange={(newValue) => onChange({ fieldName, value: newValue })}
    />
  )
}

export default ToggleButtonWidget
