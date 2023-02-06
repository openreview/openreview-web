import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/TextboxWidget.module.scss'
import EditorComponentHeader from './EditorComponentHeader'
import { getFieldConstValue } from '../../lib/webfield-utils'

const TextboxWidget = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const constValue = getFieldConstValue(field[fieldName])

  if (constValue)
    return (
      <EditorComponentHeader>
        <div className={styles.textboxContainer}>
          <input
            className={`form-control ${styles.textboxInput}`}
            value={constValue ?? ''}
            readOnly
          />
        </div>
      </EditorComponentHeader>
    )

  return (
    <EditorComponentHeader>
      <div className={styles.textboxContainer}>
        <input
          className={`form-control ${styles.textboxInput}`}
          value={value ?? ''}
          onChange={(e) => onChange({ fieldName, value: e.target.value })}
        />
      </div>
    </EditorComponentHeader>
  )
}

export default TextboxWidget
