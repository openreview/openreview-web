import { useEffect, useContext } from 'react'
import UserContext from '../UserContext'
import LoadingSpinner from '../LoadingSpinner'
import { NoteAuthorsV2 } from '../NoteAuthors'
import NoteReaders from '../NoteReaders'
import { NoteContentV2 } from '../NoteContent'
import { prettyId, inflect, forumDate } from '../../lib/utils'

export default function LegacyForumV2({
  forumNote,
  selectedNoteId,
  selectedInvitationId,
  clientJsLoading,
}) {
  const { user, userLoading } = useContext(UserContext)
  const { id, content, details } = forumNote

  const authors =
    Array.isArray(content.authors?.value) || typeof content.authors?.value === 'string'
      ? [content.authors?.value].flat()
      : []

  // Load and execute legacy forum code
  useEffect(() => {
    if (clientJsLoading || userLoading) return

    // eslint-disable-next-line global-require
    const runForum = require('../../client/forum-v2')
    runForum(id, selectedNoteId, selectedInvitationId, user, true)
    // authors resets when clientJsLoading turns false
  }, [clientJsLoading, user?.id, JSON.stringify(authors), userLoading, true])

  return (
    <div className="forum-container">
      <div className="note">
        <ForumTitle
          id={id}
          title={content.title?.value}
          pdf={content.pdf?.value}
          html={content.html?.value}
        />
        <ForumAuthors
          authors={content.authors} // NoteAuthorsV2 is expecting obj
          authorIds={content.authorids}
          signatures={forumNote.signatures}
          noteReaders={forumNote.readers}
        />

        <ForumMeta note={forumNote} />

        <NoteContentV2 id={id} content={content} presentation={details.presentation} />

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
        // eslint-disable-next-line react/jsx-no-target-blank
        <a
          className="note_content_pdf citation_pdf_url"
          href={`/pdf?id=${id}`}
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

const ForumAuthors = ({ authors, authorIds, signatures, noteReaders }) => (
  <div className="meta_row">
    <h3 className="signatures author">
      <NoteAuthorsV2
        authors={authors}
        authorIds={authorIds}
        signatures={signatures}
        noteReaders={noteReaders}
      />
    </h3>
  </div>
)

const ForumMeta = ({ note }) => (
  <div className="meta_row">
    <span className="date item">
      {forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year?.value, note.pdate)}
    </span>

    <span className="item">{note.content.venue?.value || prettyId(note.invitations[0])}</span>

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
