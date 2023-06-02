import { useContext, useEffect, useState } from 'react'
import Dropdown from '../Dropdown'
import EditorComponentContext from '../EditorComponentContext'
import { prettyField } from '../../lib/utils'
import { convertToType } from '../../lib/webfield-utils'

const DropdownWidget = ({ multiple }) => {
  const { field, onChange, value, clearError } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const [dropdownOptions, setDropdownOptions] = useState([])
  const [allowMultiSelect, setAllowMultiSelect] = useState(multiple && isArrayType)

  const styles = {
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

    if (Array.isArray(enumValues) && enumValues.length) {
      const defaultValue = field[fieldName].value?.param?.default
      setDropdownOptions(
        enumValues.map((p) =>
          typeof p === 'object'
            ? { label: p.description, value: p.value, optional: true }
            : { label: p, value: p, optional: true }
        )
      )
      setAllowMultiSelect(isArrayType)
      if (!value && defaultValue) onChange({ fieldName, value: defaultValue })
    }
    if (Array.isArray(itemsValues) && itemsValues.length) {
      const defaultValues = field[fieldName].value?.param?.default ?? [] // array value
      const mandatoryValues =
        itemsValues.flatMap((p) => (p.optional === false ? p.value : [])) ?? []
      setDropdownOptions(
        itemsValues.map((p) => ({
          label: p.description,
          value: p.value,
          optional: p.optional,
        }))
      )
      if (!value && (defaultValues?.length || mandatoryValues?.length)) {
        onChange({ fieldName, value: [...new Set([...defaultValues, ...mandatoryValues])] })
      }
    }
  }, [])

  if (!dropdownOptions.length) return null

  return (
    <div className="dropdown-list">
      <Dropdown
        styles={styles}
        options={dropdownOptions}
        onChange={dropdownChangeHandler}
        value={dropdownOptions.filter(
          (p) => (allowMultiSelect ? value?.includes(p.value) : p.value == value) // eslint-disable-line eqeqeq
        )}
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
