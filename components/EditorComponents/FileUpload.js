import { useContext } from 'react'
import { prettyField } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'
import Icon from '../Icon'

import styles from '../../styles/components/FileUpload.module.scss'

export const FileUploadV2 = () => {
  const { field, onChange, value } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  const required = !field[fieldName].value?.param?.optional
  const scroll = field[fieldName].value?.param?.scroll
  const hidden = field[fieldName].value?.param?.hidden

  return (
    <div className={styles.fileUpload}>
      <div className="title">{`${required ? '* ' : ''}${prettyField(fieldName)}`}</div>
      <div className="description">
        {scroll ? (
          <textarea className="scroll-description" readOnly>
            {fieldDescription}
          </textarea>
        ) : (
          <div className="disable-tex-rendering">{fieldDescription}</div>
        )}
      </div>
      <div className="content">
        <input
          className="file-input"
          type="file"
          value={value}
          onChange={(e) => onChange({ fieldName, value: e.target.value })}
        />
        <button className="btn clear-btn">
          <Icon name="remove" />
        </button>
      </div>
    </div>
  )
}
