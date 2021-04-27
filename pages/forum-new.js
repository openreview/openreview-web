/* globals $: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import truncate from 'lodash/truncate'
import LoadingSpinner from '../components/LoadingSpinner'
import ForumReply from '../components/ForumReply'
import NoteAuthors from '../components/NoteAuthors'
import Icon from '../components/Icon'
import NoteContent from '../components/NoteContent'
import NoteEditorForm from '../components/NoteEditorForm'
import withError from '../components/withError'
import FilterForm from '../components/forum/FilterForm'
import ForumReplyContext from '../components/ForumReplyContext'
import useUser from '../hooks/useUser'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import {
  prettyId, prettyInvitationId, forumDate, getConferenceName,
} from '../lib/utils'
import { formatNote, parseFilterQuery, replaceFilterWildcards } from '../lib/forum-utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

// Page Styles
import '../styles/pages/forum-new.less'

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
      <Icon name="calendar" />
      {forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year)}
    </span>

    <span className="item">
      <Icon name="folder-open" />
      {note.content.venue || prettyId(note.invitation)}
    </span>

    {note.readers && (
      <span className="item readers" data-toggle="tooltip" data-placement="top" title={`Visible to ${note.readers.join(', ')}`}>
        <Icon name="eye-open" />
        {note.readers.map(reader => prettyId(reader, true)).join(', ')}
      </span>
    )}

    {/* eslint-disable-next-line no-underscore-dangle */}
    {note.content._bibtex && (
      <span className="item">
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href="#"
          data-target="#bibtex-modal"
          data-toggle="modal"
          // eslint-disable-next-line no-underscore-dangle
          data-bibtex={encodeURIComponent(note.content._bibtex)}
        >
          Show Bibtex
        </a>
      </span>
    )}

    {note.details.revisions && (
      <span className="item">
        <Link href={`/revisions?id=${note.id}`}>
          <a>Show Revisions</a>
        </Link>
      </span>
    )}
  </div>
)

const ForumReplyCount = () => (
  <div className="reply-container" />
)

