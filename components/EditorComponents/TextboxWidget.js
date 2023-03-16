import { useContext, useEffect, useState } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import styles from '../../styles/components/TextboxWidget.module.scss'
import { getFieldConstValue } from '../../lib/webfield-utils'

const TextboxWidget = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const constValue = getFieldConstValue(field[fieldName])

  const isCommaSeparatedArray = field[fieldName]?.value?.param?.type?.endsWith('[]')
  const [displayValue, setDisplayValue] = useState(
    isCommaSeparatedArray ? value?.join(',') : value
  )

  const getInputValue = (rawInputValue) => {
    if (!isCommaSeparatedArray) return rawInputValue.trim()
    return rawInputValue.split(',').map((p) => p.trim())
  }

  useEffect(() => {
    if (!displayValue || !onChange) return
    onChange({
      fieldName,
      value: getInputValue(displayValue),
    })
  }, [displayValue])

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
        className={`form-control ${styles.textboxInput}`}
        value={displayValue ?? ''}
        onChange={(e) => setDisplayValue(e.target.value)}
      />
    </div>
  )
}

export default TextboxWidget
