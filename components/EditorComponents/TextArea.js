import { useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import { prettyField, saveTextField } from '../../lib/utils'
import EditorComponentContext from '../EditorComponentContext'
import MarkdownPreviewTab from '../MarkdownPreviewTab'
import WebFieldContext from '../WebFieldContext'

import styles from '../../styles/components/Textarea.module.scss'

const CharCounter = ({
  regex,
  minLengthInvitation = 0,
  maxLengthInvitation = 0,
  contentLength,
  isV2Invitation,
}) => {
  let minLength = minLengthInvitation
  let maxLength = maxLengthInvitation
  if (!isV2Invitation) {
    const lenMatches = (regex ?? '').match(
      isV2Invitation ? /\{(\d+),(\d+)\}\$$/ : /\{(\d+),(\d+)\}$/
    )
    if (lenMatches) {
      minLength = parseInt(lenMatches[1], 10)
      maxLength = parseInt(lenMatches[2], 10)
      minLength = Number.isNaN(minLength) || minLength < 0 ? 0 : minLength
      maxLength = Number.isNaN(maxLength) || maxLength < minLength ? 0 : maxLength
    }
  }

  const getClassName = () => {
    const charsRemaining = maxLength - contentLength
    let className = ''
    if (charsRemaining < 1) {
      className = 'danger'
    } else if (charsRemaining < 150) {
      className = 'warning'
    }
    return `char-counter hint ${className}`
  }

  return (
    <div className={getClassName()}>
      <div className="pull-left">
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
    </div>
  )
}

const MathJaxWarning = ({ content }) => {
  const showMathJaxWarning = content?.match(/\$[\s\S]*\\\\[\s\S]*\$/)
  if (!showMathJaxWarning) return null
  return (
    <div className="pull-right hint content-warning danger">
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

export const TextArea = () => {
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const webFieldContext = useContext(WebFieldContext)
  const { invitation, note } = isWebfield ? webFieldContext : {}
  const { user } = useUser()
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  // eslint-disable-next-line prefer-destructuring
  const required = field[fieldName].required
  // eslint-disable-next-line prefer-destructuring
  const scroll = field[fieldName].scroll
  const enableMarkdown = field[fieldName].markdown
  const enableAutoSave = field[fieldName].disableAutosave !== true

  const [showCharCounter, setShowCharCounter] = useState(false)

  const onTextUpdated = (e) => {
    saveTextField(user, invitation?.id, note?.id, fieldName, e.value)
    onChange(e)
  }

  useEffect(() => {
    if (showCharCounter || !value) return
    setShowCharCounter(true)
  }, [value])

  return (
    <div className="textarea">
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
      <div className="content">
        {enableMarkdown ? (
          <MarkdownPreviewTab
            value={value ?? ''}
            onValueChanged={(e) => onTextUpdated({ fieldName, value: e })}
            textAreaClass={`${enableAutoSave ? 'autosave-enabled' : undefined}`}
          />
        ) : (
          <textarea
            className={`note_content_value form-control${
              enableAutoSave ? ' autosave-enabled' : ''
            }`}
            onChange={(e) => onTextUpdated({ fieldName, value: e.target.value })}
            value={value ?? ''}
          ></textarea>
        )}
      </div>
      <div className="counter-warning">
        {showCharCounter && (
          <CharCounter
            regex={field[fieldName]['value-regex']}
            contentLength={value?.trim()?.length ?? 0}
          />
        )}
        {enableMarkdown && <MathJaxWarning content={value} />}
      </div>
    </div>
  )
}

export const TextAreaV2 = () => {
  const { field, onChange, value, isWebfield } = useContext(EditorComponentContext)
  const webFieldContext = useContext(WebFieldContext)
  const { invitation, note } = isWebfield ? webFieldContext : {}
  const { user } = useUser()
  const fieldName = Object.keys(field)[0]
  const fieldDescription = field[fieldName].description
  // eslint-disable-next-line prefer-destructuring
  const required = !field[fieldName].value?.param?.optional
  const scroll = field[fieldName].value?.param?.scroll
  const enableMarkdown = field[fieldName].value?.param?.markdown
  const hidden = field[fieldName].value?.param?.hidden

  const [showCharCounter, setShowCharCounter] = useState(false)

  const onTextUpdated = (e) => {
    saveTextField(user, invitation?.id, note?.id, fieldName, e.value)
    onChange(e)
  }

  useEffect(() => {
    if (showCharCounter || !value) return
    setShowCharCounter(true)
  }, [value])

  return (
    <div
      className={`${isWebfield ? 'textarea' : `${styles.textarea}`}${hidden ? ' hidden' : ''}`}
    >
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
      <div className="content">
        {enableMarkdown ? (
          <MarkdownPreviewTab
            value={value ?? ''}
            onValueChanged={(e) => onTextUpdated({ fieldName, value: e })}
            textAreaClass="autosave-enabled"
          />
        ) : (
          <textarea
            className="note_content_value form-control autosave-enabled"
            onChange={(e) => onTextUpdated({ fieldName, value: e.target.value })}
            value={value ?? ''}
          ></textarea>
        )}
      </div>
      {showCharCounter && (
        <CharCounter
          minLengthInvitation={field[fieldName]?.value?.param?.minLength}
          maxLengthInvitation={field[fieldName]?.value?.param?.maxLength}
          contentLength={value?.trim()?.length ?? 0}
          isV2Invitation={true}
        />
      )}
      {enableMarkdown && <MathJaxWarning content={value} />}
    </div>
  )
}