const Forum = ({ forumNote, appContext }) => {
  const { userLoading, accessToken } = useUser()
  const [replyNoteMap, setReplyNoteMap] = useState(null)
  const [parentMap, setParentMap] = useState(null)
  const [displayOptionsMap, setDisplayOptionsMap] = useState(null)
  const [orderedReplies, setOrderedReplies] = useState(null)
  const [layout, setLayout] = useState(1)
  const [sort, setSort] = useState('date-desc')
  const [filterOptions, setFilterOptions] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({
    invitations: null, signatures: null, keywords: null, readers: null, excludedReaders: null,
  })
  const [commonInvitations, setCommonInvitations] = useState(null)
  const [activeInvitation, setActiveInvitation] = useState(null)
  const router = useRouter()
  const query = useQuery()

  const { setBannerContent, clientJsLoading } = appContext
  const { id, content, details } = forumNote
  const { replyForumViews } = details.invitation

  const truncatedTitle = truncate(content.title, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(content['TL;DR'] || content.abstract, { length: 200, separator: /,? +/ })
  const authors = (Array.isArray(content.authors) || typeof content.authors === 'string')
    ? [content.authors].flat()
    : []
  const creationDate = new Date(forumNote.cdate || forumNote.tcdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  const modificationDate = new Date(forumNote.tmdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  // eslint-disable-next-line no-underscore-dangle
  const conferenceName = getConferenceName(content._bibtex)

  const numRepliesHidden = displayOptionsMap
    ? Object.values(displayOptionsMap).reduce((count, opt) => count + ((opt.hidden || opt.collapsed) ? 1 : 0), 0)
    : 0

  const loadReplies = async () => {
    const { notes } = await api.get('/notes', {
      forum: id, details: 'writable,revisions,original,overwriting,invitation,tags',
    }, { accessToken })

    if (!notes || notes.length === 0) {
      setReplyNoteMap({})
      return
    }

    const replyMap = {}
    const displayOptions = {}
    const parentIdMap = {}
    const invitationIds = new Set()
    const signatureGroupIds = new Set()
    const readerGroupIds = new Set()
    const numberWildcard = /(Reviewer|Area_Chair)(\d+)/g
    notes.forEach((note) => {
      // Don't include forum note
      if (note.id === note.forum) return

      replyMap[note.id] = formatNote(note)
      displayOptions[note.id] = { collapsed: false, contentExpanded: false, hidden: false }

      const parentId = note.replyto || id
      if (!parentIdMap[parentId]) {
        parentIdMap[parentId] = []
      }
      parentIdMap[parentId].push(note.id)

      // Populate filter options
      invitationIds.add(note.invitation.replace(numberWildcard, '$1.*'))
      signatureGroupIds.add(note.signatures[0])
      note.readers.forEach(rId => readerGroupIds.add(rId))
    })

    setReplyNoteMap(replyMap)
    setDisplayOptionsMap(displayOptions)
    setParentMap(parentIdMap)
    setFilterOptions({
      invitations: Array.from(invitationIds),
      signatures: Array.from(signatureGroupIds),
      readers: Array.from(readerGroupIds),
    })
  }

  const loadInvitations = async () => {
    const { invitations } = await api.get('/invitations', {
      replyForum: id, details: 'repliedNotes',
    }, { accessToken })

    if (invitations?.length > 0) {
      const sharedInvitations = invitations.filter((invitation) => {
        const invReply = invitation.reply
        return !invReply.replyto && !invReply.referent && !invReply.referentInvitation && !invReply.invitation
      })
      setCommonInvitations(sharedInvitations)
    } else {
      setCommonInvitations([])
    }
  }

  const setCollapseLevel = (level) => {
    const newDisplayOptions = {}
    Object.keys(displayOptionsMap).forEach((noteId) => {
      newDisplayOptions[noteId] = {
        ...displayOptionsMap[noteId],
        collapsed: level === 0,
        contentExpanded: level === 2,
      }
    })
    setDisplayOptionsMap(newDisplayOptions)
  }

  const setCollapsed = (noteId, newCollapsed) => {
    setDisplayOptionsMap({
      ...displayOptionsMap,
      [noteId]: {
        ...displayOptionsMap[noteId],
        collapsed: newCollapsed,
      },
    })
  }

  const setHidden = (noteId, newHidden) => {
    setDisplayOptionsMap({
      ...displayOptionsMap,
      [noteId]: {
        ...displayOptionsMap[noteId],
        hidden: newHidden,
      },
    })
  }

  const setContentExpanded = (noteId, newContentExpanded) => {
    setDisplayOptionsMap({
      ...displayOptionsMap,
      [noteId]: {
        ...displayOptionsMap[noteId],
        hidden: newContentExpanded,
      },
    })
  }

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
  }, [forumNote, query])

  // Handle url hash changes
  useEffect(() => {
    const handleRouteChange = (url) => {
      const [_, tabId] = url.split('#')
      if (!tabId || !replyForumViews) return

      const tab = replyForumViews.find(view => view.id === tabId)
      if (!tab) return

      setSelectedFilters({
        invitations: null,
        signatures: null,
        readers: null,
        excludedReaders: null,
        keywords: null,
        ...parseFilterQuery(replaceFilterWildcards(tab.filter, forumNote), tab.keywords),
      })
      if (tab.layout) {
        setLayout(tab.layout)
      }
      if (tab.sort) {
        setSort(tab.sort)
      }
    }

    if (window.location.hash) {
      handleRouteChange(window.location.hash)
    }

    router.events.on('hashChangeComplete', handleRouteChange)
    return () => {
      router.events.off('hashChangeComplete', handleRouteChange)
    }
  }, [])

  // Load forum replies
  useEffect(() => {
    if (userLoading) return

    loadReplies()
    loadInvitations()
  }, [userLoading, accessToken])

  // Update forum layout
  useEffect(() => {
    if (!replyNoteMap || !parentMap) return

    const leastRecentComp = (a, b) => replyNoteMap[a].cdate - replyNoteMap[b].cdate
    const mostRecentComp = (a, b) => replyNoteMap[b].cdate - replyNoteMap[a].cdate

    const selectedSortFn = sort === 'date-desc' ? mostRecentComp : leastRecentComp

    let orderedNotes = []
    if (layout === 0) {
      // Linear view
      orderedNotes = Object.keys(replyNoteMap).sort(selectedSortFn).map(noteId => ({
        id: noteId,
        replies: [],
      }))
    } else if (layout === 1 || layout === 2) {
      // Threaded view
      // TODO: Nested view
      const getAllReplies = (noteId) => {
        if (!parentMap[noteId]) return []
        return parentMap[noteId].reduce((replies, childId) => replies.concat(childId, getAllReplies(childId)), [])
      }

      orderedNotes = (parentMap[id] ?? []).sort(selectedSortFn).map(noteId => ({
        id: noteId,
        replies: getAllReplies(noteId).sort(leastRecentComp),
      }))
    }
    setOrderedReplies(orderedNotes)

    setTimeout(() => {
      typesetMathJax()
      $('[data-toggle="tooltip"]').tooltip()
    }, 200)
  }, [replyNoteMap, parentMap, layout])

  // Update reply visibility
  useEffect(() => {
    if (!replyNoteMap || !orderedReplies || !displayOptionsMap) return

    const newDisplayOptions = {}
    const checkGroupMatch = (groupId, replyGroup) => {
      if (groupId.includes('.*')) {
        return (new RegExp(groupId)).test(replyGroup)
      }
      return groupId === replyGroup
    }
    const checkSignaturesMatch = (selectedSignatures, replySignature) => (
      selectedSignatures.some(sig => checkGroupMatch(sig, replySignature))
    )
    const checkReadersMatch = (selectedReaders, replyReaders) => (
      selectedReaders.every(reader => replyReaders.some(replyReader => checkGroupMatch(reader, replyReader)))
    )
    const checkExReadersMatch = (selectedReaders, replyReaders) => (
      selectedReaders.some(reader => replyReaders.some(replyReader => checkGroupMatch(reader, replyReader)))
    )

    Object.values(replyNoteMap).forEach((note) => {
      const isVisible = (
        (!selectedFilters.invitations || selectedFilters.invitations.includes(note.invitation))
        && (!selectedFilters.signatures || checkSignaturesMatch(selectedFilters.signatures, note.signatures[0]))
        && (!selectedFilters.keywords || note.searchText.includes(selectedFilters.keywords[0]))
        && (!selectedFilters.readers || checkReadersMatch(selectedFilters.readers, note.readers))
        && (!selectedFilters.excludedReaders || !checkExReadersMatch(selectedFilters.excludedReaders, note.readers))
      )
      const currentOptions = displayOptionsMap[note.id]
      newDisplayOptions[note.id] = {
        ...currentOptions,
        hidden: !isVisible,
        collapsed: !isVisible,
      }
    })

    orderedReplies.forEach((note) => {
      const { hidden } = newDisplayOptions[note.id]
      const someChildrenVisible = note.replies.some(childId => !newDisplayOptions[childId].hidden)
      if (hidden && someChildrenVisible) {
        newDisplayOptions[note.id].hidden = false
        newDisplayOptions[note.id].collapsed = true
      }
    })
    setDisplayOptionsMap(newDisplayOptions)

    setTimeout(() => {
      typesetMathJax()
      $('[data-toggle="tooltip"]').tooltip()
    }, 200)
  }, [replyNoteMap, orderedReplies, selectedFilters])

  useEffect(() => {
    if (!replyNoteMap || !orderedReplies || !sort) return

    const sortMap = {
      'date-asc': (a, b) => replyNoteMap[a.id].cdate - replyNoteMap[b.id].cdate,
      'date-desc': (a, b) => replyNoteMap[b.id].cdate - replyNoteMap[a.id].cdate,
    }

    if (!sortMap[sort]) return

    setOrderedReplies([...orderedReplies].sort(sortMap[sort]))
  }, [replyNoteMap, sort])

  // Update filters
  useEffect(() => {
    if (!query) return

    if (query.filter || query.search) {
      const startFilters = parseFilterQuery(query.filter, query.search)
      setSelectedFilters({ ...selectedFilters, ...startFilters })
    }

    if (query.sort) {
      setSort(query.sort)
    }

    const layoutCode = parseInt(query.layout, 10)
    if (layoutCode) {
      setLayout(layoutCode)
    }
  }, [query])

  return (
    <div className="forum-container">
      <Head>
        <title key="title">{`${content.title || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={content['TL;DR'] || content.abstract || ''} />

        <meta property="og:title" key="og:title" content={truncatedTitle} />
        <meta property="og:description" key="og:description" content={truncatedAbstract} />
        <meta property="og:type" key="og:type" content="article" />

        {/* For more information on required meta tags for Google Scholar see: */}
        {/* https://scholar.google.com/intl/en/scholar/inclusion.html#indexing */}
        {forumNote.invitation.startsWith(`${process.env.SUPER_USER}`) ? (
          <meta name="robots" content="noindex" />
        ) : (
          <>
            {content.title && (
              <meta name="citation_title" content={content.title} />
            )}
            {/*
            {authors.map(author => (
              <meta key={author} name="citation_author" content={author} />
            ))}
            */}
            {/* temporary hack to get google scholar to work, revert to above code when Next.js issue is solved */}
            <meta name="citation_authors" content={authors.join('; ')} />
            <meta name="citation_publication_date" content={creationDate} />
            <meta name="citation_online_date" content={modificationDate} />
            {content.pdf && (
              <meta name="citation_pdf_url" content={`https://openreview.net/pdf?id=${id}`} />
            )}
            {conferenceName && (
              <meta name="citation_conference_title" content={conferenceName} />
            )}
          </>
        )}
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

        <ForumReplyCount />
      </div>

      <div className="reply-actions">
        <div className="reply-actions-buttons clearfix">
          {commonInvitations && commonInvitations.map(invitation => (
            <button
              key={invitation.id}
              type="button"
              className="btn btn-xs"
              onClick={() => {
                if (activeInvitation && activeInvitation.id !== invitation.id) {
                  promptError(
                    'You currently have another editor pane open on this page. Please submit your changes or click Cancel before continuing',
                    { scrollToTop: false },
                  )
                } else {
                  setActiveInvitation(activeInvitation ? null : invitation)
                }
              }}
            >
              {prettyInvitationId(invitation.id)}
            </button>
          ))}
        </div>

        <NoteEditorForm
          forumId={id}
          invitation={activeInvitation}
          onNoteCreated={(note) => {
            setActiveInvitation(null)
            setReplyNoteMap({ ...replyNoteMap, [note.id]: formatNote(note, activeInvitation) })
            setDisplayOptionsMap({
              ...displayOptionsMap,
              [note.id]: { collapsed: false, contentExpanded: false, hidden: false },
            })
            setParentMap({
              ...parentMap,
              [id]: [...parentMap[id], note.id],
            })
            // TODO: figure out better scroll method
            document.getElementById('note-children').scrollIntoView({ behavior: 'smooth' })
          }}
          onNoteCancelled={() => { setActiveInvitation(null) }}
          onError={() => { setActiveInvitation(null) }}
        />
      </div>

      {(!replyForumViews || !replyNoteMap) && (
        <hr />
      )}

      <div className="row">
        <div className="col-xs-12">
          {replyForumViews && replyNoteMap && (
            <ul className="nav nav-tabs filter-tabs">
              {replyForumViews.map(view => (
                <li key={view.id} role="presentation" className={window.location.hash.slice(1) === view.id ? 'active' : ''}>
                  <Link href={`?id=${id}#${view.id}`} shallow><a>{view.label}</a></Link>
                </li>
              ))}
            </ul>
          )}

          {filterOptions && (
            <FilterForm
              forumId={id}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              filterOptions={filterOptions}
              sort={sort}
              setSort={setSort}
              layout={layout}
              setLayout={setLayout}
              setCollapseLevel={setCollapseLevel}
              numReplies={details.replyCount}
              numRepliesHidden={numRepliesHidden}
            />
          )}
        </div>
      </div>

      <div className="row">
        <ForumReplyContext.Provider
          value={{
            forumId: id, displayOptionsMap, setCollapsed, setHidden, setContentExpanded,
          }}
        >
          <div id="note-children" className="col-md-9">
            {(replyNoteMap && displayOptionsMap && orderedReplies) ? orderedReplies.map(reply => (
              <ForumReply
                key={reply.id}
                note={replyNoteMap[reply.id]}
                replies={reply.replies.map(childId => replyNoteMap[childId])}
              />
            )) : (
              <LoadingSpinner inline />
            )}
          </div>

          <div className="col-md-3">
            {/*
            <aside className="filters">
              <form className="form-horizontal">
                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Sort:</label>
                  <div className="col-sm-9">
                    <select className="form-control">
                      <option>Most Recent</option>
                      <option>Most Tagged</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Type:</label>
                  <div className="col-sm-9">
                    <select className="form-control">
                      <option>All</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Author:</label>
                  <div className="col-sm-9">
                    <select className="form-control">
                      <option>All</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Tag:</label>
                  <div className="col-sm-9">
                    <select className="form-control" disabled>
                      <option> </option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="keyword-input" className="col-sm-3 control-label">Search:</label>
                  <div className="col-sm-9">
                    <input type="text" className="form-control" id="keyword-input" placeholder="Keywords" />
                  </div>
                </div>
              </form>
            </aside>
            */}
          </div>
        </ForumReplyContext.Provider>
      </div>
    </div>
  )
}

