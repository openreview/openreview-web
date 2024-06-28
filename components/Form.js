import { useEffect, useReducer, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { debounce } from 'lodash'
import { classNames, prettyField } from '../lib/utils'
import styles from '../styles/components/Form.module.scss'
import EditorComponentContext from './EditorComponentContext'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import EditorWidget from './webfield/EditorWidget'
import Icon from './Icon'
import IconButton, { TrashButton } from './IconButton'

const EnumItemsEditor = ({ options, setOptions, fieldName }) => {
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
    if (optionType === 'string') {
      updatedOptions = localOptions.map((option) => option.value)
    } else if (optionType === 'enum' || optionType === 'items') {
      updatedOptions = localOptions.map((option) => {
        const { key, ...rest } = option
        return rest
      })
    }
    setOptions({ fieldName, value: updatedOptions })
  }, [localOptions])

  const renderOption = (option, index) => (
    <>
      <div className={styles.enumValue}>
        <input
          className="form-control"
          type="text"
          value={option.value}
          onChange={(e) => {
            setLocalOptions({ type: 'UPDATEVALUE', value: e.target.value, key: option.key })
          }}
        />
      </div>
      <div className={styles.enumDescription}>
        {(optionType === 'enum' || optionType === 'items') && (
          <input
            className="form-control"
            type="text"
            value={option.description}
            onChange={(e) => {
              setLocalOptions({
                type: 'UPDATEDESCRIPTION',
                value: e.target.value,
                key: option.key,
              })
            }}
          />
        )}
      </div>
      <div className={styles.enumOptional}>
        {optionType === 'items' && (
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
        )}
      </div>
    </>
  )

  return (
    <div className={styles.enumContainer}>
      <div className={styles.enumHeaderRow}>
        <div className={styles.valueHeader}>Value</div>
        {fieldName === 'items' && (
          <>
            <div className={styles.descriptionHeader}>Description</div>
            <div className={styles.optionalHeader}>Optional</div>
          </>
        )}
      </div>

      {localOptions?.map((option, index) => (
        <div key={index} className={styles.enumRow}>
          {renderOption(option)}
          <div className={styles.enumDeleteBtn}>
            <div
              role="button"
              onClick={() => setLocalOptions({ type: 'DELETE', key: option.key })}
            >
              <Icon name="minus-sign" tooltip="remove relation" />
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

const Form = ({ fields, existingFieldsValue, onFormChange }) => {
  const debouncedOnFormChange = useRef(debounce(onFormChange, 200)).current
  const [errors, setErrors] = useState([])
  const formDataReducer = (state, action) => {
    switch (action.type) {
      case 'INIT':
        return Object.keys(fields).reduce((prev, curr) => {
          // eslint-disable-next-line no-param-reassign
          prev[curr] = fields[curr]?.getValue?.(existingFieldsValue)
          return prev
        }, {})
      default:
        debouncedOnFormChange({
          ...state,
          [action.fieldName]: action.value,
        })

        return state
    }
  }
  const [formData, setFormData] = useReducer(formDataReducer, {})

  useEffect(() => {
    setFormData({ type: 'INIT' })
  }, [existingFieldsValue])

  const renderField = (fieldName, fieldDescription) => {
    const shouldBeShown = fieldDescription?.shouldBeShown?.(formData)
    if (!shouldBeShown) return null

    const error = errors.find((e) => e.fieldName === fieldName)

    const fieldValue = formData[fieldName]
    if (fieldName === 'enum' || fieldName === 'items')
      return (
        <div key={fieldName} className={styles.fieldContainer}>
          <EditorComponentHeader fieldNameOverwrite={prettyField(fieldName)}>
            <EnumItemsEditor
              options={fieldValue}
              fieldName={fieldName}
              setOptions={setFormData}
            />
          </EditorComponentHeader>

          {fieldDescription.readers && (
            <EditorComponentContext.Provider
              value={{
                field: { [fieldName]: fieldDescription.readers },
              }}
            >
              <div className={styles.fieldReaders}>
                <Icon name="eye-open" />
                <span>Visible only to:</span> <EditorWidget />
              </div>
            </EditorComponentContext.Provider>
          )}
        </div>
      )

    return (
      <div key={fieldName} className={styles.fieldContainer}>
        <EditorComponentContext.Provider
          value={{
            field: { [fieldName]: fieldDescription },
            onChange: setFormData,
            value: fieldValue,
            isWebfield: false,
            error,
            setErrors,
            clearError: () => {
              setErrors((existingErrors) =>
                existingErrors.filter((p) => p.fieldName !== fieldName)
              )
            },
          }}
        >
          <EditorComponentHeader>
            <EditorWidget />
          </EditorComponentHeader>
        </EditorComponentContext.Provider>

        {fieldDescription.readers && (
          <EditorComponentContext.Provider
            value={{
              field: { [fieldName]: fieldDescription.readers },
            }}
          >
            <div className={styles.fieldReaders}>
              <Icon name="eye-open" />
              <span>Visible only to:</span> <EditorWidget />
            </div>
          </EditorComponentContext.Provider>
        )}
      </div>
    )
  }
  return (
    <div className={classNames('panel', styles.formContainer)}>
      {Object.entries(fields)
        .sort((a, b) => (a[1].order ?? 100) - (b[1].order ?? 100))
        .map(([fieldName, fieldDescription]) => renderField(fieldName, fieldDescription))}
    </div>
  )
}

export default Form
