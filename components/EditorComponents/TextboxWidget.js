import { useContext, useEffect, useState } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import styles from '../../styles/components/TextboxWidget.module.scss'
import { convertToType, getFieldConstValue } from '../../lib/webfield-utils'
import { getAutoStorageKey } from '../../lib/utils'
import useUser from '../../hooks/useUser'

const TextboxWidget = () => {
  const { field, onChange, value, error, clearError, note, replyToNote, invitation } =
    useContext(EditorComponentContext)
  const { user } = useUser()
  const [displayValue, setDisplayValue] = useState('')

  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const constValue = getFieldConstValue(field[fieldName])
  const defaultValue = field[fieldName]?.value?.param?.default
  const isHiddenField = field[fieldName].value?.param?.hidden
  const shouldSaveDraft = true

  const getInputValue = (rawInputValue) => {
    if (!isArrayType) {
      return rawInputValue || isHiddenField
        ? convertToType(rawInputValue.trim(), dataType)
        : undefined
    }
    return rawInputValue.split(',').map((p) => convertToType(p.trim(), dataType))
  }

  useEffect(() => {
    if (displayValue === null || typeof displayValue === 'undefined') return

    if (typeof onChange === 'function') {
      onChange({
        fieldName,
        value: getInputValue(displayValue),
        shouldSaveDraft,
      })
    }
    if (typeof clearError === 'function') {
      clearError()
    }
  }, [displayValue])

  useEffect(() => {
    const valueStr = isArrayType ? value?.join(',') : value
    const defaultStr = isArrayType ? defaultValue?.join(',') : defaultValue

    let savedText
    if (shouldSaveDraft && !value) {
      const keyOfSavedText = getAutoStorageKey(
        user,
        invitation?.id,
        note?.id,
        replyToNote?.id,
        fieldName
      )
      savedText = localStorage.getItem(keyOfSavedText)
    }
    setDisplayValue(valueStr ?? savedText ?? defaultStr)
  }, [])

  if (constValue) {
    return (
      <div className={styles.textboxContainer}>
        <input
          className={`form-control ${styles.textboxInput}`}
          value={constValue ?? ''}
          readOnly
        />
      </div>
    )
  }

  return (
    <div className={styles.textboxContainer}>
      <input
        className={`form-control ${styles.textboxInput} ${error ? styles.invalidValue : ''}`}
        value={displayValue ?? ''}
        onChange={(e) => setDisplayValue(e.target.value)}
      />
    </div>
  )
}

export default TextboxWidget
