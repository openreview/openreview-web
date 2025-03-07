import { useEffect, useContext } from 'react'
import UserContext from '../UserContext'
import LoadingSpinner from '../LoadingSpinner'
import NoteAuthors from '../NoteAuthors'
import NoteReaders from '../NoteReaders'
import NoteContent from '../NoteContent'
import { prettyId, inflect, forumDate, classNames } from '../../lib/utils'

export default function LegacyForum({
  forumNote,
  selectedNoteId,
  selectedInvitationId,
  clientJsLoading,
}) {
  const { user, userLoading } = useContext(UserContext)
  const { id, content, details } = forumNote
  const authors =
    Array.isArray(content.authors) || typeof content.authors === 'string'
      ? [content.authors].flat()
      : []

  // Load and execute legacy forum code
  useEffect(() => {
    if (clientJsLoading || userLoading) return

    // eslint-disable-next-line global-require
    const runForum = require('../../client/forum')
    runForum(id, selectedNoteId, selectedInvitationId, user)
    // authors resets when clientJsLoading turns false
  }, [clientJsLoading, user?.id, JSON.stringify(authors), userLoading])

  return (
    <div className="forum-container">
      <div className="note">
        <ForumTitle
          id={id}
          title={content.title}
          pdf={content.pdf}
          html={content.html || content.ee}
        />

        <ForumAuthors
          authors={content.authors}
          authorIds={content.authorids}
          signatures={forumNote.signatures}
          original={details.original}
        />

        <ForumMeta note={forumNote} />

        <NoteContent
          id={id}
          content={content}
          invitation={details.originalInvitation || details.invitation}
        />

        <ForumReplyCount count={details.replyCount} />
      </div>

      <hr />

      <div id="note_children">
        <LoadingSpinner />
      </div>
    </div>
  )
}

const ForumTitle = ({ id, title, pdf, html }) => (
  <div className="title_pdf_row">
    <h2 className="note_content_title citation_title">
      {title}

      {pdf && (
        <a
          className={classNames(
            'note_content_pdf',
            pdf.startsWith('/pdf') ? 'citation_pdf_url' : null
          )}
          href={pdf.startsWith('/pdf') ? `/pdf?id=${id}` : pdf}
          title="Download PDF"
          target="_blank"
        >
          <img src="/images/pdf_icon_blue.svg" alt="Download PDF" />
        </a>
      )}
      {html && (
        <a
          className="note_content_pdf html-link"
          href={html}
          title="Open Website"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/images/html_icon_blue.svg" alt="Open Website" />
        </a>
      )}
    </h2>
  </div>
)

const ForumAuthors = ({ authors, authorIds, signatures, original }) => (
  <div className="meta_row">
    <h3 className="signatures author">
      <NoteAuthors
        authors={authors}
        authorIds={authorIds}
        signatures={signatures}
        original={original}
      />
    </h3>
  </div>
)

const ForumMeta = ({ note }) => (
  <div className="meta_row">
    <span className="date item">
      {forumDate(
        note.cdate,
        note.tcdatem,
        note.mdate,
        note.tmdate,
        note.content.year,
        note.pdate
      )}
    </span>

    {note.content.venue ? (
      <span className="item">{note.content.venue}</span>
    ) : (
      <span className="item">{prettyId(note.invitation)}</span>
    )}

    {note.readers && (
      <span className="item">
        Readers: <NoteReaders readers={note.readers} />
      </span>
    )}
  </div>
)

const ForumReplyCount = ({ count }) => (
  <div className="reply_row clearfix">
    <div className="item" id="reply_count">
      {inflect(count, 'Reply', 'Replies', true)}
    </div>
  </div>
)
