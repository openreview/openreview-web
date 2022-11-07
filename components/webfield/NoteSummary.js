import { forumDate, getNotePdfUrl } from '../../lib/utils'
import Collapse from '../Collapse'
import Icon from '../Icon'
import NoteContent, { NoteContentV2 } from '../NoteContent'

const NoteSummary = ({ note, referrerUrl, isV2Note, profileMap, showDates = false }) => {
  const titleValue = isV2Note ? note.content?.title?.value : note.content?.title
  const pdfValue = isV2Note ? note.content?.pdf?.value : note.content?.pdf
  const authorsValue = isV2Note ? note.content?.authors?.value : note.content?.authors
  const authorIdsValue = isV2Note ? note.content?.authorids?.value : note.content?.authorids

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

      {authorsValue && (
        <div className="note-authors">
          {authorsValue.map((authorName, i) => {
            const authorId = authorIdsValue[i]
            const authorProfile = profileMap?.[authorIdsValue[i]]
            return (
              <span key={authorId}>
                {authorName}
                {authorProfile && (
                  authorProfile.active ? (
                    <Icon name="ok-sign" tooltip="Profile active" extraClasses="pl-1 text-success" />
                  ) : (
                    <Icon name="remove-sign" tooltip="Profile inactive" extraClasses="pl-1 text-danger" />
                  )
                )}
              </span>
            )
          }).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
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

      {isV2Note && note?.content?.venue?.value && <span>{note.content.venue.value}</span>}

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
