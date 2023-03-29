import { useContext, useEffect } from 'react'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/CheckboxWidget.module.scss'

const CheckboxWidget = () => {
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const options = field[fieldName].value?.param?.enum
  const defaultValue = field[fieldName].value?.param?.default
  const isArrayType = field[fieldName]?.value?.param?.type?.endsWith('[]')

  const handleCheckboxClick = (e) => {
    const optionValue = e.target.value
    if (!isArrayType) {
      onChange({ fieldName, value: value ? null : optionValue })
      return
    }
    if (value?.includes(optionValue)) {
      onChange({ fieldName, value: value.filter((p) => p !== optionValue) })
    } else {
      onChange({ fieldName, value: [...(value ?? []), optionValue] })
    }
  }

  useEffect(() => {
    if (!defaultValue) return
    onChange({ fieldName, value: defaultValue })
  }, [defaultValue])

  if (!Array.isArray(options)) return null

  return (
    <div className={styles.checkboxContainer}>
      {options.map((option, index) => {
        if (!isArrayType && index > 0) return null
        return (
          <div key={`${fieldName}-${option}`} className={styles.checkboxOptionRow}>
            <input
              type="checkbox"
              value={option}
              checked={value ? value.includes(option) : false}
              onChange={handleCheckboxClick}
            />
            <span className={styles.optionText}>{option}</span>
          </div>
        )
      })}
    </div>
  )
}

export default CheckboxWidget
