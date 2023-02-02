import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from './EditorComponentHeader'

import styles from '../../styles/components/CheckboxWidget.module.scss'

const CheckboxWidget = () => {
  const { field, onChange, value = [], isWebfield } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const options = field[fieldName].value?.param?.enum
  const defaultValues = field[fieldName].value?.param?.default

  const handleCheckboxClick = (e) => {
    const optionValue = e.target.value
    if (value?.includes(optionValue)) {
      onChange({ fieldName, value: value.filter((p) => p !== optionValue) })
    } else {
      onChange({ fieldName, value: [...value, optionValue] })
    }
  }

  if (!Array.isArray(options)) return null
  return (
    <EditorComponentHeader>
      <div className={styles.checkboxContainer}>
        {options.map((option) => (
          <div key={`${fieldName}-${option}`}>
            <input
              type="checkbox"
              value={option}
              checked={value.includes(option)}
              disabled={defaultValues?.includes(option)}
              onChange={handleCheckboxClick}
            />
            <span>{option}</span>
          </div>
        ))}
      </div>
    </EditorComponentHeader>
  )
}

export default CheckboxWidget
