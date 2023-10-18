import { useContext, useEffect, useState } from 'react'
import sortBy from 'lodash/sortBy'
import EditorComponentContext from '../EditorComponentContext'
import { convertToType } from '../../lib/webfield-utils'

import styles from '../../styles/components/CheckboxWidget.module.scss'

const CheckboxWidget = () => {
  const { field, onChange, value, clearError, note } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const [checkboxOptions, setCheckboxOptions] = useState([])

  const handleCheckboxClick = (e) => {
    clearError?.()
    const isChecked = e.target.checked
    const optionValue = convertToType(e.target.value, dataType)

    if (isArrayType) {
      const updatedValues = isChecked
        ? sortBy([...(value ?? []), optionValue], (p) =>
            checkboxOptions.findIndex((q) => q.value === p)
          )
        : value?.filter((p) => p !== optionValue)
      onChange({ fieldName, value: updatedValues?.length ? updatedValues : undefined })
      return
    }

    // string type
    const updatedValue = isChecked ? optionValue : undefined
    onChange({ fieldName, value: updatedValue })
  }

  useEffect(() => {
    const enumValues = field[fieldName].value?.param?.enum
    const itemsValues = field[fieldName].value?.param?.items

    let options = []
    if (Array.isArray(enumValues) && enumValues.length) {
      if (isArrayType) {
        options = enumValues.map((p) =>
          typeof p === 'object'
            ? { value: p.value, description: p.description }
            : { value: p, description: p }
        )
      } else {
        const option = enumValues[0]
        const optionValue = typeof option === 'object' ? option.value : option
        const optionDescription = typeof option === 'object' ? option.description : option
        options = [{ value: optionValue, description: optionDescription, optional: true }]
      }
      setCheckboxOptions(options)
      const defaultValue = field[fieldName].value?.param?.default

      if (!note && defaultValue) onChange({ fieldName, value: defaultValue })
      if (note && value) {
        // invitation may have been modified
        let filteredValue
        if (isArrayType) {
          filteredValue = value.filter((p) => options.find((q) => q.value === p))
        } else {
          filteredValue = value === options[0].value ? value : undefined
        }
        onChange({ fieldName, value: filteredValue })
      }

      return
    }
    if (Array.isArray(itemsValues) && itemsValues.length) {
      // no string value, only objects; has optional
      const defaultValues = field[fieldName].value?.param?.default ?? [] // array value
      const mandatoryValues =
        itemsValues.flatMap((p) => (p.optional === false ? p.value : [])) ?? []
      setCheckboxOptions(itemsValues)
      if (!note && (defaultValues?.length || mandatoryValues?.length)) {
        onChange({ fieldName, value: [...new Set([...defaultValues, ...mandatoryValues])] })
      }
      if (note && value) {
        // invitation may have been modified
        onChange({
          fieldName,
          value: value.filter((p) => itemsValues.find((q) => q.value === p)),
        })
      }
    }
  }, [])

  if (!checkboxOptions.length) return null

  return (
    <div className={styles.checkboxContainer}>
      {checkboxOptions.map((option) => (
        <label key={`${fieldName}-${option.value}`} className={styles.checkboxOptionRow}>
          <input
            type="checkbox"
            value={option.value ?? ''}
            checked={
              isArrayType
                ? // eslint-disable-next-line eqeqeq
                  value?.find((p) => p == option.value) ?? false
                : // eslint-disable-next-line eqeqeq
                  value == option.value
            }
            disabled={option.optional === false}
            onChange={handleCheckboxClick}
          />
          <span className={styles.optionDescription}>{option.description}</span>
        </label>
      ))}
    </div>
  )
}

export default CheckboxWidget
