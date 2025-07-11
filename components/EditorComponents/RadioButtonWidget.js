import { useContext, useEffect, useState } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import { convertToType } from '../../lib/webfield-utils'

import styles from '../../styles/components/RadioButtonWidget.module.scss'

const RadioButtonWidget = () => {
  const { field, onChange, value, clearError, note } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const dataType = field[fieldName]?.value?.param?.type
  const [radioButtonOptions, setRadioButtonOptions] = useState([])

  useEffect(() => {
    const enumValues = field[fieldName].value?.param?.enum
    if (Array.isArray(enumValues) && enumValues.length) {
      setRadioButtonOptions(
        enumValues.map((p) =>
          typeof p === 'object'
            ? { value: p.value, description: p.description }
            : { value: p, description: p.toString() }
        )
      )
      const defaultValue = field[fieldName].value?.param?.default
      if (!note && defaultValue) onChange({ fieldName, value: defaultValue })
    }
  }, [])

  if (!radioButtonOptions.length) return null

  return (
    <div className={styles.radioButtonContainer}>
      {radioButtonOptions.map((option) => (
        <label
          className={styles.radioButtonOptionContainer}
          key={`${fieldName}-${option.value}`}
        >
          <input
            type="radio"
            value={option.value}
            checked={value == option.value} // eslint-disable-line eqeqeq
            onChange={(e) => {
              onChange({ fieldName, value: convertToType(e.target.value, dataType) })
              clearError?.()
            }}
          />
          <span className={styles.radioButtonOptionText}>{option.description}</span>
        </label>
      ))}
    </div>
  )
}

export default RadioButtonWidget
