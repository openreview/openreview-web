/* globals $: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import truncate from 'lodash/truncate'
import has from 'lodash/has'
import isEmpty from 'lodash/isEmpty'
import union from 'lodash/union'
import ForumNote from '../components/forum/ForumNote'
import NoteEditorForm from '../components/NoteEditorForm'
import FilterForm from '../components/forum/FilterForm'
import FilterTabs from '../components/forum/FilterTabs'
import ForumReply from '../components/ForumReply'
import LoadingSpinner from '../components/LoadingSpinner'
import ForumReplyContext from '../components/ForumReplyContext'
import withError from '../components/withError'
import useUser from '../hooks/useUser'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { prettyInvitationId, getConferenceName } from '../lib/utils'
import { formatNote, parseFilterQuery, replaceFilterWildcards } from '../lib/forum-utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

// Page Styles
import '../styles/pages/forum-new.less'

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
  const [forumInvitations, setForumInvitations] = useState(null)
  const [activeInvitation, setActiveInvitation] = useState(null)
  const router = useRouter()
  const query = useQuery()

  const { setBannerContent, clientJsLoading } = appContext
  const { id, content, details } = forumNote
  const { replyForumViews } = details.invitation
  const repliesLoaded = replyNoteMap && displayOptionsMap && orderedReplies

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

  // API helper functions
  const getInvitationsByReplyForum = (forumId, includeTags) => {
    if (!forumId) return Promise.resolve([])

    const extraParams = includeTags ? { tags: true } : { details: 'repliedNotes' }
    return api.get('/invitations', { replyForum: forumId, ...extraParams }, { accessToken })
      .then(({ invitations }) => (invitations?.length > 0 ? invitations : []))
  }

  const getNotesByForumId = (forumId) => {
    if (!forumId) return Promise.resolve([])

    return api.get('/notes', {
      forum: forumId,
      details: 'writable,revisions,original,overwriting,invitation,tags',
    }, { accessToken })
      .then(({ notes }) => (notes?.length > 0 ? notes : []))
  }

  const loadNotesAndInvitations = async () => {
    const [notes, invitations, originalInvitations, tagInvitations] = await Promise.all([
      getNotesByForumId(id),
      getInvitationsByReplyForum(id),
      getInvitationsByReplyForum(details.original?.id),
      getInvitationsByReplyForum(id, true),
    ])

    const commonInvitations = invitations.filter((invitation) => {
      const invReply = invitation.reply
      return !invReply.replyto && !invReply.referent && !invReply.referentInvitation && !invReply.invitation
    })
    const referenceInvitations = invitations.filter((invitation) => {
      // Check if invitation is replying to this note
      const isInvitationRelated = invitation.reply.referent === id
        || invitation.reply.referentInvitation === forumNote.invitation
      // Check if invitation does not have multiReply OR invitation has the
      // field multiReply but it is not false OR invitation has the field multireply
      // which is set to false but there have not been any replies yet
      const isMultireplyApplicable = invitation.multiReply === undefined
        || invitation.multiReply !== false
        || isEmpty(invitation.details?.repliedNotes)
      return isInvitationRelated && isMultireplyApplicable
    })
    setForumInvitations({
      commonInvitations, referenceInvitations, originalInvitations, tagInvitations,
    })

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

      const noteInvitations = invitations.filter((invitation) => {
        // Check if invitation is replying to this note
        const isInvitationRelated = invitation.reply.replyto === note.id
          || invitation.reply.invitation === note.invitation
        // Check if invitation does not have multiReply OR invitation has the field
        // multiReply but it is not set to false OR invitation has the field multireply
        // which is set to false but there have not been any replies yet
        const isMultireplyApplicable = !has(invitation, 'multiReply')
          || (invitation.multiReply !== false)
          || !has(invitation, 'details.repliedNotes[0]')
        return isInvitationRelated && isMultireplyApplicable
      })

      const refInvitations = invitations.filter((invitation) => {
        // Check if invitation is replying to this note
        const isInvitationRelated = invitation.reply.referent === note.id
          || invitation.reply.referentInvitation === note.invitation
        // Check if invitation does not have multiReply OR invitation has the field
        // multiReply but it is not set to false OR invitation has the field multireply
        // which is set to false but there have not been any replies yet
        const isMultireplyApplicable = !has(invitation, 'multiReply')
          || (invitation.multiReply !== false)
          || !has(invitation, 'details.repliedNotes[0]')
        return isInvitationRelated && isMultireplyApplicable
      })

      const noteCommonInvitations = commonInvitations.filter(invitation => (
        has(invitation.reply, 'invitation')
          ? invitation.reply.invitation === note.invitation
          : note.id === invitation.reply.forum
      ))

      const replyInvitations = union(noteCommonInvitations, noteInvitations)

      replyMap[note.id] = formatNote(note, null, replyInvitations, refInvitations)
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

  // Display helper functions
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

  const scrollToElement = (selector) => {
    const el = document.getElementById(selector)
    if (!el) return

    const navBarHeight = 63
    const y = el.getBoundingClientRect().top + window.pageYOffset - navBarHeight

    // TODO: provide alternate scroll for IE11
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const openNoteEditor = (invitation) => {
    if (activeInvitation && activeInvitation.id !== invitation.id) {
      promptError(
        'There is currently another editor pane open on the page. Please submit your changes or click Cancel before continuing',
        { scrollToTop: false },
      )
    } else {
      setActiveInvitation(activeInvitation ? null : invitation)
    }
  }

  const addTopLevelReply = (note) => {
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

    scrollToElement('#forum-replies')
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
    if (userLoading || clientJsLoading) return

    loadNotesAndInvitations()
  }, [userLoading])

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

  // Update sort order
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

      <ForumNote
        note={forumNote}
        referenceInvitations={forumInvitations?.referenceInvitations}
        originalInvitations={forumInvitations?.originalInvitations}
        tagInvitations={forumInvitations?.tagInvitations}
      />

      {repliesLoaded && (
        <div className="filters-container mt-3">
          {replyForumViews && (
            <FilterTabs forumViews={replyForumViews} />
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
      )}

      {forumInvitations && (
        <div className="invitations-container mt-3">
          <div className="invitation-buttons">
            <span className="hint">Add:</span>
            {forumInvitations.commonInvitations.map(invitation => (
              <button
                key={invitation.id}
                type="button"
                className={`btn btn-xs ${activeInvitation?.id === invitation.id ? 'active' : ''}`}
                onClick={() => openNoteEditor(invitation)}
              >
                {prettyInvitationId(invitation.id)}
              </button>
            ))}
          </div>

          <NoteEditorForm
            forumId={id}
            invitation={activeInvitation}
            onNoteCreated={addTopLevelReply}
            onNoteCancelled={() => { setActiveInvitation(null) }}
            onError={() => { setActiveInvitation(null) }}
          />

          <hr />
        </div>
      )}

      <div className="row mt-3">
        <div className="col-md-10">
          <div id="forum-replies">
            <ForumReplyContext.Provider
              value={{
                forumId: id, displayOptionsMap, setCollapsed, setContentExpanded,
              }}
            >
              {repliesLoaded ? orderedReplies.map(reply => (
                <ForumReply
                  key={reply.id}
                  note={replyNoteMap[reply.id]}
                  replies={reply.replies.map(childId => replyNoteMap[childId])}
                  commonInvitations={forumInvitations?.commonInvitations}
                  activeInvitation={activeInvitation}
                  setActiveInvitation={setActiveInvitation}
                />
              )) : (
                <LoadingSpinner inline />
              )}
            </ForumReplyContext.Provider>
          </div>
        </div>

        <div className="col-md-2">
          {/* <FilterFormVertical /> */}
        </div>
      </div>
    </div>
  )
}

Forum.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Forum ID is required' }
  }

  const { token } = auth(ctx)

  const shouldRedirect = async (noteId) => {
    // Check if user is accessing the original of a blind submission and if so return blind note
    const { notes } = await api.get('/notes', { original: noteId }, { accessToken: token })

    if (notes?.length > 0) {
      return notes[0]
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
    const { notes } = await api.get('/notes', {
      id: ctx.query.id, trash: true, details: 'original,invitation,revisions,replyCount,writable,tags',
    }, { accessToken: token })

    const note = notes?.length > 0 ? notes[0] : null

    // Only super user can see deleted forums
    if (!note || (note.ddate && !note.details.writable)) {
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
