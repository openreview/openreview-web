import { isEqual } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { prettyField, prettyId } from '../../lib/utils'
import { convertToType } from '../../lib/webfield-utils'
import Dropdown from '../Dropdown'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/DropdownWidget.module.scss'

const DropdownWidget = () => {
  const { field, onChange, value, clearError, noteEditorValue } =
    useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  // An enum entry like `${3/authors/value/*/username}` or `${3/decision_options/value}` is a
  // reference to a sibling field in the same edit: the allowed values are derived at edit time
  // from that field's current value, so the API can validate this field is a subset of it.
  const enumReference = field[fieldName]?.value?.param?.enum?.[0]
  const referenceSegments =
    typeof enumReference === 'string' && /^\$\{\d+\/.+\}$/.test(enumReference)
      ? enumReference.slice(2, -1).split('/') // e.g. ['3', 'authors', 'value', '*', 'username']
      : null
  const referencedFieldName = referenceSegments?.[1]
  const referencedItemProp =
    referenceSegments && referenceSegments.indexOf('*') !== -1
      ? referenceSegments[referenceSegments.indexOf('*') + 1]
      : null
  const isReferenceDerivedField = Boolean(referencedFieldName)
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [allowMultiSelect, setAllowMultiSelect] = useState(isArrayType)

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
        updatedValue = value.filter((p) => {
          if (typeof p === 'object') return !isEqual(p, actionMeta.removedValue.value)
          return p !== convertToType(actionMeta.removedValue.value, dataType)
        })
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
    if (isReferenceDerivedField) return
    const enumValues = field[fieldName].value?.param?.enum
    const itemsValues = field[fieldName].value?.param?.items
    let options = []

    if (Array.isArray(enumValues) && enumValues.length) {
      const defaultValue = field[fieldName].value?.param?.default
      options = enumValues.map((p) =>
        typeof p === 'object'
          ? { label: p.description ?? prettyId(p.value), value: p.value }
          : { label: p, value: p }
      )
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
      options = itemsValues.map((p) => ({
        label: p.description ?? prettyId(p.value),
        value: p.value,
      }))
      setDropdownOptions(options)
      if (!value && defaultValues?.length) {
        onChange({ fieldName, value: [...new Set(defaultValues)] })
      }
      if (value) {
        onChange({
          fieldName,
          value: value.filter((p) =>
            options.find((q) => (typeof p === 'object' ? isEqual(q.value, p) : q.value === p))
          ),
        })
      }
    }
  }, [])

  const referencedFieldValue = noteEditorValue?.[referencedFieldName]
  useEffect(() => {
    if (!isReferenceDerivedField) return
    const siblingValues = Array.isArray(referencedFieldValue) ? referencedFieldValue : []
    const referenceOptions = siblingValues
      .map((p) =>
        referencedItemProp
          ? { label: p?.fullname ?? p?.[referencedItemProp] ?? p, value: p?.[referencedItemProp] }
          : { label: p, value: p }
      )
      .filter((p) => p.value != null && p.value !== '')
    setDropdownOptions(referenceOptions)

    // drop any selected value whose source option has been removed from the referenced field
    if (Array.isArray(value)) {
      const optionValues = referenceOptions.map((p) => p.value)
      const filteredValue = value.filter((p) => optionValues.includes(p))
      if (filteredValue.length !== value.length) {
        onChange({ fieldName, value: filteredValue.length ? filteredValue : undefined })
      }
    }
  }, [referencedFieldValue])

  if (!dropdownOptions.length) return null

  return (
    <div className={styles.dropdownContainer}>
      <Dropdown
        options={dropdownOptions}
        onChange={dropdownChangeHandler}
        value={
          allowMultiSelect
            ? value
                ?.map((p) =>
                  dropdownOptions.find((q) =>
                    typeof p === 'object' ? isEqual(q.value, p) : q.value == p
                  )
                )
                .filter(Boolean)
            : dropdownOptions.filter((p) => p.value == value)
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

export default DropdownWidget