Forum.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Forum ID is required' }
  }

  const { user, token } = auth(ctx)
  const shouldRedirect = async (noteId) => {
    // if it is the original of a blind submission, do redirection
    const blindNotesResult = await api.get('/notes', { original: noteId }, { accessToken: token })

    // if no blind submission found return the current forum
    if (blindNotesResult.notes?.length) {
      return blindNotesResult.notes[0]
    }

    return false
  }
  const redirectForum = (forumId) => {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: `/forum?id=${encodeURIComponent(forumId)}` }).end()
    } else {
      Router.replace(`/forum?id=${forumId}`)
    }
    return {}
  }

  try {
    const result = await api.get('/notes', {
      id: ctx.query.id, trash: true, details: 'original,invitation,revisions,replyCount,writable',
    }, { accessToken: token })
    const note = result.notes[0]

    // Only super user can see deleted forums
    if (note.ddate && !note.details.writable) {
      return { statusCode: 404, message: 'Not Found' }
    }

    // if blind submission return the forum
    if (note.original) {
      return { forumNote: note }
    }

    const redirect = await shouldRedirect(note.id)
    if (redirect) {
      return redirectForum(redirect.id)
    }
    return { forumNote: note }
  } catch (error) {
    if (error.name === 'forbidden' || error.name === 'ForbiddenError') {
      const redirect = await shouldRedirect(ctx.query.id)
      if (redirect) {
        return redirectForum(redirect.id)
      }

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
    return { statusCode: error.status || 500, message: error.message }
  }
}

Forum.bodyClass = 'forum'

export default withError(Forum)
