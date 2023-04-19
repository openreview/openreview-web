import isEqual from 'lodash/isEqual'
import { forumDate, getNotePdfUrl } from '../../lib/utils'
import Collapse from '../Collapse'
import Icon from '../Icon'
import NoteContent, { NoteContentV2 } from '../NoteContent'
import NoteReaders from '../NoteReaders'
import ExpandableList from '../ExpandableList'

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
  profileMap,
  showDates = false,
  showReaders = false,
}) => {
  const titleValue = isV2Note ? note.content?.title?.value : note.content?.title
  const pdfValue = isV2Note ? note.content?.pdf?.value : note.content?.pdf
  const authorsValue = getAuthorsValue(note, isV2Note)
  const authorIdsValue = isV2Note ? note.content?.authorids?.value : note.content?.authorids
  const maxAuthors = 15

  const authorNames = authorsValue?.map((authorName, i) => {
    const authorId = authorIdsValue[i]
    const authorProfile = profileMap?.[authorIdsValue[i]]
    const errorTooltip = authorProfile
      ? 'Profile not yet activated'
      : 'Profile not yet created or email not confirmed'

    return (
      <span key={authorId}>
        {authorName}
        {profileMap &&
          (authorProfile?.active ? (
            <Icon
              name="ok-sign"
              tooltip="Profile is active and email confirmed"
              extraClasses="pl-1 text-success"
            />
          ) : (
            <Icon name="remove-sign" tooltip={errorTooltip} extraClasses="pl-1 text-danger" />
          ))}
      </span>
    )
  })

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
            href={getNotePdfUrl(note, false, isV2Note)}
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
          <ExpandableList
            items={authorNames}
            maxItems={maxAuthors}
            expandLabel={`+ ${authorNames.length - maxAuthors} more authors`}
            collapseLabel="Hide authors"
          />
        </div>
      )}

      {showReaders && (
        <div className="note-readers">
          <Icon name="eye-open" /> <NoteReaders readers={note.readers} />
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

      {isV2Note && note?.content?.venue?.value && (
        <span className="note-venue">{note.content.venue.value}</span>
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
