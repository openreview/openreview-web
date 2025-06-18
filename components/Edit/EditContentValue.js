import { DownloadLink, NoteContentValue } from '../NoteContent'
import { formatTimestamp } from '../../lib/utils'
import CodeEditor from '../CodeEditor'

const EditContentValue = ({ editId, fieldName, fieldValue, enableMarkdown, isJsonValue }) => {
  if (fieldValue.startsWith('/attachment/') || fieldValue.startsWith('/pdf/')) {
    return (
      <span className="note-content-value">
        <DownloadLink
          noteId={editId}
          fieldName={fieldName}
          fieldValue={fieldValue}
          isReference={true}
          isV2={true}
        />
      </span>
    )
  }

  if (fieldName === 'html') {
    return (
      <span className="note-content-value">
        <a
          href={fieldValue}
          className="html-link"
          title="Open Website"
          rel="noopener noreferrer"
          target="_blank"
        >
          <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
        </a>
      </span>
    )
  }

  if (fieldName === '_bibtex') {
    return (
      <div className="note-content-value">
        <pre>{fieldValue}</pre>
      </div>
    )
  }
  if (
    fieldName === 'web' ||
    fieldName === 'preprocess' ||
    fieldName === 'process' ||
    fieldName === 'dateprocesses' ||
    fieldName.endsWith('_script') ||
    fieldName.endsWith('_process') ||
    isJsonValue
  ) {
    return (
      <div className="note-content-value">
        {fieldValue.length ? (
          <CodeEditor code={fieldValue} readOnly isJson={isJsonValue} defaultToMinHeight />
        ) : (
          <span className="empty-value">(empty)</span>
        )}
      </div>
    )
  }
  if (
    [
      'cdate',
      'tcdate',
      'mdate',
      'tmdate',
      'ddate',
      'tddate',
      'odate',
      'pdate',
      'duedate',
      'expdate',
    ].includes(fieldName)
  ) {
    return (
      <span className="note-content-value">
        {formatTimestamp(Number.parseInt(fieldValue, 10))}
      </span>
    )
  }

  return <NoteContentValue content={fieldValue} enableMarkdown={enableMarkdown} />
}

export default EditContentValue
