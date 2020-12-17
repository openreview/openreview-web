/* globals DOMPurify: false */
/* globals marked: false */

import {
  useEffect, useLayoutEffect, useRef, useState,
} from 'react'
import Head from 'next/head'
import truncate from 'lodash/truncate'
import upperFirst from 'lodash/upperFirst'
import { useRouter } from 'next/router'
import LoadingSpinner from '../../components/LoadingSpinner'
import Icon from '../../components/Icon'
import useQuery from '../../hooks/useQuery'
import { prettyId, forumDate } from '../../lib/utils'
import api from '../../lib/api-client'

// Page Styles
import '../../styles/pages/embed.less'

export default function EmbeddedForum({ appContext, userContext }) {
  const [forumNote, setForumNote] = useState(null)
  const [replyNotes, setReplyNotes] = useState(null)
  const [displayMode, setDisplayMode] = useState('linear')
  const [error, setError] = useState(null)
  const bottomElRef = useRef()
  const query = useQuery()
  const router = useRouter()
  const { clientJsLoading } = appContext
  const { user, userLoading, accessToken } = userContext

  const loadNotes = async (forumId, invitationId) => {
    if (!forumId) {
      setError('Could not load forum. Missing forum ID.')
      return
    }
    if (!invitationId) {
      setError('Could not load forum. Missing invitation ID.')
      return
    }

    const apiRes = await api.get('/notes', { id: forumId }, { accessToken })
    if (apiRes.notes?.length > 0) {
      const noteCopy = apiRes.notes[0]
      noteCopy.content.truncatedTitle = truncate(noteCopy.content.title, { length: 70, separator: /,? +/ })
      noteCopy.content.truncatedAbstract = truncate(noteCopy.content['TL;DR'] || noteCopy.content.abstract, { length: 200, separator: /,? +/ })
      setForumNote(noteCopy)
    } else {
      setError(`Could not load forum. Forum ${forumId} not found.`)
      return
    }

    const { notes } = await api.get('/notes', {
      forum: forumId,
      invitation: invitationId,
      trash: true,
      details: 'replyCount,writable,revisions,original,overwriting,invitation,tags',
    }, { accessToken })

    if (notes?.length > 0) {
      setReplyNotes(notes.filter(note => note.id !== note.forum).sort((a, b) => a.cdate - b.cdate))
    } else {
      setReplyNotes([])
    }
  }

  const postNote = (content, signature) => {
    const note = {
      forum: forumNote.id,
      invitation: query.invitation,
      content,
      signatures: [signature],
      readers: ['everyone'],
      writers: [signature],
    }
    return api.post('/notes', note, { accessToken })
  }

  useEffect(() => {
    if (userLoading || !query || clientJsLoading) return

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }

    // Set display params and filters
    if (['linear', 'threaded', 'nested'].includes(query.display)) {
      setDisplayMode(query.display)
    }

    loadNotes(query.id, query.invitation)
  }, [userLoading, query, clientJsLoading])

  useEffect(() => {
    if (replyNotes && bottomElRef.current) {
      setTimeout(() => {
        bottomElRef.current.scrollIntoView()
      }, 20)
    }
  }, [replyNotes, bottomElRef])

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title key="title">{`${forumNote?.content.title || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={forumNote?.content['TL;DR'] || forumNote?.content.abstract || ''} />

        <meta property="og:title" key="og:title" content={forumNote?.content.truncatedTitle} />
        <meta property="og:description" key="og:description" content={forumNote?.content.truncatedAbstract} />
        <meta property="og:image" key="og:image" content="https://openreview.net/images/openreview_logo_512.png" />
        <meta property="og:type" key="og:type" content="article" />
        <meta property="og:site_name" key="og:site_name" content="OpenReview" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@openreviewnet" />
      </Head>

      <HeaderNav title={forumNote?.content.title} />

      <ContentContainer>
        {/* eslint-disable-next-line no-nested-ternary */}
        {error ? (
          <ErrorMessage message={error} />
        ) : replyNotes ? (
          <>
            <ForumReplies
              notes={replyNotes}
              displayMode={displayMode}
              contentField={query.content || 'message'}
              bottomElRef={bottomElRef}
            />
            <SubmitForm user={user.profile} contentField={query.content || 'message'} postNote={postNote} />
          </>
        ) : (
          <LoadingSpinner />
        )}
      </ContentContainer>
    </>
  )
}

EmbeddedForum.bodyClass = 'embed'

function HeaderNav({ title }) {
  return (
    <nav className="navbar navbar-inverse navbar-fixed-top embed" role="navigation">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#navbar"
            aria-expanded="false"
            aria-controls="navbar"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
          </button>

          <a href="/" target="_blank" className="navbar-brand">
            <strong>{title}</strong>
          </a>
        </div>
      </div>
    </nav>
  )
}

function ContentContainer({ children }) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-xs-12">
          <main id="content" className="embed">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function ErrorMessage({ message }) {
  return (
    <div className="alert alert-danger">
      <Icon name="exclamation-sign" />
      {' '}
      <span>{message}</span>
    </div>
  )
}

function ForumReplies({
  notes, displayMode, contentField, bottomElRef,
}) {
  return (
    <div className="notes-container">
      {notes.map(replyNote => (
        <div key={replyNote.id} className="message">
          <div className="img">OR</div>
          <h4>
            {prettyId(replyNote.signatures[0], true)}
            {' '}
            <span>{forumDate(replyNote.cdate, replyNote.tcdate, replyNote.mdate)}</span>
          </h4>
          <MessageContent content={replyNote.content[contentField]} />
        </div>
      ))}
      <div className="spacer" ref={bottomElRef}>{' '}</div>
    </div>
  )
}

function MessageContent({ content = '' }) {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    setSanitizedHtml(DOMPurify.sanitize(marked(content)))
  }, [])

  return (
    // eslint-disable-next-line react/no-danger
    <div className="message-content markdown-rendered" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  )
}

function SubmitForm({ user, contentField, postNote }) {
  const submitForm = (e) => {
    e.preventDefault()
    const message = document.getElementById('note-content').value
    const signature = document.getElementById('note-signature').value
    postNote({ [contentField]: message }, signature)
      .catch((error) => {
        console.log(error)
      })
  }

  return (
    <div className="submit-container">
      <form className="form-inline" onSubmit={submitForm}>
        <div className="form-group">
          <label htmlFor="note-content">
            {upperFirst(contentField)}
            :
          </label>
          <textarea id="note-content" className="form-control" rows="2" placeholder="Enter your message" />
        </div>
        <div className="form-group">
          <label htmlFor="note-signature">
            Posting as:
          </label>
          <select id="note-signature" className="form-control">
            {user.usernames.map(username => (
              <option key={username} value={username}>{prettyId(username)}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Post</button>
      </form>
    </div>
  )
}
