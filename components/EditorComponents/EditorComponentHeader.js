import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import Icon from '../Icon'
import Markdown from './Markdown'
import { prettyField, classNames } from '../../lib/utils'

import styles from '../../styles/components/EditorComponentHeader.module.scss'

const defaultAuthorFieldDescription =
  'Search author profile by first, middle and last name or email address. All authors must have an OpenReview profile prior to submitting a paper.'

const defaultAuthorFieldDeascriptionV2 =
  'Search author profile by first, middle and last name or email address. If the profile is not found, you can add the author by completing first, middle, and last names as well as author email address.'

const EditorComponentHeader = ({
  inline = false,
  fieldNameOverwrite,
  error: propsError,
  className,
  children,
}) => {
  const editorComponentContext = useContext(EditorComponentContext)
  const { field, error: contextError } = editorComponentContext ?? {
    field: { [fieldNameOverwrite]: {} },
  }

  const error = contextError ?? propsError
  const fieldName = Object.keys(field)[0]
  let { description } = field[fieldName] ?? {}
  if (description === defaultAuthorFieldDescription)
    description =
      'Search author profile by name or profile ID. All authors must have an OpenReview profile prior to submitting a paper.'
  if (description === defaultAuthorFieldDeascriptionV2)
    description =
      'Search author profile by name or profile ID. If the profile is not found, you can add the author by completing author information including name and email address.'
  const { optional, deletable, scroll, hidden } = field[fieldName].value?.param ?? {}

  return (
    <div
      className={classNames(hidden ? 'hidden' : '', inline ? styles.inline : '', className)}
    >
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
