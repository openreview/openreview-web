/* globals $: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import isEmpty from 'lodash/isEmpty'
import intersection from 'lodash/intersection'

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
import { formatNote, getNoteInvitations, parseFilterQuery, replaceFilterWildcards } from '../../lib/forum-utils'

export default function Forum({ forumNote, clientJsLoading }) {
  const { userLoading, accessToken } = useUser()
  const [parentNote, setParentNote] = useState(forumNote)
  const [replyNoteMap, setReplyNoteMap] = useState(null)
  const [parentMap, setParentMap] = useState(null)
  const [displayOptionsMap, setDisplayOptionsMap] = useState(null)
  const [orderedReplies, setOrderedReplies] = useState(null)
  const [allInvitations, setAllInvitations] = useState(null)
  const [layout, setLayout] = useState(2)
  const [sort, setSort] = useState('date-desc')
  const [filterOptions, setFilterOptions] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({
    invitations: null,
    signatures: null,
    keywords: null,
    readers: null,
    excludedReaders: null,
  })
  const [activeInvitation, setActiveInvitation] = useState(null)
  const router = useRouter()
  const query = useQuery()

  const { id, details } = parentNote
  const replyForumViews = details.invitation?.replyForumViews // TODO: get this from somewhere else
  const repliesLoaded = replyNoteMap && displayOptionsMap && orderedReplies

  const numRepliesHidden = displayOptionsMap
    ? Object.values(displayOptionsMap).reduce(
        (count, opt) => count + (opt.hidden || opt.collapsed ? 1 : 0),
        0
      )
    : 0

  // API helper functions
  const getInvitationsByReplyForum = (forumId, includeTags) => {
    if (!forumId) return Promise.resolve([])

    const extraParams = includeTags ? { tags: true } : { details: 'repliedNotes' }
    return api
      .get('/invitations', { replyForum: forumId, ...extraParams }, { accessToken, version: 2 })
      .then(({ invitations }) => {
        if (!invitations?.length) return []

        return invitations.map((inv) => {
          // Check if invitation does not have multiReply prop OR invitation is set to multiReply
          // but it is not false OR there have not been any replies to the invitation yet
          const repliesAvailable = !inv.maxReplies
            || inv.details?.repliedNotes?.length < inv.maxReplies
          return {
            ...inv,
            process: null,
            preprocess: null,
            details: { repliesAvailable },
          }
        })
      })
  }

  const getNotesByForumId = (forumId) => {
    if (!forumId) return Promise.resolve([])

    return api.get('/notes', {
      forum: forumId,
      trash: true,
      details: 'replyCount,writable,signatures,invitation,presentation',
    }, { accessToken, version: 2 })
      .then(({ notes }) => {
        if (!Array.isArray(notes)) return []

        notes.forEach((note) => {
          if (!note.replyto && note.id !== note.forum) {
            // eslint-disable-next-line no-param-reassign
            note.replyto = note.forum
          }
        })
        return notes
      })
  }

  const loadNotesAndInvitations = async () => {
    const [notes, invitations, tagInvitations] = await Promise.all([
      getNotesByForumId(id),
      getInvitationsByReplyForum(id),
      getInvitationsByReplyForum(id, true),
    ])
    setAllInvitations(invitations)

    // Process notes
    const replyMap = {}
    const displayOptions = {}
    const parentIdMap = {}
    const invitationIds = new Set()
    const signatureGroupIds = new Set()
    const readerGroupIds = new Set()
    const numberWildcard = /(Reviewer|Area_Chair)_(\w{4})/g
    notes.forEach((note) => {
      const [editInvitations, replyInvitations, deleteInvitation] = getNoteInvitations(invitations, note)

      // Don't include forum note in replyMap
      if (note.id === note.forum) {
        setParentNote({
          ...note,
          editInvitations,
          deleteInvitation,
          replyInvitations,
          tagInvitations,
        })
        return
      }

      replyMap[note.id] = formatNote(
        note,
        null,
        editInvitations,
        deleteInvitation,
        replyInvitations
      )
      displayOptions[note.id] = { collapsed: false, contentExpanded: true, hidden: false }

      // Populate parent map
      const parentId = note.replyto || id
      if (!parentIdMap[parentId]) {
        parentIdMap[parentId] = []
      }
      parentIdMap[parentId].push(note.id)

      // Populate filter options
      note.invitations.forEach((noteInv) => invitationIds.add(noteInv.replace(numberWildcard, '$1.*')))
      note.signatures.forEach((noteSig) => signatureGroupIds.add(noteSig))
      note.readers.forEach((rId) => readerGroupIds.add(rId))
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

  const openNoteEditor = (invitation) => {
    if (activeInvitation && activeInvitation.id !== invitation.id) {
      promptError(
        'There is currently another editor pane open on the page. Please submit your changes or click Cancel before continuing',
        { scrollToTop: false }
      )
    } else {
      setActiveInvitation(activeInvitation ? null : invitation)
    }
  }

  // Update forum note after new edit
  const updateParentNote = (note) => {
    const [editInvitations, replyInvitations, deleteInvitation] = getNoteInvitations(allInvitations, note)

    setParentNote({
      ...note,
      editInvitations,
      deleteInvitation,
      replyInvitations,
    })
  }

  // Add new reply note or update and existing reply note
  const updateNote = (note) => {
    const noteId = note.id
    const parentId = note.replyto
    const existingNote = replyNoteMap[noteId]
    const [editInvitations, replyInvitations, deleteInvitation] = getNoteInvitations(allInvitations, note)

    setReplyNoteMap({
      ...replyNoteMap,
      [noteId]: formatNote(
        note,
        null,
        editInvitations,
        deleteInvitation,
        replyInvitations
      ),
    })

    if (isEmpty(existingNote)) {
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

  const scrollToElement = (selector) => {
    const el = document.getElementById(selector)
    if (!el) return

    const navBarHeight = 63
    const y = el.getBoundingClientRect().top + window.pageYOffset - navBarHeight

    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  // Handle url hash changes
  useEffect(() => {
    const handleRouteChange = (url) => {
      const [_, tabId] = url.split('#')
      if (!tabId || !replyForumViews) return

      const tab = replyForumViews.find((view) => view.id === tabId)
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
    if (layout === 1) {
      // Linear view
      orderedNotes = Object.keys(replyNoteMap)
        .sort(selectedSortFn)
        .map((noteId) => ({
          id: noteId,
          replies: [],
        }))
    } else if (layout === 2) {
      // Threaded view
      const getAllReplies = (noteId) => {
        if (!parentMap[noteId]) return []
        return parentMap[noteId].reduce(
          (replies, childId) => replies.concat(childId, getAllReplies(childId)),
          []
        )
      }

      orderedNotes = (parentMap[id] ?? []).sort(selectedSortFn).map((noteId) => ({
        id: noteId,
        replies: getAllReplies(noteId).sort(leastRecentComp),
      }))
    } else if (layout === 3) {
      // TODO: Nested view
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
        return new RegExp(groupId).test(replyGroup)
      }
      return groupId === replyGroup
    }
    const checkSignaturesMatch = (selectedSignatures, replySignature) =>
      selectedSignatures.some((sig) => checkGroupMatch(sig, replySignature))
    const checkReadersMatch = (selectedReaders, replyReaders) =>
      selectedReaders.every((reader) =>
        replyReaders.some((replyReader) => checkGroupMatch(reader, replyReader))
      )
    const checkExReadersMatch = (selectedReaders, replyReaders) =>
      selectedReaders.some((reader) =>
        replyReaders.some((replyReader) => checkGroupMatch(reader, replyReader))
      )

    Object.values(replyNoteMap).forEach((note) => {
      const keywordRegex = selectedFilters.keywords
        ? new RegExp(`\\b${selectedFilters.keywords[0]}`, 'mi')
        : null
      const isVisible =
        (!selectedFilters.invitations ||
          intersection(selectedFilters.invitations, note.invitations).length > 0) &&
        (!selectedFilters.signatures ||
          checkSignaturesMatch(selectedFilters.signatures, note.signatures[0])) &&
        (!selectedFilters.keywords || note.searchText.match(keywordRegex)) &&
        (!selectedFilters.readers ||
          checkReadersMatch(selectedFilters.readers, note.readers)) &&
        (!selectedFilters.excludedReaders ||
          !checkExReadersMatch(selectedFilters.excludedReaders, note.readers))
      const currentOptions = displayOptionsMap[note.id]

      newDisplayOptions[note.id] = {
        ...currentOptions,
        hidden: !isVisible,
        collapsed: !isVisible,
      }
    })

    orderedReplies.forEach((note) => {
      const { hidden } = newDisplayOptions[note.id]
      const someChildrenVisible = note.replies.some(
        (childId) => !newDisplayOptions[childId].hidden
      )
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

    const layoutCode = Number.parseInt(query.layout, 10)
    if (layoutCode) {
      setLayout(layoutCode)
    }
  }, [query])

  return (
    <div className="forum-container">
      <ForumNote note={parentNote} updateNote={updateParentNote} />

      {parentNote.replyInvitations?.length > 0 && (
        <div className="invitations-container">
          <div className="invitation-buttons">
            <span className="hint">Add:</span>
            {parentNote.replyInvitations.map((invitation) => (
              <button
                key={invitation.id}
                type="button"
                className={`btn btn-xs ${
                  activeInvitation?.id === invitation.id ? 'active' : ''
                }`}
                onClick={() => openNoteEditor(invitation)}
              >
                {prettyInvitationId(invitation.id)}
              </button>
            ))}
          </div>

          <NoteEditorForm
            forumId={id}
            replyToId={id}
            invitation={activeInvitation}
            onNoteCreated={(note) => {
              updateNote(note)
              setActiveInvitation(null)
              scrollToElement('forum-replies')
            }}
            onNoteCancelled={() => {
              setActiveInvitation(null)
            }}
            onError={(isLoadingError) => {
              if (isLoadingError) {
                setActiveInvitation(null)
              }
            }}
          />
        </div>
      )}

      {(repliesLoaded && orderedReplies.length > 0) && (
        <div className="filters-container mt-3">
          {replyForumViews && <FilterTabs forumId={id} forumViews={replyForumViews} />}

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
                forumId: id,
                displayOptionsMap,
                setCollapsed,
                setContentExpanded,
              }}
            >
              {repliesLoaded ? (
                orderedReplies.map((reply) => (
                  <ForumReply
                    key={reply.id}
                    note={replyNoteMap[reply.id]}
                    replies={reply.replies.map((childId) => replyNoteMap[childId])}
                    updateNote={updateNote}
                  />
                ))
              ) : (
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
