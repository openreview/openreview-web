import { DownloadLink, NoteContentValue } from '../NoteContent'

const EditContentValue = ({ editId, fieldName, fieldValue, enableMarkdown }) => {
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
      <a
        href={fieldValue}
        className="html-link"
        title="Open Website"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
      </a>
    )
  }

  return <NoteContentValue content={fieldValue} enableMarkdown={enableMarkdown} />
}

export default EditContentValue
