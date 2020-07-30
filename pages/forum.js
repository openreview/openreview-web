import { useEffect, useContext } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteAuthors from '../components/NoteAuthors'
import NoteReaders from '../components/NoteReaders'
import NoteContent from '../components/NoteContent'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { prettyId, inflect, forumDate } from '../lib/utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

// Page Styles
import '../styles/pages/forum.less'

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

const ForumMeta = ({ note }) => (
  <div className="meta_row">
    <span className="date item">
      {forumDate(note.cdate, note.tcdatem, note.mdate, note.tmdate, note.content.year)}
    </span>

    {note.content.venue ? (
      <span className="item">{note.content.venue}</span>
    ) : (
      <span className="item">{prettyId(note.invitation)}</span>
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

const ForumReplyCount = ({ count }) => (
  <div className="reply_row clearfix">
    <div className="item" id="reply_count">{inflect(count, 'Reply', 'Replies', true)}</div>
  </div>
)

const Forum = ({ forumNote, query, appContext }) => {
  const { user } = useContext(UserContext)
  const { clientJsLoading, setBannerContent } = appContext
  const { id, content, details } = forumNote

  // Set banner link
  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      const groupId = content.venueid
        ? content.venueid
        : forumNote.invitation.split('/-/')[0]
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote])

  // Load and execute legacy forum code
  useEffect(() => {
    if (clientJsLoading) return

    // eslint-disable-next-line global-require
    const runForum = require('../client/forum')
    runForum(id, query.noteId, query.invitationId, user)
  }, [clientJsLoading])

  return (
    <div className="forum-container">
      <Head>
        <title key="title">{`${content.title || 'Forum'} | OpenReview`}</title>
      </Head>

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

Forum.getInitialProps = async (ctx) => {
  const { token } = auth(ctx)
  try {
    const result = await api.get('/notes', { id: ctx.query.id }, { accessToken: token })
    if (result.notes.length) {
      const note = result.notes[0]
      note.details = {}

      // if blind submission return the forum
      if (note.original) {
        return { forumNote: note, query: ctx.query }
      }

      // if it is the original of a blind submission, do redirection
      const blindNotesResult = await api.get('/notes', { original: note.id }, { accessToken: token })

      // if no blind submission found return the current forum
      if (blindNotesResult.notes.length === 0) {
        return { forumNote: note, query: ctx.query }
      }

      // redirect forum
      const blindNote = blindNotesResult.notes[0]
      if (ctx.req) {
        ctx.res.writeHead(302, { Location: `/forum?id=${encodeURIComponent(blindNote.id)}` }).end()
      } else {
        Router.replace(`/forum?id=${encodeURIComponent(blindNote.id)}`)
      }
      return {}
    }

    return { statusCode: 404, message: 'Forum not found' }
  } catch (error) {
    if (error.name === 'forbidden') {
      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to read this forum' }
    }
    return { statusCode: error.status, message: error.message }
  }
}

Forum.bodyClass = 'forum'

export default withError(Forum)
