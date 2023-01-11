import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from './EditorComponentHeader'

import styles from '../../styles/components/RadioButtonWidget.module.scss'

const RadioButtonWidget = () => {
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const options = field[fieldName].value?.param?.enum

  return (
    <EditorComponentHeader>
      <div className={styles.radioButtonContainer}>
        {options.map((option) => (
          <div className={styles.radioButtonOptionContainer} key={`${fieldName}-${option}`}>
            <input
              type="radio"
              value={option}
              checked={value === option}
              onChange={(e) => onChange({ fieldName, value: e.target.value })}
            />
            <span className={styles.radioButtonOptionText}>{option}</span>
          </div>
        ))}
      </div>
    </EditorComponentHeader>
  )
}

export default RadioButtonWidget
