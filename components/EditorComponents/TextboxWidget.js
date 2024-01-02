import { useContext, useEffect, useState } from 'react'
import isNil from 'lodash/isNil'
import EditorComponentContext from '../EditorComponentContext'
import useUser from '../../hooks/useUser'
import {
  convertToArray,
  convertToString,
  convertToType,
  getFieldConstValue,
} from '../../lib/webfield-utils'
import { getAutoStorageKey } from '../../lib/utils'

import styles from '../../styles/components/TextboxWidget.module.scss'

const TextboxWidget = () => {
  const { field, onChange, value, error, clearError, note, replyToNote, invitation } =
    useContext(EditorComponentContext)
  const { user } = useUser()

  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isArrayType = fieldType?.endsWith('[]')
  const dataType = isArrayType ? fieldType?.slice(0, -2) : fieldType
  const constValue = getFieldConstValue(field[fieldName])
  const defaultValue = field[fieldName]?.value?.param?.default
  const isHiddenField = field[fieldName].value?.param?.hidden
  const shouldSaveDraft = true

  let initialValue = isNil(value) ? value : value.toString()
  if (isArrayType) {
    initialValue = convertToArray(value)?.join(',')
  }
  const [displayValue, setDisplayValue] = useState(initialValue)

  const getInputValue = (rawInputValue) => {
    if (!isArrayType) {
      return rawInputValue || isHiddenField
        ? convertToType(rawInputValue.trim(), dataType)
        : undefined
    }
    if (rawInputValue.trim() === '') return undefined
    return rawInputValue.split(',').map((p) => convertToType(p.trim(), dataType))
  }

  useEffect(() => {
    if (isNil(displayValue)) return

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
    if (!isNil(value)) return

    let savedText
    if (shouldSaveDraft) {
      const keyOfSavedText = getAutoStorageKey(
        user,
        invitation?.id,
        note?.id,
        replyToNote?.id,
        fieldName
      )
      savedText = localStorage.getItem(keyOfSavedText)
    }
    let defaultStr
    if (!note) {
      defaultStr = isArrayType
        ? convertToArray(defaultValue)?.join(',')
        : convertToString(defaultValue, false)
    }

    if (savedText || defaultStr) {
      setDisplayValue(savedText ?? defaultStr)
    }
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
