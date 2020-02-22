import { useEffect, useContext } from 'react'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'
import api from '../lib/api-client'
import {
  prettyId, inflect, forumDate, prettyField, prettyContentValue,
} from '../lib/utils'

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
}) => {
  const authorsList = (authors && authors.length) ? authors : signatures

  return (
    <div className="meta_row">
      <h3 className="signatures author">
        {authorsList.map((author, i) => {
          const authorId = authorIds[i]
          if (!author) return null
          if (!authorId) return author

          let param
          if (authorId.indexOf('~') === 0) {
            param = 'id'
          } else if (authorId.includes('@')) {
            param = 'email'
          }
          if (!param) return author

          return (
            <a
              href={`/profiles?${param}=${encodeURIComponent(authorId)}`}
              data-toggle="tooltip"
              data-placement="top"
              title={authorId}
              key={authorId}
            >
              {author}
            </a>
          )
        }).join(', ')}
      </h3>
    </div>
  )
}

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

const ForumContent = ({ content }) => {
  const omittedFields = [
    'body', 'title', 'authors', 'author_emails', 'authorids', 'pdf',
    'verdict', 'paperhash', 'ee', 'html', 'year', 'venue', 'venueid',
  ]

  return (
    <ul className="list-unstyled note-content">
      {Object.keys(content).map((fieldName) => {
        if (omittedFields.includes(fieldName) || fieldName.startsWith('_')) {
          return null
        }

        return (
          <li key={fieldName}>
            <strong className="note-content-field">
              {prettyField(fieldName)}
              :
            </strong>
            {' '}
            <span className="note-content-value">
              {prettyContentValue(content[fieldName])}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const ForumReplyCount = ({ count }) => (
  <div className="reply_row clearfix">
    <div className="item" id="reply_count">{inflect(count, 'Reply', 'Replies', true)}</div>
  </div>
)

const Forum = ({ forumNote, appContext }) => {
  const { user } = useContext(UserContext)
  const { clientJsLoading } = appContext
  const { content } = forumNote

  useEffect(() => {
    document.title = `${forumNote.content.title || 'Forum'} | OpenReview`
  }, [forumNote])

  useEffect(() => {

  }, [clientJsLoading])

  return (
    <>
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

        <ForumContent content={content} omittedFields={[]} />

        <ForumReplyCount count={forumNote.details.replyCount} />
      </div>

      <hr />

      <div id="note_children">
        {clientJsLoading && (
          <LoadingSpinner />
        )}
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
