import { useContext, useEffect, useState } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import styles from '../../styles/components/TextboxWidget.module.scss'
import { convertToType, getFieldConstValue } from '../../lib/webfield-utils'
import { getAutoStorageKey } from '../../lib/utils'
import useUser from '../../hooks/useUser'

const TextboxWidget = () => {
  const { field, onChange, value, error, clearError, note, replyToNote, invitation } =
    useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const constValue = getFieldConstValue(field[fieldName])
  const defaultValue = field[fieldName]?.value?.param?.default
  const { user } = useUser()
  const shouldSaveDraft = true

  const isCommaSeparatedArray = field[fieldName]?.value?.param?.type?.endsWith('[]')
  const [displayValue, setDisplayValue] = useState(
    isCommaSeparatedArray ? value?.join(',') : value
  )

  const getInputValue = (rawInputValue) => {
    if (!isCommaSeparatedArray)
      return rawInputValue ? convertToType(rawInputValue.trim(), dataType) : undefined
    return rawInputValue.split(',').map((p) => convertToType(p.trim(), dataType))
  }

  useEffect(() => {
    if (displayValue === null || typeof displayValue === 'undefined' || !onChange) return
    onChange({
      fieldName,
      value: getInputValue(displayValue),
      shouldSaveDraft,
    })
    clearError?.()
  }, [displayValue])

  useEffect(() => {
    if (!defaultValue) return
    if (!note) setDisplayValue(isCommaSeparatedArray ? defaultValue.join(',') : defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (!shouldSaveDraft || value) return
    const keyOfSavedText = getAutoStorageKey(
      user,
      invitation?.id,
      note?.id,
      replyToNote?.id,
      fieldName
    )
    const savedText = localStorage.getItem(keyOfSavedText)
    if (savedText) setDisplayValue(savedText)
  }, [])

  if (constValue)
    return (
      <div className={styles.textboxContainer}>
        <input
          className={`form-control ${styles.textboxInput}`}
          value={constValue ?? ''}
          readOnly
        />
      </div>
    )

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
