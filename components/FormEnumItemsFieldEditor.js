import { useEffect, useReducer, useState } from 'react'
import { nanoid } from 'nanoid'
import styles from '../styles/components/Form.module.scss'
import Icon from './Icon'
import IconButton from './IconButton'
import { convertToType } from '../lib/webfield-utils'

const FormEnumItemsFieldEditor = ({ options, setOptions, fieldName, formData }) => {
  const [optionType, setOptionType] = useState(null)
  const [localOptions, setLocalOptions] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'INIT':
          return action.options
        case 'ADD':
          if (optionType === 'string')
            return [
              ...state,
              {
                value: '',
                key: nanoid(),
              },
            ]
          return [
            ...state,
            {
              value: '',
              description: '',
              optional: false,
              key: nanoid(),
            },
          ]
        case 'UPDATEVALUE':
          return state.map((option) => {
            if (option.key === action.key) {
              return { ...option, value: action.value }
            }
            return option
          })
        case 'UPDATEDESCRIPTION':
          return state.map((option) => {
            if (option.key === action.key) {
              return { ...option, description: action.value }
            }
            return option
          })
        case 'UPDATDOPTIONAL':
          return state.map((option) => {
            if (option.key === action.key) {
              return { ...option, optional: action.value }
            }
            return option
          })
        case 'DELETE':
          return state.filter((option) => option.key !== action.key)
        default:
          return state
      }
    },
    options
      ? options.map((option) => {
          if (typeof option === 'string') {
            if (!optionType) setOptionType('string')
            return { value: option, key: nanoid() }
          }
          if (fieldName === 'enum') {
            if (!optionType) setOptionType('enum')
            return { ...option, key: nanoid() }
          }
          if (!optionType) setOptionType('items')
          return { ...option, key: nanoid() }
        })
      : []
  )

  useEffect(() => {
    let updatedOptions = null

    if (optionType === 'enum' || optionType === 'string') {
      updatedOptions = localOptions.map((option) => {
        const { key, optional, ...rest } = option
        return rest
      })
    }
    if (optionType === 'items') {
      updatedOptions = localOptions.map((option) => {
        const { key, ...rest } = option
        return rest
      })
    }
    if (updatedOptions) {
      setOptions({
        fieldName,
        value:
          optionType === 'string'
            ? updatedOptions.map((p) => convertToType(p.value, formData.dataType))
            : updatedOptions.map((p) => ({
                ...p,
                value: convertToType(p.value, formData.dataType),
              })),
      })
    } else {
      // new field or type changed field
      setOptions({ fieldName, value: [] })
      setOptionType(formData.dataType?.endsWith('[]') ? 'items' : 'enum')
    }
  }, [localOptions])

  const renderOption = (option) => (
    <>
      <div className={styles.enumValue}>
        <input
          className="form-control"
          type="text"
          value={option.value ?? ''}
          onChange={(e) => {
            setLocalOptions({ type: 'UPDATEVALUE', value: e.target.value, key: option.key })
          }}
          placeholder="the value of the option when it is selected"
        />
      </div>
      {(optionType === 'enum' || optionType === 'items') && (
        <div className={styles.enumDescription}>
          <input
            className="form-control"
            type="text"
            value={option.description ?? ''}
            onChange={(e) => {
              setLocalOptions({
                type: 'UPDATEDESCRIPTION',
                value: e.target.value,
                key: option.key,
              })
            }}
            placeholder="the text to display in form"
          />
        </div>
      )}
      {optionType === 'items' && (
        <div className={styles.enumOptional}>
          <input
            type="checkbox"
            checked={option.optional}
            onChange={(e) => {
              setLocalOptions({
                type: 'UPDATDOPTIONAL',
                value: e.target.checked,
                key: option.key,
              })
            }}
          />
        </div>
      )}
    </>
  )

  return (
    <div className={styles.enumContainer}>
      <div className={styles.enumHeaderRow}>
        <div className={styles.valueHeader}>Value</div>
        {(optionType === 'enum' || optionType === 'items') && (
          <div className={styles.descriptionHeader}>Description</div>
        )}
        {fieldName === 'items' && <div className={styles.optionalHeader}>Optional</div>}
      </div>

      {localOptions?.map((option, index) => (
        <div key={index} className={styles.enumRow}>
          {renderOption(option)}
          <div className={styles.enumDeleteBtn}>
            <div
              role="button"
              onClick={() => setLocalOptions({ type: 'DELETE', key: option.key })}
            >
              <Icon name="minus-sign" tooltip="remove option" />
            </div>
          </div>
        </div>
      ))}
      <IconButton
        name="plus"
        extraClasses={styles.addOptionBtn}
        onClick={() => setLocalOptions({ type: 'ADD' })}
        text="Add Option"
      />
    </div>
  )
}

export default FormEnumItemsFieldEditor
