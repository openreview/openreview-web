import { useContext, useEffect, useState } from 'react'
import Dropdown from '../Dropdown'
import EditorComponentContext from '../EditorComponentContext'
import { prettyField, prettyId } from '../../lib/utils'
import { convertToType } from '../../lib/webfield-utils'

import styles from '../../styles/components/DropdownWidget.module.scss'

const DropdownWidget = () => {
  const { field, onChange, value, clearError } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [allowMultiSelect, setAllowMultiSelect] = useState(isArrayType)

  const customStyles = {
    multiValueLabel: (base, state) =>
      state.data.optional
        ? base
        : { ...base, opacity: '60%', cursor: 'not-allowed', paddingRight: 6 },
    multiValueRemove: (base, state) =>
      state.data.optional ? base : { ...base, display: 'none' },
  }

  const dropdownChangeHandler = (selectedOption, actionMeta) => {
    clearError?.()
    let updatedValue
    let mandatoryValues
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
        if (actionMeta.removedValue.optional) {
          updatedValue = value.filter(
            (p) => p !== convertToType(actionMeta.removedValue.value, dataType)
          )
          onChange({
            fieldName,
            value: updatedValue.length ? updatedValue : undefined,
          })
        }
        break
      case 'clear':
        mandatoryValues = dropdownOptions.flatMap((p) => (p.optional === true ? [] : p.value))
        onChange({
          fieldName,
          value: allowMultiSelect && mandatoryValues.length ? mandatoryValues : undefined,
        })
        break
      default:
        break
    }
  }

  useEffect(() => {
    const enumValues = field[fieldName].value?.param?.enum
    const itemsValues = field[fieldName].value?.param?.items
    let options = []

    if (Array.isArray(enumValues) && enumValues.length) {
      const defaultValue = field[fieldName].value?.param?.default
      // setDropdownOptions(
      options = enumValues.map((p) =>
        typeof p === 'object'
          ? { label: p.description ?? prettyId(p.value), value: p.value, optional: true }
          : { label: p, value: p, optional: true }
      )
      // )
      setDropdownOptions(options)
      setAllowMultiSelect(isArrayType)
      if (!value && defaultValue) onChange({ fieldName, value: defaultValue })
      if (value) {
        // invitation may have been modified
        let filteredValue
        if (isArrayType) {
          filteredValue = value.filter((p) => options.find((q) => q.value === p))
        } else {
          filteredValue = options.some((p) => p.value === value) ? value : undefined
        }
        onChange({ fieldName, value: filteredValue })
      }
    }
    if (Array.isArray(itemsValues) && itemsValues.length) {
      const defaultValues = field[fieldName].value?.param?.default ?? [] // array value
      const mandatoryValues =
        itemsValues.flatMap((p) => (p.optional === false ? p.value : [])) ?? []
      // setDropdownOptions(
      options = itemsValues.map((p) => ({
        label: p.description ?? prettyId(p.value),
        value: p.value,
        optional: p.optional,
      }))
      // )
      setDropdownOptions(options)
      if (!value && (defaultValues?.length || mandatoryValues?.length)) {
        onChange({ fieldName, value: [...new Set([...defaultValues, ...mandatoryValues])] })
      }
      if (value) {
        onChange({
          fieldName,
          value: value.filter((p) => options.find((q) => q.value === p)),
        })
      }
    }
  }, [])

  if (!dropdownOptions.length) return null

  return (
    <div className={styles.dropdownContainer}>
      <Dropdown
        styles={customStyles}
        options={dropdownOptions}
        onChange={dropdownChangeHandler}
        value={
          allowMultiSelect
            ? value?.map((p) => dropdownOptions.find((q) => q.value == p)) // eslint-disable-line eqeqeq
            : dropdownOptions.filter((p) => p.value == value) // eslint-disable-line eqeqeq
        }
        isClearable={dropdownOptions.some((p) => p.optional === true)}
        isOptionDisabled={(p) => p.optional === false}
        isMulti={allowMultiSelect}
        placeholder={`Select ${prettyField(fieldName)}`}
        components={{
          DropdownIndicator: () => null,
        }}
      />
    </div>
  )
}

export default DropdownWidget
