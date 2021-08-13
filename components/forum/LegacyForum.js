import { useEffect, useContext } from 'react'
import UserContext from '../UserContext'
import LoadingSpinner from '../LoadingSpinner'
import NoteAuthors, { NoteAuthorsV2 } from '../NoteAuthors'
import NoteReaders from '../NoteReaders'
import NoteContent, { NoteContentV2 } from '../NoteContent'
import { prettyId, inflect, forumDate } from '../../lib/utils'

// Component Styles
import '../../styles/components/legacy-forum.less'

export default function LegacyForum({
  forumNote, selectedNoteId, selectedInvitationId, clientJsLoading,
}) {
  const { user, userLoading } = useContext(UserContext)
  const { id, content, details } = forumNote

  const isV2Note = forumNote.version === 2
  const noteAuthors = isV2Note ? content.authors?.value : content.authors
  const noteTitle = isV2Note ? content.title?.value : content.title
  const notePdf = isV2Note ? content.pdf?.value : content.pdf
  const noteHtml = isV2Note ? content.html?.value : content.html || content.ee

  const authors = Array.isArray(noteAuthors) || typeof noteAuthors === 'string'
    ? [content.authors].flat()
    : []

  // Load and execute legacy forum code
  useEffect(() => {
    if (clientJsLoading || userLoading) return

    // eslint-disable-next-line global-require
    const runForum = isV2Note ? require('../../client/forum-v2') : require('../../client/forum')
    runForum(id, selectedNoteId, selectedInvitationId, user)
  }, [clientJsLoading, user, JSON.stringify(authors), userLoading]) // authors is reset when clientJsLoading turns false

  return (
    <div className="forum-container">
      <div className="note">
        <ForumTitle
          id={id}
          title={noteTitle}
          pdf={notePdf}
          html={noteHtml}
        />
        {isV2Note
          ? (
            <ForumAuthors
              authors={content.authors}
              authorIds={content.authorids}
              signatures={forumNote.signatures}
              original={details.original}
            />
          )
          : (
            <ForumAuthorsV2
              authors={content.authors} // NoteAuthorsV2 is expecting obj
              authorIds={content.authorids}
              signatures={forumNote.signatures}
              noteReaders={forumNote.readers}
            />
          )}

        <ForumMeta note={forumNote} />

        {isV2Note
          ? (
            <NoteContentV2
              id={id}
              content={content}
              presentation={details.presentation}
            />
          )
          : (
            <NoteContent
              id={id}
              content={content}
              invitation={details.originalInvitation || details.invitation}
            />
          )}

        <ForumReplyCount count={details.replyCount} />
      </div>

      <hr />

      <div id="note_children">
        <LoadingSpinner />
      </div>
    </div>
  )
}

const ForumTitle = ({
  id, title, pdf, html,
}) => (
  <div className="title_pdf_row">
    <h2 className="note_content_title citation_title">
      {title}

      {pdf && (
        // eslint-disable-next-line react/jsx-no-target-blank
        <a className="note_content_pdf citation_pdf_url" href={`/pdf?id=${id}`} title="Download PDF" target="_blank">
          <img src="/images/pdf_icon_blue.svg" alt="Download PDF" />
        </a>
      )}
      {html && (
        <a className="note_content_pdf html-link" href={html} title="Open Website" target="_blank" rel="noopener noreferrer">
          <img src="/images/html_icon_blue.svg" alt="Open Website" />
        </a>
      )}
    </h2>
  </div>
)

const ForumAuthors = ({
  authors, authorIds, signatures, original,
}) => (
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

const ForumAuthorsV2 = ({
  authors, authorIds, signatures, noteReaders,
}) => (
  <div className="meta_row">
    <h3 className="signatures author">
      <NoteAuthorsV2 authors={authors} authorIds={authorIds} signatures={signatures} noteReaders={noteReaders} />
    </h3>
  </div>
)

const ForumMeta = ({ note }) => {
  const isV2Note = note.version === 2
  const noteYear = isV2Note ? note.year?.value : note.year
  const noteVenue = isV2Note ? note.venue?.value : note.venue
  const noteInvitation = isV2Note ? note.invitations[0] : note.invitation

  return (
    <div className="meta_row">
      <span className="date item">
        {forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, noteYear)}
      </span>

      {noteVenue ? (
        <span className="item">{noteVenue}</span>
      ) : (
        <span className="item">{prettyId(noteInvitation)}</span>
      )}

      {note.readers && (
        <span className="item">
          Readers:
          {' '}
          <NoteReaders readers={note.readers} />
        </span>
      )}
    </div>
  )
}

const ForumReplyCount = ({ count }) => (
  <div className="reply_row clearfix">
    <div className="item" id="reply_count">{inflect(count, 'Reply', 'Replies', true)}</div>
  </div>
)
