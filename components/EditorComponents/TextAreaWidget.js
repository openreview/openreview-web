import { useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import EditorComponentContext from '../EditorComponentContext'
import MarkdownPreviewTab from '../MarkdownPreviewTab'

import styles from '../../styles/components/TextareaWidget.module.scss'
import { getAutoStorageKey } from '../../lib/utils'
import WebFieldContext from '../WebFieldContext'

const CharCounter = ({ minLength = 0, maxLength = 0, contentLength }) => {
  const getClassName = () => {
    const charsRemaining = maxLength - contentLength
    let className = ''
    if (charsRemaining < 1) {
      className = styles.danger
    } else if (charsRemaining < 150) {
      className = styles.warning
    }
    return `${styles.charCounter} hint ${className}`
  }

  return (
    <div className={getClassName()}>
      {minLength - contentLength > 0 ? (
        <>
          Additional characters required:{' '}
          <span className="min-count">{minLength - contentLength}</span>
        </>
      ) : (
        maxLength && (
          <>
            Characters remaining:{' '}
            <span className="max-count">{maxLength - contentLength}</span>
          </>
        )
      )}
    </div>
  )
}

const MathJaxWarning = ({ content }) => {
  const showMathJaxWarning = content?.match(/\$[\s\S]*\\\\[\s\S]*\$/)
  if (!showMathJaxWarning) return null
  return (
    <div className={`hint ${styles.mathJaxWarning}`}>
      <strong>
        IMPORTANT: All uses of &quot;\\&quot; in LaTeX formulas should be replaced with
        &quot;\\\\&quot;
      </strong>
      <br />
      <span>
        Learn more about adding LaTeX formulas to Markdown content here:{' '}
        <a
          href="https://docs.openreview.net/reference/openreview-tex/openreview-tex-support"
          target="_blank"
          rel="noreferrer"
        >
          FAQ
        </a>
      </span>
    </div>
  )
}

const TextAreaWidget = () => {
  const webFieldContext = useContext(WebFieldContext)
  const editorComponentContext = useContext(EditorComponentContext)
  const { field, onChange, value, isWebfield } = editorComponentContext
  const { note, entity } = isWebfield ? webFieldContext : editorComponentContext
  let { invitation } = isWebfield ? webFieldContext : editorComponentContext
  if (!invitation) invitation = entity
  const { user } = useUser()
  const fieldName = Object.keys(field)[0]
  const enableMarkdown = field[fieldName].value?.param?.markdown

  const [showCharCounter, setShowCharCounter] = useState(false)
  const shouldSaveDraft = true

  const onTextUpdated = (e) => {
    onChange(e)
  }

  useEffect(() => {
    if (showCharCounter || !value) return
    setShowCharCounter(true)
  }, [value])

  useEffect(() => {
    if (!shouldSaveDraft || value) return
    const keyOfSavedText = getAutoStorageKey(user, invitation.id, note?.id, fieldName)
    const savedText = localStorage.getItem(keyOfSavedText)
    if (savedText) onTextUpdated({ fieldName, value: savedText, shouldSaveDraft })
  }, [])

  return (
    <>
      <div className={`${isWebfield ? 'textarea' : styles.textAreaContainer}`}>
        {enableMarkdown ? (
          <MarkdownPreviewTab
            textAreaClass={styles.textarea}
            value={value ?? ''}
            onValueChanged={(e) => onTextUpdated({ fieldName, value: e, shouldSaveDraft })}
          />
        ) : (
          <textarea
            className={`form-control ${styles.textarea}`}
            value={value ?? ''}
            onChange={(e) =>
              onTextUpdated({ fieldName, value: e.target.value, shouldSaveDraft })
            }
          ></textarea>
        )}
      </div>
      <div className={styles.warningContainer}>
        {showCharCounter && (
          <CharCounter
            minLength={field[fieldName]?.value?.param?.minLength}
            maxLength={field[fieldName]?.value?.param?.maxLength}
            contentLength={value?.trim()?.length ?? 0}
          />
        )}
        {enableMarkdown && <MathJaxWarning content={value} />}
      </div>
    </>
  )
}

export default TextAreaWidget
