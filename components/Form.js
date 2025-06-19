import { useEffect, useReducer, useRef, useState } from 'react'
import { debounce } from 'lodash'
import { classNames, prettyField } from '../lib/utils'
import styles from '../styles/components/Form.module.scss'
import EditorComponentContext from './EditorComponentContext'
import EditorComponentHeader from './EditorComponents/EditorComponentHeader'
import EditorWidget from './webfield/EditorWidget'
import Icon from './Icon'
import FormEnumItemsFieldEditor from './FormEnumItemsFieldEditor'

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
        if (action.fieldName === 'dataType') {
          debouncedOnFormChange({
            name: state.name,
            order: state.order,
            description: state.description,
            [action.fieldName]: action.value,
          })
        } else {
          debouncedOnFormChange({
            ...state,
            [action.fieldName]: action.value,
          })
        }

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
          <EditorComponentContext.Provider // only to show description in header
            value={{
              field: { [fieldName]: fieldDescription },
            }}
          >
            <EditorComponentHeader fieldNameOverwrite={prettyField(fieldName)}>
              <FormEnumItemsFieldEditor
                options={fieldValue}
                fieldName={fieldName}
                formData={formData}
                setOptions={setFormData}
              />
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
