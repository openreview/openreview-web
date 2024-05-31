import { useEffect, useReducer, useState } from 'react'
import { classNames, prettyField } from '../lib/utils'
import styles from '../styles/components/NoteEditor.module.scss'
import EditorComponentContext from './EditorComponentContext'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import EditorWidget from './webfield/EditorWidget'
import Icon from './Icon'
import IconButton, { TrashButton } from './IconButton'

const EnumItemsEditor = ({ options, setOptions, fieldName }) => {
  const renderOption = (option, index) => {
    if (typeof option === 'string') {
      return <input className="form-control" type="text" value={option} />
    }
    return (
      <>
        <input className="form-control" type="text" value={option.value} />
        <input className="form-control" type="text" value={option.description} />
        <input className="form-control" type="checkbox" value={option.optional} />
      </>
    )
  }
  return (
    <div>
      <thead>
        <th>Value</th>
        {fieldName === 'items' && (
          <>
            <th>Description</th>
            <th>Optional</th>
          </>
        )}
      </thead>

      {options?.map((option, index) => (
        <div key={index} style={{ display: 'flex' }}>
          {renderOption(option)}
          <TrashButton />
        </div>
      ))}
      <IconButton name="plus" onClick={() => {}} text="Add Option" />
    </div>
  )
}

const Form = ({ fields, existingFieldsValue, onFormChange }) => {
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
        onFormChange({
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
            <EnumItemsEditor options={fieldValue} fieldName />
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
    <div className={classNames('panel', styles.noteEditor)}>
      {Object.entries(fields)
        .sort((a, b) => (a[1].order ?? 100) - (b[1].order ?? 100))
        .map(([fieldName, fieldDescription]) => renderField(fieldName, fieldDescription))}
    </div>
  )
}

export default Form
