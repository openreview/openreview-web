import { useContext, useEffect, useState } from 'react'
import sortBy from 'lodash/sortBy'
import EditorComponentContext from '../EditorComponentContext'
import { convertToType } from '../../lib/webfield-utils'

import styles from '../../styles/components/CheckboxWidget.module.scss'

const CheckboxWidget = ({
  field: propsField,
  onChange: propsOnChange,
  value: propsValue,
  clearError: propsClearError,
  options: propsOptions,
  isEditor = true,
  isArrayType: propsIsArrayType,
  dataType: propsDataType,
}) => {
  const editorComponentContext = useContext(EditorComponentContext) ?? {}
  const { field, onChange, value, clearError, note } = isEditor
    ? editorComponentContext
    : {
        field: propsField,
        onChange: propsOnChange,
        value: propsValue,
        clearError: propsClearError,
      }
  const fieldName = Object.keys(field ?? {})[0]
  const fieldType = field?.[fieldName]?.value?.param?.type
  const isArrayType = propsIsArrayType ?? fieldType?.endsWith('[]')
  let dataType
  const [checkboxOptions, setCheckboxOptions] = useState([])

  if (isEditor) {
    dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  } else {
    dataType = propsDataType ?? 'string'
  }

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
    if (!isEditor) {
      setCheckboxOptions(propsOptions)
      return
    }
    const enumValues = field?.[fieldName].value?.param?.enum
    const itemsValues = field?.[fieldName].value?.param?.items

    let options = []
    if (Array.isArray(enumValues) && enumValues.length) {
      if (isArrayType) {
        options = enumValues.map((p) =>
          typeof p === 'object' ? { value: p.value, label: p.label } : { value: p, label: p }
        )
      } else {
        const option = enumValues[0]
        const optionValue = typeof option === 'object' ? option.value : option
        const optionlabel = typeof option === 'object' ? option.description : option
        options = [{ value: optionValue, label: optionlabel, optional: true }]
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
      setCheckboxOptions(
        itemsValues.map((p) => ({
          value: p.value,
          label: p.description,
          optional: p.optional,
        }))
      )
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
        <div className="checkbox" key={`${fieldName}-${option.value}`}>
          <label>
            <input
              type="checkbox"
              value={option.value ?? ''}
              checked={
                isArrayType
                  ? (value?.find((p) => p == option.value) ?? false)
                  : value == option.value
              }
              disabled={option.optional === false}
              onChange={handleCheckboxClick}
            />
            {typeof option.label === 'function' ? <option.label /> : option.label}
          </label>
        </div>
      ))}
    </div>
  )
}

export default CheckboxWidget
