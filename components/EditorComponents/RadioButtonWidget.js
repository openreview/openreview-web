import { useContext, useEffect, useState } from 'react'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/RadioButtonWidget.module.scss'
import { convertToType } from '../../lib/webfield-utils'

const RadioButtonWidget = () => {
  const { field, onChange, value, isWebfield, clearError } = useContext(EditorComponentContext)
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
            : { value: p, description: p }
        )
      )
      const defaultValue = field[fieldName].value?.param?.default
      if (!value && defaultValue) onChange({ fieldName, value: defaultValue })
    }
  }, [])

  if (!radioButtonOptions.length) return null

  return (
    <div className={styles.radioButtonContainer}>
      {radioButtonOptions.map((option) => (
        <div
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
        </div>
      ))}
    </div>
  )
}

export default RadioButtonWidget
