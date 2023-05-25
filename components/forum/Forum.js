/* globals $: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import isEmpty from 'lodash/isEmpty'
import escapeRegExp from 'lodash/escapeRegExp'

import List from 'rc-virtual-list'
import ForumNote from './ForumNote'
import NoteEditorForm from '../NoteEditorForm'
import ChatEditorForm from './ChatEditorForm'
import FilterForm from './FilterForm'
import ChatFilterForm from './ChatFilterForm'
import FilterTabs from './FilterTabs'
import ForumReply from './ForumReply'
import ChatReply from './ChatReply'
import LoadingSpinner from '../LoadingSpinner'
import ForumReplyContext from './ForumReplyContext'

import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import useInterval from '../../hooks/useInterval'
import api from '../../lib/api-client'
import { prettyInvitationId } from '../../lib/utils'
import {
  formatNote,
  getNoteInvitations,
  parseFilterQuery,
  replaceFilterWildcards,
} from '../../lib/forum-utils'

export default function Forum({
  forumNote,
  selectedNoteId,
  selectedInvitationId,
  clientJsLoading,
}) {
  const { userLoading, accessToken } = useUser()
  const [parentNote, setParentNote] = useState(forumNote)
  const [replyNoteMap, setReplyNoteMap] = useState(null)
  const [parentMap, setParentMap] = useState(null)
  const [displayOptionsMap, setDisplayOptionsMap] = useState(null)
  const [orderedReplies, setOrderedReplies] = useState(null)
  const [allInvitations, setAllInvitations] = useState(null)
  const [expandedInvitations, setExpandedInvitations] = useState(null)
  const [nesting, setNesting] = useState(2)
  const [layout, setLayout] = useState('default')
  const [sort, setSort] = useState('date-desc')
  const [defaultCollapseLevel, setDefaultCollapseLevel] = useState(2)
  const [filterOptions, setFilterOptions] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({
    invitations: null,
    signatures: null,
    keywords: null,
    readers: null,
    excludedReaders: null,
  })
  const [defaultFilters, setDefaultFilters] = useState(null)
  const [activeInvitation, setActiveInvitation] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [attachedToBottom, setAttachedToBottom] = useState(true)
  const [enableLiveUpdate, setEnableLiveUpdate] = useState(false)
  const [latestMdate, setLatestMdate] = useState(null)
  const [chatReplyNote, setChatReplyNote] = useState(null)
  const invitationMapRef = useRef(null)
  const signaturesMapRef = useRef(null)
  const router = useRouter()
  const query = useQuery()

  const { id, details } = parentNote
  const replyForumViews = details.invitation?.replyForumViews
  const repliesLoaded = replyNoteMap && displayOptionsMap && orderedReplies

  const numRepliesHidden = useMemo(() => {
    if (!displayOptionsMap) return 0
    return Object.values(displayOptionsMap).reduce(
      (count, opt) => count + (opt.hidden ? 1 : 0),
      0
    )
  }, [displayOptionsMap])

  // API helper functions
  const getInvitationsByReplyForum = (forumId, includeTags) => {
    if (!forumId) return Promise.resolve([])

    const extraParams = includeTags ? { tags: true, details: 'writable' } : { details: 'repliedNotes,writable' }
    return api
      .get(
        '/invitations',
        { replyForum: forumId, expired: true, ...extraParams },
        { accessToken, version: 2 }
      )
      .then(({ invitations }) => {
        if (!invitations?.length) return []
        return invitations.map((inv) => {
          // Check if invitation does not have multiReply prop OR invitation is set to multiReply
          // but it is not false OR there have not been any replies to the invitation yet
          const repliesAvailable =
            !inv.maxReplies || inv.details?.repliedNotes?.length < inv.maxReplies
          const writable = inv.details?.writable
          return {
            ...inv,
            process: null,
            preprocess: null,
            details: { repliesAvailable, writable },
          }
        })
      })
  }

  const getNotesByForumId = (forumId) => {
    if (!forumId) return Promise.resolve([])

    return api.getAll(
      '/notes',
      {
        forum: forumId,
        trash: true,
        details: 'replyCount,editsCount,writable,signatures,invitation,presentation',
      },
      { accessToken, version: 2 }
    )
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
    const readerGroupIds = new Set(['everyone'])
    const numberWildcard = /(Reviewer|Area_Chair)_(\w{4})/g
    const usernameWildcard = /(~[^\d]+\d+)([/_])/g
    invitationMapRef.current = {}
    signaturesMapRef.current = {}
    notes.forEach((note) => {
      const [editInvitations, replyInvitations, deleteInvitation] = getNoteInvitations(
        invitations,
        note
      )

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
      invitationMapRef.current[note.invitations[0]] = [
        note.details.invitation,
        note.details.presentation,
      ]
      if (note.details.signatures) {
        note.signatures.forEach((sig) => {
          signaturesMapRef.current[sig] = note.details.signatures.find((s) => s.id === sig)
        })
      }

      // Populate parent map
      const parentId = note.replyto || id
      if (!parentIdMap[parentId]) {
        parentIdMap[parentId] = []
      }
      parentIdMap[parentId].push(note.id)

      // Populate filter options
      invitationIds.add(
        note.invitations[0].replace(numberWildcard, '$1.*').replace(usernameWildcard, '.*$2')
      )
      note.signatures.forEach((noteSig) => signatureGroupIds.add(noteSig))
      note.readers.forEach((rId) => readerGroupIds.add(rId))
    })

    // After replyMap is populated, go back through and add a parentTitle field
    notes.forEach((note) => {
      if (!note.replyto || note.replyto === note.forum) return

      const replyToNote = replyMap[note.replyto]
      if (!replyToNote) return

      replyMap[note.id].parentTitle =
        replyToNote.content.title?.value || replyToNote.generatedTitle
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

  const loadNewReplies = useCallback(async () => {
    try {
      const { notes } = await api.get(
        '/notes',
        {
          forum: id,
          mintmdate: latestMdate,
          sort: 'tmdate:asc',
          details: 'writable',
        },
        { accessToken, version: 2 }
      )
      return notes?.length > 0 ? notes : []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error loading new replies: ', error.message)
      return []
    }
  }, [latestMdate, id, accessToken])

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
    setDisplayOptionsMap((prevMap) => ({
      ...prevMap,
      [noteId]: {
        ...prevMap[noteId],
        collapsed: newCollapsed,
      },
    }))
  }

  const setHidden = (noteId, newHidden) => {
    setDisplayOptionsMap((prevMap) => ({
      ...prevMap,
      [noteId]: {
        ...prevMap[noteId],
        hidden: newHidden,
      },
    }))
  }

  const setContentExpanded = (noteId, newContentExpanded) => {
    setDisplayOptionsMap((prevMap) => ({
      ...prevMap,
      [noteId]: {
        ...prevMap[noteId],
        contentExpanded: newContentExpanded,
      },
    }))
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

  const scrollToElement = (selector) => {
    const el = document.querySelector(selector)
    if (!el) return

    const navBarHeight = 63
    const y = el.getBoundingClientRect().top + window.pageYOffset - navBarHeight

    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  // Update forum note after new edit
  const updateParentNote = (note) => {
    const [editInvitations, replyInvitations, deleteInvitation] = getNoteInvitations(
      allInvitations,
      note
    )

    setParentNote({
      ...note,
      editInvitations,
      deleteInvitation,
      replyInvitations,
    })
  }

  // Add new reply note or update and existing reply note
  const updateNote = (note) => {
    if (!note) return

    // For chat layout, check if the user is scrolled before updating state
    const containerElem = document.querySelector('#forum-replies .rc-virtual-list-holder')
    if (containerElem) {
      const atBottom =
        Math.abs(
          containerElem.scrollHeight - containerElem.scrollTop - containerElem.clientHeight
        ) < 3
      if (attachedToBottom !== atBottom) {
        setAttachedToBottom(atBottom)
      }
    }

    const noteId = note.id
    const parentId = note.replyto
    const existingNote = replyNoteMap[noteId]
    const [editInvitations, replyInvitations, deleteInvitation] = getNoteInvitations(
      allInvitations,
      note
    )

    const formattedNote = formatNote(
      note,
      null,
      editInvitations,
      deleteInvitation,
      replyInvitations
    )
    const replyToNote = replyNoteMap[parentId]
    if (replyToNote) {
      formattedNote.parentTitle =
        replyToNote.content.title?.value || replyToNote.generatedTitle
    }
    setReplyNoteMap((prevNoteMap) => ({
      ...prevNoteMap,
      [noteId]: formattedNote,
    }))

    if (isEmpty(existingNote)) {
      setDisplayOptionsMap((prevOptionsMap) => ({
        ...prevOptionsMap,
        [noteId]: { collapsed: false, contentExpanded: true, hidden: false },
      }))
      setParentMap((preParentMap) => ({
        ...preParentMap,
        [parentId]: parentMap[parentId] ? [...parentMap[parentId], noteId] : [noteId],
      }))
    }

    // If updated note is a reply to an invitation with a maxReplies property,
    // update the invitation and the parent note
    if (isEmpty(existingNote) || existingNote.ddate !== note.ddate) {
      const invObj = allInvitations.find((i) => i.id === note.invitations[0])
      if (invObj.maxReplies) {
        const increment = isEmpty(existingNote) || !note.ddate ? 1 : -1
        const prevRepliesAvailable = invObj.details.repliesAvailable ?? 1
        const remainingReplies = prevRepliesAvailable - increment

        setAllInvitations((prevInvitations) =>
          prevInvitations
            .filter((i) => i.id !== invObj.id)
            .concat({
              ...invObj,
              details: {
                ...invObj.details,
                repliesAvailable: remainingReplies,
              },
            })
        )

        if (remainingReplies < 1) {
          if (parentId === parentNote.id) {
            setParentNote((prevParentNote) => ({
              ...prevParentNote,
              replyInvitations: parentNote.replyInvitations.filter((i) => i.id !== invObj.id),
            }))
          } else {
            setReplyNoteMap((prevMap) => ({
              ...prevMap,
              [parentId]: {
                ...replyToNote,
                replyInvitations: replyToNote.replyInvitations.filter(
                  (i) => i.id !== invObj.id
                ),
              },
            }))
          }
        } else if (prevRepliesAvailable === 0 && remainingReplies > 0) {
          if (parentId === parentNote.id) {
            setParentNote((prevParentNote) => ({
              ...prevParentNote,
              replyInvitations: parentNote.replyInvitations.concat(invObj),
            }))
          } else {
            setReplyNoteMap((prevMap) => ({
              ...prevMap,
              [parentId]: {
                ...replyToNote,
                replyInvitations: replyToNote.replyInvitations.concat(invObj),
              },
            }))
          }
        }
      }
    }
  }

  // Handle url hash changes
  useEffect(() => {
    const handleRouteChange = (url) => {
      const [_, tabId] = url.split('#')
      if (!tabId || !replyForumViews) return

      const tab = replyForumViews.find((view) => view.id === tabId)
      if (!tab) return

      const tabFilters = {
        invitations: null,
        excludedInvitations: null,
        signatures: null,
        readers: null,
        excludedReaders: null,
        keywords: null,
        ...parseFilterQuery(replaceFilterWildcards(tab.filter, parentNote), tab.keywords),
      }
      setDefaultFilters(tabFilters)
      setSelectedFilters(tabFilters)
      setLayout(tab.layout || 'default')
      setNesting(tab.nesting || 2)
      setSort(tab.sort || 'date-desc')
      setEnableLiveUpdate(Boolean(tab.live))
      if (tab.expandedInvitations) {
        setExpandedInvitations(
          tab.expandedInvitations.map((expandedInv) =>
            replaceFilterWildcards(expandedInv, parentNote)
          )
        )
      } else {
        setExpandedInvitations(null)
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

    // Initialize latest mdate to be 1 second before the current time
    setLatestMdate(Date.now() - 1000)

    loadNotesAndInvitations()
  }, [userLoading])

  // Update forum nesting level
  useEffect(() => {
    if (!replyNoteMap || !parentMap) return

    const leastRecentComp = (a, b) => replyNoteMap[a].cdate - replyNoteMap[b].cdate
    const mostRecentComp = (a, b) => replyNoteMap[b].cdate - replyNoteMap[a].cdate
    const selectedSortFn = sort === 'date-desc' ? mostRecentComp : leastRecentComp

    const getAllReplies = (noteId) => {
      if (!parentMap[noteId]) return []

      return parentMap[noteId].reduce(
        (replies, childId) => replies.concat(childId, getAllReplies(childId)),
        []
      )
    }

    let orderedNotes = []
    if (nesting === 1) {
      // Linear view
      orderedNotes = Object.keys(replyNoteMap)
        .sort(selectedSortFn)
        .map((noteId) => ({
          id: noteId,
          replies: [],
        }))
    } else if (nesting === 2) {
      // Threaded view
      orderedNotes = (parentMap[id] ?? []).sort(selectedSortFn).map((noteId) => ({
        id: noteId,
        replies: getAllReplies(noteId)
          .sort(leastRecentComp)
          .map((noteId2) => ({
            id: noteId2,
            replies: [],
          })),
      }))
    } else if (nesting === 3) {
      // Partially Nested view
      orderedNotes = (parentMap[id] ?? []).sort(selectedSortFn).map((noteId) => ({
        id: noteId,
        replies: (parentMap[noteId] ?? []).sort(selectedSortFn).map((noteId2) => ({
          id: noteId2,
          replies: getAllReplies(noteId2)
            .sort(leastRecentComp)
            .map((noteId3) => ({
              id: noteId3,
              replies: [],
            })),
        })),
      }))
    }
    setOrderedReplies(orderedNotes)

    // Do stuff that should happen after all replies are rendered
    setTimeout(() => {
      typesetMathJax()

      $('[data-toggle="tooltip"]').tooltip()

      // Scroll note and invitation specified in url
      if (selectedNoteId && !scrolled) {
        if (selectedNoteId === id) {
          scrollToElement('.forum-note')
        } else {
          scrollToElement(`.note[data-id="${selectedNoteId}"]`)
        }

        if (selectedInvitationId) {
          const buttonSelector = `[data-id="${selectedInvitationId}"]`
          const selector =
            selectedNoteId === id
              ? `.forum-note a${buttonSelector}, .invitations-container button${buttonSelector}`
              : `.note[data-id="${selectedNoteId}"] button${buttonSelector}`
          const button = document.querySelector(selector)
          if (button) button.click()
        }

        setScrolled(true)
      }

      if (layout === 'chat') {
        const containerElem = document.querySelector('#forum-replies .rc-virtual-list-holder')
        if (containerElem && attachedToBottom) {
          containerElem.scrollTop = containerElem.scrollHeight
        }
      }
    }, 200)
  }, [replyNoteMap, parentMap, nesting, sort])

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
    // This function is also used for matching invitations
    const checkExReadersMatch = (selectedReaders, replyReaders) =>
      selectedReaders.some((reader) =>
        replyReaders.some((replyReader) => checkGroupMatch(reader, replyReader))
      )

    Object.values(replyNoteMap).forEach((note) => {
      const keywordRegex = selectedFilters.keywords
        ? new RegExp(`\\b${escapeRegExp(selectedFilters.keywords[0])}`, 'mi')
        : null
      const isVisible =
        (!selectedFilters.invitations ||
          checkExReadersMatch(selectedFilters.invitations, note.invitations)) &&
        (!selectedFilters.excludedInvitations ||
          !checkExReadersMatch(selectedFilters.excludedInvitations, note.invitations)) &&
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
        collapsed: defaultCollapseLevel === 0,
        contentExpanded: defaultCollapseLevel === 2,
      }
    })

    orderedReplies.forEach((note) => {
      const { hidden } = newDisplayOptions[note.id]
      const allChildIds = note.replies.reduce(
        (acc, reply) =>
          acc.concat(
            reply.id,
            reply.replies.map((r) => r.id)
          ),
        []
      )
      const someChildrenVisible = allChildIds.some(
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

  useEffect(() => {
    if (!displayOptionsMap) return

    const newDisplayOptions = {}
    Object.keys(displayOptionsMap).forEach((noteId) => {
      newDisplayOptions[noteId] = {
        ...displayOptionsMap[noteId],
        collapsed: defaultCollapseLevel === 0,
        contentExpanded: defaultCollapseLevel === 2,
      }
    })
    setDisplayOptionsMap(newDisplayOptions)
  }, [defaultCollapseLevel])

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

    const nestingLevel = Number.parseInt(query.nesting, 10)
    if (nestingLevel) {
      setNesting(nestingLevel)
    }
  }, [query])

  // Toggle real-time updates
  useInterval(() => {
    if (!repliesLoaded || !enableLiveUpdate) return

    loadNewReplies().then((newReplies) => {
      newReplies.forEach((note) => {
        const invId = note.invitations[0]
        // eslint-disable-next-line no-param-reassign
        note.details.invitation = invitationMapRef.current[invId]?.[0]
        // eslint-disable-next-line no-param-reassign
        note.details.presentation = invitationMapRef.current[invId]?.[1]
        // eslint-disable-next-line no-param-reassign
        note.details.signatures = note.signatures.flatMap(
          (sigId) => signaturesMapRef.current[sigId] ?? []
        )
        updateNote(note)
      })

      if (newReplies.length > 0) {
        setLatestMdate(newReplies[newReplies.length - 1].tmdate)
      }
    })
  }, 2000)

  return (
    <div className="forum-container">
      <ForumNote note={parentNote} updateNote={updateParentNote} />

      {repliesLoaded && orderedReplies.length > 0 && (
        <div className="filters-container mt-4">
          {replyForumViews && <FilterTabs forumId={id} forumViews={replyForumViews} />}

          {filterOptions && layout === 'default' && (
            <FilterForm
              forumId={id}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              filterOptions={filterOptions}
              sort={sort}
              setSort={setSort}
              nesting={nesting}
              setNesting={setNesting}
              defaultCollapseLevel={defaultCollapseLevel}
              setDefaultCollapseLevel={setDefaultCollapseLevel}
              numReplies={details.replyCount}
              numRepliesHidden={numRepliesHidden}
            />
          )}
          {filterOptions && layout === 'chat' && (
            <ChatFilterForm
              forumId={id}
              defaultFilters={defaultFilters}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              filterOptions={filterOptions}
              numReplies={details.replyCount}
              numRepliesHidden={numRepliesHidden}
            />
          )}
        </div>
      )}

      {parentNote.replyInvitations?.length > 0 &&
        !parentNote.ddate &&
        layout === 'default' && (
          <div className="invitations-container">
            <div className="invitation-buttons top-level-invitations">
              <span className="hint">Add:</span>
              {parentNote.replyInvitations.map((invitation) => {
                if (selectedFilters.excludedInvitations?.includes(invitation.id)) return null

                return (
                  <button
                    key={invitation.id}
                    type="button"
                    className={`btn btn-xs ${
                      activeInvitation?.id === invitation.id ? 'active' : ''
                    }`}
                    data-id={invitation.id}
                    onClick={() => openNoteEditor(invitation)}
                  >
                    {prettyInvitationId(invitation.id)}
                  </button>
                )
              })}
            </div>

            <NoteEditorForm
              forumId={id}
              replyToId={id}
              invitation={activeInvitation}
              onNoteCreated={(note) => {
                updateNote(note)
                setActiveInvitation(null)
                scrollToElement('#forum-replies')
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

      <div className={`row forum-replies-container layout-${layout}`}>
        <div className="col-xs-12">
          <div id="forum-replies">
            <ForumReplyContext.Provider
              value={{
                forumId: id,
                replyNoteMap,
                displayOptionsMap,
                layout,
                nesting,
                excludedInvitations: selectedFilters.excludedInvitations,
                setCollapsed,
                setContentExpanded,
                setHidden,
              }}
            >
              {repliesLoaded ? (
                <ForumReplies
                  forumId={id}
                  replies={orderedReplies}
                  replyNoteMap={replyNoteMap}
                  displayOptionsMap={displayOptionsMap}
                  layout={layout}
                  chatReplyNote={chatReplyNote}
                  setChatReplyNote={setChatReplyNote}
                  updateNote={updateNote}
                />
              ) : (
                <LoadingSpinner inline />
              )}
            </ForumReplyContext.Provider>
          </div>
        </div>
      </div>

      {layout === 'chat' && parentNote.replyInvitations?.length > 0 && !parentNote.ddate && (
        <div className="chat-invitations-container">
          {expandedInvitations ? (
            expandedInvitations.map((invitationId) => {
              const invitation = parentNote.replyInvitations.find(
                (inv) => inv.id === invitationId
              )
              if (!invitation) return null

              return (
                <ChatEditorForm
                  key={invitationId}
                  forumId={id}
                  invitation={invitation}
                  replyToNote={chatReplyNote}
                  setReplyToNote={setChatReplyNote}
                  onSubmit={updateNote}
                />
              )
            })
          ) : (
            <>
              <div className="invitation-buttons">
                <span className="hint">Add:</span>
                {parentNote.replyInvitations.map((invitation) => (
                  <button
                    key={invitation.id}
                    type="button"
                    className={`btn btn-xs ${
                      activeInvitation?.id === invitation.id ? 'active' : ''
                    }`}
                    data-id={invitation.id}
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
                  scrollToElement('#forum-replies')
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
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ForumReplies({
  forumId,
  replies,
  replyNoteMap,
  displayOptionsMap,
  chatReplyNote,
  layout,
  updateNote,
  setChatReplyNote,
}) {
  if (!replies) return null

  if (layout === 'chat') {
    return (
      <List data={replies} height={625} itemHeight={1} itemKey="id">
        {(reply) => (
          <ChatReply
            note={replyNoteMap[reply.id]}
            parentNote={
              reply.replyto === forumId ? null : replyNoteMap[replyNoteMap[reply.id].replyto]
            }
            displayOptions={displayOptionsMap[reply.id]}
            setChatReplyNote={setChatReplyNote}
            isSelected={reply.id === chatReplyNote?.id}
            updateNote={updateNote}
          />
        )}
      </List>
    )
  }

  return replies.map((reply) => (
    <ForumReply
      key={reply.id}
      note={replyNoteMap[reply.id]}
      replies={reply.replies}
      replyDepth={1}
      parentId={forumId}
      updateNote={updateNote}
    />
  ))
}
