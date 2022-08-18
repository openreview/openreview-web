import NoteContentCollapsible from './NoteContentCollapsible'
import { forumDate, getNotePdfUrl } from '../../lib/utils'

const NoteSummary = ({ note, referrerUrl, isV2Note, showDates = false }) => {
  const titleValue = isV2Note ? note.content?.title?.value : note.content?.title
  const pdfValue = isV2Note ? note.content?.pdf?.value : note.content?.pdf
  const authorsValue = isV2Note ? note.content?.authors?.value : note.content?.authors
  return (
    <div className="note">
      <h4>
        <a
          href={`/forum?id=${note.forum}&referrer=${referrerUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          {titleValue}
        </a>
      </h4>
      {pdfValue && (
        <div className="download-pdf-link">
          <a
            href={getNotePdfUrl(note, false)}
            className="attachment-download-link"
            title="Download PDF"
            target="_blank"
            download={`${note.number}.pdf`}
            rel="noreferrer"
          >
            <span className="glyphicon glyphicon-download-alt" aria-hidden="true"></span>{' '}
            Download PDF
          </a>
        </div>
      )}
      {authorsValue && <div className="note-authors">{authorsValue.join(', ')}</div>}

      {showDates && (
        <div>
          <span className="date">
            <strong>Submission date</strong>:{' '}
            {forumDate(
              note.cdate,
              note.tcdate,
              note.mdate,
              note.tmdate,
              isV2Note ? note.content.year?.value : note.content.year
            )}
          </span>
        </div>
      )}

      <NoteContentCollapsible
        id={note.id}
        content={note.content}
        invitation={note.invitation}
        isV2Note={isV2Note}
      />
    </div>
  )
}

export default NoteSummary
