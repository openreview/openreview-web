import { useContext } from 'react'
import { prettyField } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/EditorComponentHeader.module.scss'
import Icon from '../Icon'
import Markdown from './Markdown'

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
    <div
      className={`${hidden ? 'hidden' : `${styles.editorComponent}`} ${
        inline ? ` ${styles.inline}` : ''
      }`}
    >
      <div className={styles.title}>
        {`${fieldNameOverwrite ?? prettyField(fieldName)} `}
        <span className={styles.requiredField}>{optional || deletable ? '' : '* '}</span>{' '}
      </div>
      <div className={styles.content}>
        {error && (
          <div className={styles.error}>
            <Icon name="exclamation-sign" />
            <span className={styles.errorMessage}>{error.message}</span>
          </div>
        )}
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
      </div>
    </div>
  )
}

export default EditorComponentHeader
