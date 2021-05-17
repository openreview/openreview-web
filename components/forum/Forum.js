/* globals $: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import has from 'lodash/has'
import isEmpty from 'lodash/isEmpty'
import union from 'lodash/union'

import ForumNote from './ForumNote'
import NoteEditorForm from '../NoteEditorForm'
import FilterForm from './FilterForm'
import FilterTabs from './FilterTabs'
import ForumReply from './ForumReply'
import LoadingSpinner from '../LoadingSpinner'
import ForumReplyContext from './ForumReplyContext'

import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyInvitationId } from '../../lib/utils'
import { formatNote, parseFilterQuery, replaceFilterWildcards } from '../../lib/forum-utils'

// Component Styles
import '../../styles/components/forum.less'

export default function Forum({ forumNote, clientJsLoading }) {
  const { userLoading, accessToken } = useUser()
  const [parentNote, setParentNote] = useState(forumNote)
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

  const { id, details } = parentNote
  const replyForumViews = details.invitation?.replyForumViews
  const repliesLoaded = replyNoteMap && displayOptionsMap && orderedReplies

  const numRepliesHidden = displayOptionsMap
    ? Object.values(displayOptionsMap).reduce((count, opt) => count + ((opt.hidden || opt.collapsed) ? 1 : 0), 0)
    : 0

  // API helper functions
  const getInvitationsByReplyForum = (forumId, includeTags) => {
    if (!forumId) return Promise.resolve([])

    const extraParams = includeTags ? { tags: true } : { details: 'repliedNotes' }
    return api.get('/invitations', { replyForum: forumId, ...extraParams }, { accessToken })
      .then(({ invitations }) => {
        if (!invitations?.length) return []

        return invitations.map((inv) => {
          // Check if invitation does not have multiReply prop OR invitation is set to multiReply
          // but it is not false OR there have not been any replies to the invitation yet
          const repliesAvailable = !has(inv, 'multiReply')
            || inv.multiReply !== false
            || isEmpty(inv.details?.repliedNotes)
          return {
            ...inv,
            process: null,
            details: { repliesAvailable },
          }
        })
      })
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

    // Process invitations
    const commonInvitations = invitations.filter((invitation) => {
      const invReply = invitation.reply
      return !invReply.replyto && !invReply.referent && !invReply.referentInvitation && !invReply.invitation
    })

    const referenceInvitations = invitations.filter((invitation) => {
      // Check if invitation is replying to this note
      const isInvitationRelated = invitation.reply.referent === id
        || invitation.reply.referentInvitation === parentNote.invitation
      return isInvitationRelated && invitation.details.repliesAvailable
    })

    setForumInvitations({
      commonInvitations, referenceInvitations, originalInvitations, tagInvitations,
    })

    // Process notes
    const replyMap = {}
    const displayOptions = {}
    const parentIdMap = {}
    const invitationIds = new Set()
    const signatureGroupIds = new Set()
    const readerGroupIds = new Set()
    const numberWildcard = /(Reviewer|Area_Chair)(\d+)/g
    notes.forEach((note) => {
      // Don't include forum note
      if (note.id === note.forum) {
        setParentNote({ ...note, details: { ...parentNote.details, ...note.details } })
        return
      }

      const noteInvitations = invitations.filter((invitation) => {
        // Check if invitation is replying to this note
        const isInvitationRelated = invitation.reply.replyto === note.id
          || invitation.reply.invitation === note.invitation
        return isInvitationRelated && invitation.details.repliesAvailable
      })

      const replyInvitations = union(commonInvitations, noteInvitations)

      const refInvitations = invitations.filter((invitation) => {
        // Check if invitation is replying to this note
        const isInvitationRelated = invitation.reply.referent === note.id
          || invitation.reply.referentInvitation === note.invitation
        return isInvitationRelated && invitation.details.repliesAvailable
      })

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

  const updateReplyNote = (newNote, parentId) => {
    const noteId = newNote.id
    const currentNote = replyNoteMap[noteId] ?? {}
    setReplyNoteMap({
      ...replyNoteMap,
      [noteId]: formatNote({
        ...currentNote,
        ...newNote,
      }),
    })

    if (isEmpty(currentNote)) {
      setDisplayOptionsMap({
        ...displayOptionsMap,
        [noteId]: { collapsed: false, contentExpanded: false, hidden: false },
      })
      setParentMap({
        ...parentMap,
        [parentId]: parentMap[parentId] ? [...parentMap[parentId], noteId] : [noteId],
      })
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
        ...parseFilterQuery(replaceFilterWildcards(tab.filter, parentNote), tab.keywords),
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
      <ForumNote
        note={parentNote}
        updateNote={setParentNote}
        referenceInvitations={forumInvitations?.referenceInvitations}
        originalInvitations={forumInvitations?.originalInvitations}
        tagInvitations={forumInvitations?.tagInvitations}
      />

      {forumInvitations?.commonInvitations.length > 0 && (
        <div className="invitations-container">
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

      <div className="row mt-3">
        <div className="col-xs-12">
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
                  updateNote={updateReplyNote}
                />
              )) : (
                <LoadingSpinner inline />
              )}
            </ForumReplyContext.Provider>
          </div>
        </div>

        {/*
        <div className="col-md-2">
          <FilterFormVertical />
        </div>
        */}
      </div>
    </div>
  )
}
