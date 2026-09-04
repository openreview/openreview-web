import { useContext, useEffect, useState } from 'react'
import { prettyField } from '../../lib/utils'
import { convertToType } from '../../lib/webfield-utils'
import Dropdown from '../Dropdown'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/DropdownWidget.module.scss'

const DropdownDerivedOptionsWidget = () => {
  const { field, onChange, value, clearError, editorValue } =
    useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const allowMultiSelect = fieldType?.endsWith('[]')
  const dataType = allowMultiSelect ? fieldType?.slice(0, -2) : fieldType
  const sourceFieldName = field[fieldName]?.value?.param?.enum?.[0]?.split('/')?.[1]
  const sourceValue = editorValue?.[sourceFieldName]
  const [dropdownOptions, setDropdownOptions] = useState([])

  const dropdownChangeHandler = (selectedOption, actionMeta) => {
    clearError?.()
    let updatedValue
    switch (actionMeta.action) {
      case 'select-option':
        updatedValue = allowMultiSelect
          ? (value ?? []).concat(convertToType(actionMeta.option.value, dataType))
          : convertToType(selectedOption.value, dataType)
        onChange({
          fieldName,
          value: updatedValue,
        })
        break
      case 'remove-value': // only applicable for multiselect
        updatedValue = value.filter(
          (p) => p !== convertToType(actionMeta.removedValue.value, dataType)
        )
        onChange({
          fieldName,
          value: updatedValue.length ? updatedValue : undefined,
        })
        break
      case 'clear':
        onChange({
          fieldName,
          value: undefined,
        })
        break
      default:
        break
    }
  }

  useEffect(() => {
    const sourceValues = Array.isArray(sourceValue) ? sourceValue : []
    const options =
      sourceFieldName === 'authors'
        ? sourceValues.map((p) => ({ label: p.fullname, value: p.username }))
        : sourceValues.map((p) => ({ label: p, value: p }))
    setDropdownOptions(options)

    // drop any selected value whose source option has been removed from the form
    const optionValues = options.map((p) => p.value)
    if (Array.isArray(value)) {
      const filteredValue = value.filter((p) => optionValues.includes(p))
      if (filteredValue.length !== value.length) {
        onChange({ fieldName, value: filteredValue.length ? filteredValue : undefined })
      }
    } else if (value !== undefined && !optionValues.includes(value)) {
      onChange({ fieldName, value: undefined })
    }
  }, [sourceValue])

  if (!dropdownOptions.length) return null

  return (
    <div className={styles.dropdownContainer}>
      <Dropdown
        options={dropdownOptions}
        onChange={dropdownChangeHandler}
        value={
          allowMultiSelect
            ? value?.map((p) => dropdownOptions.find((q) => q.value === p)).filter(Boolean)
            : dropdownOptions.filter((p) => p.value === value)
        }
        isClearable={true}
        isMulti={allowMultiSelect}
        placeholder={`Select ${prettyField(fieldName)}`}
        components={{
          DropdownIndicator: () => null,
        }}
      />
    </div>
  )
}

export default DropdownDerivedOptionsWidget
