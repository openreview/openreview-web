import { DownloadLink, NoteContentValue } from '../NoteContent'

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
  if (fieldName === '_bibtex' || fieldName === 'web' || fieldName.endsWith('_script') || fieldName.endsWith('_process') || isJsonValue) {
    return (
      <div className="note-content-value">
        <pre>{fieldValue}</pre>
      </div>
    )
  }

  return <NoteContentValue content={fieldValue} enableMarkdown={enableMarkdown} />
}

export default EditContentValue
