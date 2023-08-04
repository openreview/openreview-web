import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import Icon from '../Icon'
import Markdown from './Markdown'
import { prettyField, classNames } from '../../lib/utils'

import styles from '../../styles/components/EditorComponentHeader.module.scss'

const EditorComponentHeader = ({
  inline = false,
  fieldNameOverwrite,
  error: propsError,
  children,
}) => {
  const editorComponentContext = useContext(EditorComponentContext)
  const { field, error: contextError } = editorComponentContext ?? {
    field: { [fieldNameOverwrite]: {} },
  }

  const error = contextError ?? propsError
  const fieldName = Object.keys(field)[0]
  const { description } = field[fieldName] ?? {}
  const { optional, deletable, scroll, hidden } = field[fieldName].value?.param ?? {}

  return (
    <div className={classNames(hidden ? 'hidden' : '', inline ? styles.inline : '')}>
      <h5 className={styles.title}>
        {fieldNameOverwrite ?? prettyField(fieldName)}
        {!optional && !deletable && <span className={styles.requiredField}>*</span>}
      </h5>
      <div className={styles.content}>
        {description && (
          <div className={styles.description}>
            {scroll ? (
              <textarea className={styles.scrollDescription} value={description} readOnly />
            ) : (
              <Markdown text={description} disableMathjaxFormula={true} />
            )}
          </div>
        )}

        {children}

        {error && (
          <div className={styles.error}>
            <Icon name="exclamation-sign" />
            <span className={styles.errorMessage}>{error.message || 'Error'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorComponentHeader
