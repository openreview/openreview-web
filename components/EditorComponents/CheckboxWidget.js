import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from './EditorComponentHeader'

import styles from '../../styles/components/CheckboxWidget.module.scss'

const CheckboxWidget = () => {
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const options = field[fieldName].value?.param?.enum
  if (!Array.isArray(options)) return null
  return (
    <EditorComponentHeader>
      <div className={styles.checkboxContainer}>
        {options.map((option) => (
          <div key={`${fieldName}-${option}`}>
            <input
              type="checkbox"
              value={option}
              checked={value === option}
              onChange={(e) => onChange({ fieldName, value: e.target.value })}
            />
            <span>{option}</span>
          </div>
        ))}
      </div>
    </EditorComponentHeader>
  )
}

export default CheckboxWidget
