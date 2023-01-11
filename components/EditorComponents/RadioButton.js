import { useContext } from 'react'
import { prettyField } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/RadioButton.module.scss'

export const RadioButton = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  // eslint-disable-next-line prefer-destructuring
  const required = field[fieldName].required
  const options = field[fieldName]['value-radio']

  return (
    <div className="radio-button">
      <div className="field-name-row">
        {required && <span className="required_field">*</span>}
        <span className="line_heading">{prettyField(fieldName)}</span>
      </div>
      <div className="hint disable-tex-rendering">{fieldDescription}</div>
      <div className="note_content_value value-radio-container">
        {options.map((option) => (
          <div className="radio" key={`${fieldName}-${option}`}>
            <label>
              <input
                type="radio"
                name={fieldName}
                id={`${fieldName}-${option}`}
                value={option}
                checked={value === option}
                onChange={(e) => onChange({ fieldName, value: e.target.value })}
              />
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export const RadioButtonV2 = () => {
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  const required = !field[fieldName].value?.param?.optional
  const options = field[fieldName].value?.param?.enum

  return (
    <div className={`${isWebfield ? 'radio-button' : `${styles.RadioButton}`}`}>
      <div className="title">
        {required && <span className="required_field">*</span>}
        <span className="line_heading">{prettyField(fieldName)}</span>
      </div>
      <div className="description">
        {scroll ? (
          <textarea className="form-control scroll-box" readOnly>
            {fieldDescription}
          </textarea>
        ) : (
          <div className="hint disable-tex-rendering">{fieldDescription}</div>
        )}
      </div>
      <div className="note_content_value value-radio-container">
        {options.map((option) => (
          <div className="radio" key={`${fieldName}-${option}`}>
            <label>
              <input
                type="radio"
                name={fieldName}
                id={`${fieldName}-${option}`}
                value={option}
                checked={value === option}
                onChange={(e) => onChange({ fieldName, value: e.target.value })}
              />
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
