import { useContext, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import EditorComponentContext from '../EditorComponentContext'
import styles from '../../styles/components/CodeEditorWidget.module.scss'
import LoadingSpinner from '../LoadingSpinner'

const CodeEditor = dynamic(() => import('../CodeEditor'), {
  loading: () => <LoadingSpinner inline />,
})

const CodeEditorWidget = () => {
  const { field, onChange, value, error, clearError, setErrors, note } =
    useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldType = field[fieldName]?.value?.param?.type
  const isJsonType = fieldType === 'json'
  const defaultValue = field[fieldName]?.value?.param?.default

  const [formattedCode, setFormattedCode] = useState(
    isJsonType ? JSON.stringify(value, undefined, 2) : value
  )

  const onCodeChange = (updatedCode) => {
    clearError?.()
    if (!updatedCode) {
      onChange({ fieldName, value: undefined })
      return
    }

    try {
      const parsedCode = isJsonType ? JSON.parse(updatedCode) : updatedCode
      setFormattedCode(updatedCode)
      onChange({ fieldName, value: parsedCode })
    } catch (parseError) {
      setErrors([
        {
          fieldName,
          message: `Reply is not valid JSON: ${parseError.message}. Make sure all quotes and brackets match.`,
        },
      ])
    }
  }

  useEffect(() => {
    if (!defaultValue) return
    if (!note) {
      onCodeChange(isJsonType ? JSON.stringify(defaultValue, undefined, 2) : defaultValue)
    }
  }, [])

  return (
    <div className={`${styles.codeEditorContainer} ${error ? styles.invalidValue : ''}`}>
      <CodeEditor code={formattedCode} onChange={onCodeChange} isJson={isJsonType} />
    </div>
  )
}

export default CodeEditorWidget
