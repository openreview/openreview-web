import { DownloadLink, NoteContentValue } from '../NoteContent'
import { formatTimestamp } from '../../lib/utils'

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
  if (
    fieldName === '_bibtex' ||
    fieldName === 'web' ||
    fieldName === 'process' ||
    fieldName.endsWith('_script') ||
    fieldName.endsWith('_process') ||
    isJsonValue
  ) {
    return (
      <div className="note-content-value">
        <pre>{fieldValue}</pre>
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
