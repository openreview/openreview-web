import { isEqual } from 'lodash'
import { forumDate, getNotePdfUrl } from '../../lib/utils'
import Collapse from '../Collapse'
import NoteContent, { NoteContentV2 } from '../NoteContent'
import NoteReaders from '../NoteReaders'

const getAuthorsValue = (note, isV2Note) => {
  if (isV2Note) return note.content?.authors?.value
  const noteAuthors = note.content?.authors
  const originalAuthors = note.details?.original?.content?.authors
  if (originalAuthors && !isEqual(noteAuthors, originalAuthors)) return originalAuthors
  return noteAuthors
}

const NoteSummary = ({
  note,
  referrerUrl,
  isV2Note,
  showDates = false,
  showReaders = false,
}) => {
  const titleValue = isV2Note ? note.content?.title?.value : note.content?.title
  const pdfValue = isV2Note ? note.content?.pdf?.value : note.content?.pdf
  const authorsValue = getAuthorsValue(note, isV2Note)
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
      {showReaders && (
        <div className="note-readers">
          Readers: <NoteReaders readers={note.readers} />
        </div>
      )}

      {showDates && (
        <div>
          <span className="date">
            <strong>Submission date</strong>:{' '}
            {forumDate(
              note.cdate,
              note.tcdate,
              note.mdate,
              note.tmdate,
              isV2Note ? note.content.year?.value : note.content.year,
              note.pdate
            )}
          </span>
        </div>
      )}

      <Collapse showLabel="Show details" hideLabel="Hide details">
        {isV2Note ? (
          <NoteContentV2
            id={note.id}
            content={note.content}
            invitation={note.invitation}
            include={['html']}
          />
        ) : (
          <NoteContent
            id={note.id}
            content={note.content}
            invitation={note.invitation}
            include={['html']}
          />
        )}
      </Collapse>
    </div>
  )
}

export default NoteSummary
