/* globals DOMPurify: false */
/* globals marked: false */

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import truncate from 'lodash/truncate'
import upperFirst from 'lodash/upperFirst'
import LoadingSpinner from '../../components/LoadingSpinner'
import Icon from '../../components/Icon'
import useQuery from '../../hooks/useQuery'
import useInterval from '../../hooks/useInterval'
import { prettyId, forumDate } from '../../lib/utils'
import api from '../../lib/api-client'

export default function EmbeddedForum({ appContext, userContext }) {
  const [forumNote, setForumNote] = useState(null)
  const [displayMode, setDisplayMode] = useState('linear')
  const [filters, setFilters] = useState([])
  const [timeoutId, setTimeoutId] = useState(null)
  const [error, setError] = useState(null)
  const query = useQuery()
  const router = useRouter()
  const { clientJsLoading } = appContext
  const { user, accessToken, loginUserWithToken } = userContext

  const loadForumNote = async (forumId) => {
    try {
      const { notes } = await api.get('/notes', { id: forumId }, { accessToken })
      if (notes?.length > 0) {
        const noteCopy = notes[0]
        noteCopy.content.truncatedTitle = truncate(noteCopy.content.title, {
          length: 70,
          separator: /,? +/,
        })
        noteCopy.content.truncatedAbstract = truncate(
          noteCopy.content['TL;DR'] || noteCopy.content.abstract,
          { length: 200, separator: /,? +/ }
        )
        setForumNote(noteCopy)
      } else {
        setError(`Could not load forum. Forum ${forumId} not found.`)
      }
    } catch (apiError) {
      setError(`Could not load forum. Error fetching forum ${forumId}.`)
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
    return api.post('/notes/edits', note, { accessToken })
  }

  useEffect(() => {
    // Handle window.postMessage events, including commands sent from the parent frame
    const handleWindowMessage = (event) => {
      const message = event.data ?? {}

      if (message.command === 'login') {
        loginUserWithToken(message.token, false)
      }
    }

    window.addEventListener('message', handleWindowMessage, false)
    window.parent.postMessage({ ready: true }, '*')
    return () => {
      window.removeEventListener('message', handleWindowMessage)
    }
  }, [])

  useEffect(() => {
    // If auto-login doesn't work, redirect user to login page after 5 seconds
    const timer = setTimeout(() => {
      router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
    }, 5000)
    setTimeoutId(timer)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!user || !query || clientJsLoading) return

    // User is logged in so cancel the redirect
    clearTimeout(timeoutId)

    // Check required query params
    if (!query.id) {
      setError('Could not load forum. Missing forum ID.')
      return
    }
    if (!query.invitation) {
      setError('Could not load forum. Missing invitation ID.')
      return
    }

    loadForumNote(query.id)

    // Set display params and filters
    if (['linear', 'threaded', 'nested'].includes(query.display)) {
      setDisplayMode(query.display)
    }
  }, [user, query, clientJsLoading])

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title key="title">{`${forumNote?.content.title || 'Forum'} | OpenReview`}</title>
        <meta
          name="description"
          content={forumNote?.content['TL;DR'] || forumNote?.content.abstract || ''}
        />

        <meta property="og:title" key="og:title" content={forumNote?.content.truncatedTitle} />
        <meta
          property="og:description"
          key="og:description"
          content={forumNote?.content.truncatedAbstract}
        />
        <meta
          property="og:image"
          key="og:image"
          content="https://openreview.net/images/openreview_logo_512.png"
        />
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
        ) : forumNote && user ? (
          <>
            <ForumReplies
              forumNote={forumNote}
              invitationId={query.invitation}
              contentField={query.content}
              accessToken={accessToken}
              filters={filters}
              displayMode={displayMode}
            />
            <SubmitForm
              user={user.profile}
              contentField={query.content || 'message'}
              postNote={postNote}
            />
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

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
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
      <Icon name="exclamation-sign" /> <span>{message}</span>
    </div>
  )
}

const updateInterval = 1000

// Define stateless fetcher function outside the component scope so it isn't redeclared
// every render
function fetchNotes(url, forum, invitation, userAccessToken, initialFetch) {
  const query = {
    forum,
    invitation,
    trash: true,
    details: 'replyCount,writable,revisions,original,overwriting,invitation,tags',
    sort: 'cdate:asc',
  }
  if (!initialFetch) {
    query.mintcdate = Date.now() - updateInterval
  }

  return api.get(url, query, { accessToken: userAccessToken }).then(({ notes }) => {
    if (notes?.length > 0) {
      return initialFetch ? notes.filter((note) => note.id !== note.forum) : notes
    }
    return []
  })
}

function ForumReplies({
  forumId,
  invitationId,
  contentField = 'message',
  accessToken,
  filters,
  displayMode,
}) {
  const [replyNotes, setReplyNotes] = useState(null)
  const bottomElRef = useRef()

  const { data, error } = useSWR(
    ['/notes', forumId, invitationId, accessToken, true],
    fetchNotes,
    {
      onSuccess: (noteData) => {
        setReplyNotes(noteData)
        setTimeout(() => {
          document.documentElement.scrollTop = bottomElRef.current.offsetTop
        }, 20)
      },
    }
  )

  useInterval(() => {
    if (!data) return

    fetchNotes('/notes', forumId, invitationId, accessToken, false).then((notes) => {
      if (notes.length) {
        setReplyNotes([...replyNotes, ...notes])
      }
    })
  }, updateInterval)

  if (!replyNotes) {
    return <LoadingSpinner />
  }

  return (
    <div className="notes-container">
      {replyNotes &&
        replyNotes.map((replyNote) => (
          <div key={replyNote.id} className="message">
            <div className="img">OR</div>
            <h4>
              {prettyId(replyNote.signatures[0], true)}{' '}
              <span>{forumDate(replyNote.cdate, replyNote.tcdate, replyNote.mdate)}</span>
            </h4>
            <MessageContent content={replyNote.content[contentField]} />
          </div>
        ))}
      {error && <ErrorMessage message={error.message} />}
      <div className="spacer" ref={bottomElRef}>
        {' '}
      </div>
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
    <div
      className="message-content markdown-rendered"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

function SubmitForm({ user, contentField, postNote }) {
  const [selectedSignature, setSelectedSignature] = useState(user.usernames[0])

  const submitForm = async (e) => {
    e.preventDefault()
    const form = e.target
    const message = document.getElementById('note-content').value
    const signature = document.getElementById('note-signature').value

    try {
      await postNote({ [contentField]: message }, signature)
      form.reset()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    }
  }

  return (
    <div className="submit-container message">
      <form className="form-inline" onSubmit={submitForm}>
        <div className="img">OR</div>
        <h4>
          {prettyId(selectedSignature, true)}{' '}
          <span>
            <a>change</a>
          </span>
        </h4>
        <div className="form-group" style={{ display: 'none' }}>
          <select id="note-signature" className="form-control">
            {user.usernames.map((username) => (
              <option key={username} value={username}>
                {prettyId(username)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <textarea
            id="note-content"
            className="form-control"
            rows="2"
            placeholder="Enter your message"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Post
        </button>
      </form>
    </div>
  )
}
