import { useContext } from 'react'
import { prettyField } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'

import styles from '../../styles/components/EditorComponentHeader.module.scss'
import EditorComponentReaders from './EditorComponentReaders'

const EditorComponentHeader = ({ inline = false, fieldNameOverwrite, children }) => {
  const editorComponentContext = useContext(EditorComponentContext)
  const { field, isContentField } = editorComponentContext ?? {
    field: { [fieldNameOverwrite]: {} },
  }
  const fieldName = Object.keys(field)[0]
  const { description, readers } = field[fieldName] ?? {}
  const { optional, scroll, hidden } = field[fieldName].value?.param ?? {}

  return (
    <div className={`${hidden ? 'hidden' : `${styles.editorComponent}`}`}>
      <div className={`${styles.title} ${inline ? ` ${styles.inline}` : ''}`}>{`${
        optional ? '' : '* '
      }${fieldNameOverwrite ?? prettyField(fieldName)}`}</div>
      {description && (
        <div className={styles.description}>
          {scroll ? (
            <textarea className={styles.scrollDescription} value={description} readOnly />
          ) : (
            <div className="disable-tex-rendering">{description}</div>
          )}
        </div>
      )}
      {children}
      {isContentField && <EditorComponentReaders readers={readers} />}
    </div>
  )
}

export default EditorComponentHeader
