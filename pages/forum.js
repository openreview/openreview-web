/* eslint-disable global-require */

import { useEffect, useContext } from 'react'
import Head from 'next/head'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import NoteAuthors from '../components/NoteAuthors'
import NoteContent from '../components/NoteContent'
import withError from '../components/withError'
import api from '../lib/api-client'
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
        readers:
        {' '}
        {note.readers.map(prettyId).join(', ')}
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
  const { content } = forumNote

  // Set banner link
  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      const groupId = forumNote.content.venueid
        ? forumNote.content.venueid
        : forumNote.invitation.split('/-/')[0]
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote])

  // Load and execute legacy forum code
  useEffect(() => {
    if (clientJsLoading) return

    if (!window.MathJax) {
      window.MathJax = require('../lib/mathjax-config')
      require('mathjax/es5/tex-chtml')
    }

    const runForum = require('../client/forum')
    runForum(forumNote.id, query.noteId, query.invitationId, user)
  }, [clientJsLoading])

  return (
    <>
      <Head>
        <title>
          {forumNote.content.title || 'Forum'}
          {' '}
          | OpenReview
        </title>
      </Head>

      <div className="note">
        <ForumTitle
          title={content.title}
          pdf={content.pdf}
          html={content.html || content.ee}
        />

        <ForumAuthors
          authors={content.authors}
          authorIds={content.authorids}
          signatures={forumNote.signatures}
          original={forumNote.details.original}
        />

        <ForumMeta note={forumNote} />

        <NoteContent content={content} />

        <ForumReplyCount count={forumNote.details.replyCount} />
      </div>

      <hr />

      <div id="note_children">
        <LoadingSpinner />
      </div>
    </>
  )
}

Forum.getInitialProps = async (ctx) => {
  let forumNote
  try {
    const apiRes = await api.get('/notes', {
      id: ctx.query.id, trash: true, details: 'replyCount,writable,revisions,original,overwriting',
    })
    forumNote = apiRes.notes && apiRes.notes.length && apiRes.notes[0]
  } catch (error) {
    return { statusCode: 400, message: 'Forum not found' }
  }
  if (!forumNote) {
    return { statusCode: 404, message: 'Forum not found' }
  }

  return {
    forumNote,
    query: ctx.query,
  }
}

const WrappedForum = withError(Forum)
WrappedForum.title = 'Forum'

export default WrappedForum
