'use client'

/* globals $: false */
/* globals typesetMathJax: false */
/* globals promptError: false */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import isEmpty from 'lodash/isEmpty'
import truncate from 'lodash/truncate'
import debounce from 'lodash/debounce'
import groupBy from 'lodash/groupBy'
import escapeRegExp from 'lodash/escapeRegExp'
import List from 'rc-virtual-list'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ForumNote from './ForumNote'
import NoteEditor from '../NoteEditor'
import ChatEditorForm from './ChatEditorForm'
import FilterForm from './FilterForm'
import ChatFilterForm from './ChatFilterForm'
import FilterTabs from './FilterTabs'
import ForumReply from './ForumReply'
import ChatReply from './ChatReply'
import LoadingSpinner from '../LoadingSpinner'
import ForumReplyContext from './ForumReplyContext'
import ConfirmDeleteModal from './ConfirmDeleteModal'

import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId, prettyInvitationId, stringToObject } from '../../lib/utils'
import {
  formatNote,
  addTagToReactionsList,
  parseFilterQuery,
  replaceFilterWildcards,
} from '../../lib/forum-utils'
import useLocalStorage from '../../hooks/useLocalStorage'
import Icon from '../Icon'
import useSocket from '../../hooks/useSocket'

dayjs.extend(relativeTime)

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

const scrollToElement = (selector) => {
  const el = document.querySelector(selector)
  if (!el) return

  const navBarHeight = 63
  const y = el.getBoundingClientRect().top + window.scrollY - navBarHeight
  window.scrollTo({ top: y, behavior: 'smooth' })
}

const scrollToChatNote = (selectedNoteId) => {
  const listElem = document.querySelector('#forum-replies .rc-virtual-list-holder')
  const messageElem = document.querySelector(`[data-id="${selectedNoteId}"]`)
  if (!listElem || !messageElem) return false

  listElem.scrollTop = messageElem.offsetTop - 6
  return true
}

export default function Forum({
  forumNote,
  selectedNoteId,
  selectedInvitationId,
  prefilledValues,
  query,
  editInvitationIdToHide,
}) {
  const { isRefreshing, accessToken } = useUser()
  const [parentNote, setParentNote] = useState(forumNote)
  const [replyNoteMap, setReplyNoteMap] = useState(null)
  const [parentMap, setParentMap] = useState(null)
  const [displayOptionsMap, setDisplayOptionsMap] = useState(null)
  const [orderedReplies, setOrderedReplies] = useState(null)
  const [allInvitations, setAllInvitations] = useState(null)
  const [signature, setSignature] = useState(null)
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
  const [newMessageCounts, setNewMessageCounts] = useState({})
  const [maxLength, setMaxLength] = useState(200)
  const [confirmDeleteModalData, setConfirmDeleteModalData] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [enableLiveUpdate, setEnableLiveUpdate] = useState(false)
  const [latestMdate, setLatestMdate] = useState(null)
  const [chatReplyNote, setChatReplyNote] = useState(null)
  const [notificationPermissions, setNotificationPermissions] = useState('loading')
  const [showNotifications, setShowNotifications] = useLocalStorage(
    `forum-notifications-${forumNote.id}`,
    false
  )
  const invitationMapRef = useRef(null)
  const signaturesMapRef = useRef(null)
  const replyNoteCount = useRef(0)
  const numRepliesVisible = useRef(0)
  const cutoffIndex = useRef(0)
  const attachedToBottom = useRef(false)
  const router = useRouter()

  const { id, details } = parentNote
  const repliesLoaded = replyNoteMap && displayOptionsMap && orderedReplies
  const domain = !parentNote.domain?.startsWith(process.env.SUPER_USER)
    ? parentNote.domain
    : undefined

  const events = useSocket(
    repliesLoaded && enableLiveUpdate ? 'forum' : undefined,
    ['edit-upserted'],
    {
      id: forumNote.id,
    }
  )
  // Process forum views config
  let replyForumViews = null
  if (details.invitation?.replyForumViews) {
    replyForumViews = details.invitation.replyForumViews.map((view) => ({
      ...view,
      filter: view.filter ? replaceFilterWildcards(view.filter, parentNote) : null,
      expandedInvitations: view.expandedInvitations
        ? view.expandedInvitations.map((invId) => replaceFilterWildcards(invId, parentNote))
        : null,
    }))
  }

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

    const extraParams = includeTags
      ? { type: 'tag', details: 'writable' }
      : { type: 'note', details: 'repliedNotes,writable' }
    return api
      .get(
        '/invitations',
        { replyForum: forumId, expired: true, domain, ...extraParams },
        { accessToken }
      )
      .then(({ invitations }) => {
        if (!invitations?.length) return []
        return invitations.flatMap((inv) => {
          if (inv.id === editInvitationIdToHide) return []
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
        details: 'writable,signatures,invitation,presentation,tags',
        domain,
      },
      { accessToken }
    )
  }

  const loadNotesAndInvitations = async () => {
    const [notes, invitations, allTagInvitations] = await Promise.all([
      getNotesByForumId(id),
      getInvitationsByReplyForum(id),
      getInvitationsByReplyForum(id, true),
    ])
    const combinedInvitations = invitations.concat(allTagInvitations)
    setAllInvitations(combinedInvitations)

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
      const formattedNote = formatNote(note, combinedInvitations)

      // Don't include forum note in replyMap
      if (note.id === note.forum) {
        setParentNote(formattedNote)
        return
      }

      replyMap[note.id] = formattedNote
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
    replyNoteCount.current = notes.length - 1
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
          trash: true,
          domain,
        },
        { accessToken }
      )
      return notes?.length > 0 ? notes : []
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error loading new replies: ', error.message)
      return []
    }
  }, [latestMdate, id, accessToken])

  const loadNewTags = useCallback(async () => {
    const invitation = parentNote.tagInvitations?.find((inv) =>
      inv.id.endsWith('/Chat_Reaction')
    )
    if (!invitation) return []

    try {
      const { tags } = await api.get(
        '/tags',
        { invitation: invitation.id, mintmdate: latestMdate, trash: true },
        { accessToken }
      )
      return tags?.length > 0 ? tags.sort((a, b) => a.tmdate - b.tmdate) : []
    } catch (error) {
      return []
    }
  }, [latestMdate, parentNote, accessToken])

  const loadNewSignatureGroups = async (newSigIds) => {
    if (newSigIds.size === 0) return []

    try {
      const { groups } = await api.get(
        `/groups`,
        { ids: Array.from(newSigIds), select: 'id,members,readers' },
        { accessToken }
      )
      return groups?.length > 0 ? groups : []
    } catch (error) {
      return []
    }
  }

  const delayedScroll = useCallback(
    debounce((layoutMode, isScrolled) => {
      $('.forum-note [data-toggle="tooltip"]').tooltip({ html: true })
      $('#forum-replies [data-toggle="tooltip"]').tooltip({ html: true })

      // Scroll note and invitation specified in url
      if (selectedNoteId && !isScrolled) {
        if (selectedNoteId === id) {
          scrollToElement('.forum-note')
        } else if (layoutMode === 'chat') {
          scrollToElement('.filters-container')
          const didScroll = scrollToChatNote(selectedNoteId)
          if (didScroll) attachedToBottom.current = false
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

      if (attachedToBottom.current) {
        const listElem = document.querySelector('#forum-replies .rc-virtual-list-holder')
        if (listElem) {
          listElem.scrollTop = listElem.scrollHeight
        }
      }
    }, 500),
    [selectedNoteId, selectedInvitationId]
  )

  const chatListScrollHandler = useCallback(
    debounce((e) => {
      const listElem = e.target
      const scrollDifference =
        listElem.scrollHeight - listElem.scrollTop - listElem.clientHeight
      attachedToBottom.current = Math.abs(scrollDifference) < 8

      // Reset new message count if user scrolls to the bottom
      if (attachedToBottom.current && expandedInvitations?.length > 0) {
        const key = expandedInvitations[0]
        setNewMessageCounts((prevCounts) => ({
          ...prevCounts,
          [key]: 0,
        }))
      }
    }, 50),
    [expandedInvitations]
  )

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

  const deleteOrRestoreNote = (note, invitation, updateNote) => {
    flushSync(() => {
      setConfirmDeleteModalData({ note, invitation, updateNote })
    })
    $('#confirm-delete-modal').modal('show')
  }

  // Update forum note after new edit
  const updateParentNote = (note) => {
    setParentNote(formatNote(note, allInvitations))

    setTimeout(() => {
      typesetMathJax()
      $('.forum-note [data-toggle="tooltip"]').tooltip({ html: true })
    }, 200)
  }

  // Add new reply note or update and existing reply note
  const updateNote = (note, scrollToNote) => {
    if (!note) return false

    const noteId = note.id
    const parentId = note.replyto
    const existingNote = replyNoteMap[noteId]
    const isNewNote = isEmpty(existingNote)
    const formattedNote = formatNote(note, allInvitations)

    const replyToNote = replyNoteMap[parentId]
    if (replyToNote) {
      formattedNote.parentTitle =
        replyToNote.content.title?.value || replyToNote.generatedTitle
    }
    setReplyNoteMap((prevNoteMap) => ({
      ...prevNoteMap,
      [noteId]: formattedNote,
    }))

    if (isNewNote) {
      setDisplayOptionsMap((prevOptionsMap) => ({
        ...prevOptionsMap,
        [noteId]: { collapsed: false, contentExpanded: true, hidden: false },
      }))
      setParentMap((preParentMap) => ({
        ...preParentMap,
        [parentId]: parentMap[parentId] ? [...parentMap[parentId], noteId] : [noteId],
      }))
      replyNoteCount.current += 1
    }

    // If updated note is a reply to an invitation with a maxReplies property,
    // update the invitation and the parent note
    if (isNewNote || existingNote.ddate !== note.ddate) {
      const invObj = allInvitations.find((i) => i.id === note.invitations[0])
      if (invObj.maxReplies) {
        const increment = isNewNote || !note.ddate ? 1 : -1
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

    // Scroll to the bottom if it's a note the user just posted
    if (layout === 'chat' && scrollToNote) {
      attachedToBottom.current = true
    }

    return isNewNote
  }

  const getNotificationState = () => {
    if (!('Notification' in window)) {
      return Promise.resolve('denied')
    }
    if (navigator.permissions) {
      return navigator.permissions
        .query({ name: 'notifications' })
        .then((result) => result.state)
    }
    return Promise.resolve(Notification.permission)
  }

  const renderReplies = () => {
    if (!orderedReplies) return null

    const replies =
      layout === 'chat' || cutoffIndex.current >= orderedReplies.length
        ? orderedReplies
        : orderedReplies.slice(0, cutoffIndex.current)

    if (layout === 'chat') {
      if (replies.length === numRepliesHidden || replies.length === 0) {
        return (
          <div className="empty-container">
            <p className="empty-message">
              No messages to display. Be the first by posting a message below.
            </p>
          </div>
        )
      }
      return (
        <List data={replies} height={625} itemKey="id" onScroll={chatListScrollHandler}>
          {(reply) => (
            <ChatReply
              note={replyNoteMap[reply.id]}
              parentNote={
                reply.replyto === forumNote?.id
                  ? null
                  : replyNoteMap[replyNoteMap[reply.id].replyto]
              }
              signature={signature}
              displayOptions={displayOptionsMap[reply.id]}
              setChatReplyNote={setChatReplyNote}
              isSelected={reply.id === chatReplyNote?.id}
              updateNote={updateNote}
              scrollToNote={scrollToChatNote}
            />
          )}
        </List>
      )
    }

    setTimeout(() => {
      typesetMathJax()
    }, 200)

    return replies.map((reply) => (
      <ForumReply
        key={reply.id}
        note={replyNoteMap[reply.id]}
        replies={reply.replies}
        replyDepth={1}
        parentNote={
          replyNoteMap[reply.id].replyto === forumNote?.id
            ? forumNote
            : replyNoteMap[reply.replyto]
        }
        deleteOrRestoreNote={deleteOrRestoreNote}
        updateNote={updateNote}
        isDirectReplyToForum={true}
      />
    ))
  }

  // Handle url hash changes
  useEffect(() => {
    if (!parentNote) return

    const handleRouteChange = () => {
      const [_, tabId] = (window.location.hash || '').split('#')
      if (!tabId || !replyForumViews) return

      const tab = replyForumViews.find((view) => view.id === tabId)
      if (!tab) return

      const primaryInvitationId = tab.expandedInvitations?.[0]
      if (primaryInvitationId) {
        const primaryInvitation = parentNote.replyInvitations.find(
          (inv) => inv.id === primaryInvitationId
        )
        if (
          !primaryInvitation ||
          (primaryInvitation.expdate && primaryInvitation.expdate < Date.now())
        ) {
          return
        }
      }

      const tabFilters = {
        invitations: null,
        excludedInvitations: null,
        signatures: null,
        readers: null,
        excludedReaders: null,
        keywords: null,
        ...parseFilterQuery(tab.filter, tab.keywords),
      }
      setDefaultFilters(tabFilters)
      setSelectedFilters(tabFilters)
      setLayout(tab.layout || 'default')
      if (tab.layout === 'chat') {
        attachedToBottom.current = true
      }
      setNesting(tab.nesting || 2)
      setSort(tab.sort || 'date-desc')
      setEnableLiveUpdate(Boolean(tab.live))
      setExpandedInvitations(tab.expandedInvitations)

      $('.forum-note [data-toggle="tooltip"]').tooltip({ html: true })
    }

    if (window.location.hash) {
      handleRouteChange(window.location.hash)
    } else if (
      replyForumViews?.length > 0 &&
      !selectedNoteId &&
      !selectedInvitationId &&
      !(query.filter || query.search || query.sort || query.nesting)
    ) {
      setTimeout(() => {
        const tab = replyForumViews[0]
        const newActiveTab = document.querySelector(`.filter-tabs li[data-id="${tab.id}"] a`)
        if (newActiveTab) {
          newActiveTab.click()
        }
      }, 200)
    }

    window.onhashchange = handleRouteChange

    // eslint-disable-next-line consistent-return
    return () => {
      window.onhashchange = null
    }
  }, [parentNote])

  // Load forum replies
  useEffect(() => {
    if (isRefreshing) return

    // Initialize latest mdate to be 1 second before the current time
    setLatestMdate(Date.now() - 1000)

    loadNotesAndInvitations()
    getNotificationState().then((state) => {
      // Can be 'granted', 'denied', or 'prompt'
      setNotificationPermissions(state)
    })
  }, [isRefreshing])

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
  }, [replyNoteMap, parentMap, nesting, sort])

  // Update reply visibility
  useEffect(() => {
    if (!replyNoteMap || !displayOptionsMap || !orderedReplies?.length) {
      delayedScroll(layout, scrolled)
      return
    }

    const newDisplayOptions = {}

    // Special case for chat layout: make sure all participants in the chat can read all the notes
    let chatReaders = null
    if (expandedInvitations?.length > 0) {
      const primaryInv = parentNote.replyInvitations.find(
        (inv) => inv.id === expandedInvitations[0]
      )
      chatReaders = primaryInv ? primaryInv.edit.note.readers : null
    }

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
          !checkExReadersMatch(selectedFilters.excludedReaders, note.readers)) &&
        (!chatReaders ||
          note.readers.includes('everyone') ||
          chatReaders.every((r) => note.readers.includes(r)))
      const currentOptions = displayOptionsMap[note.id]

      newDisplayOptions[note.id] = {
        ...currentOptions,
        hidden: !isVisible,
        collapsed: defaultCollapseLevel === 0,
        contentExpanded: defaultCollapseLevel === 2,
      }
    })

    // Adjust visibilty of parent notes based on visibility of children and calculate where to cut
    // of the list of replies, based on how many total notes are visible.
    let cutoff = 0
    let numVisible = 0
    while (numVisible < maxLength && cutoff < orderedReplies.length) {
      const note = orderedReplies[cutoff]
      let numChildrenVisible = 0
      for (let i = 0; i < note.replies.length; i += 1) {
        const childNote = note.replies[i]
        if (!newDisplayOptions[childNote.id].hidden) {
          numChildrenVisible += 1
        }
        for (let j = 0; j < childNote.replies.length; j += 1) {
          const grandchildNote = childNote.replies[j]
          if (!newDisplayOptions[grandchildNote.id].hidden) {
            numChildrenVisible += 1
          }
        }
      }
      if (newDisplayOptions[note.id].hidden && numChildrenVisible > 0) {
        newDisplayOptions[note.id].hidden = false
        newDisplayOptions[note.id].collapsed = true
      }
      if (!newDisplayOptions[note.id].hidden) {
        numVisible += 1 + numChildrenVisible
      }
      cutoff += 1
    }
    setDisplayOptionsMap(newDisplayOptions)
    cutoffIndex.current = cutoff
    numRepliesVisible.current = numVisible

    typesetMathJax()
    $(
      '.forum-note [data-toggle="tooltip"], .invitation-buttons [data-toggle="tooltip"]'
    ).tooltip({ html: true })
    delayedScroll(layout, scrolled)
  }, [replyNoteMap, orderedReplies, selectedFilters, expandedInvitations, maxLength])

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
      setMaxLength(250)
    }

    if (query.sort) {
      setSort(query.sort)
    }

    const nestingLevel = Number.parseInt(query.nesting, 10)
    if (nestingLevel) {
      setNesting(nestingLevel)
    }
  }, [query])

  // load real-time updates
  const loadUpdates = () =>
    Promise.all([loadNewReplies(), loadNewTags()])
      .then(([newReplies, newTags]) => {
        // If any of the new notes include signatures that are not in the signaturesMap, load them
        // and update the signaturesMap. Assumes only 1 signature per note
        const newSigIds = new Set()
        newReplies.forEach((note) => {
          const sigId = note.signatures[0]
          if (!signaturesMapRef.current[sigId]) {
            newSigIds.add(sigId)
          }
        })
        return loadNewSignatureGroups(newSigIds).then((newGroups) => {
          newGroups.forEach((group) => {
            if (!group) return
            signaturesMapRef.current[group.id] = group
          })
          return [newReplies, newTags]
        })
      })
      .then(([newReplies, newTags]) => {
        const groupedTags = groupBy(newTags, 'note')

        let newMessageAuthor = ''
        let newMessage = ''
        let newMessageId = ''
        let additionalReplyCount = 0
        newReplies.forEach((note) => {
          const invId = note.invitations[0]
          const sigId = note.signatures[0]
          // eslint-disable-next-line no-param-reassign
          note.details.invitation = invitationMapRef.current[invId]?.[0]
          // eslint-disable-next-line no-param-reassign
          note.details.presentation = invitationMapRef.current[invId]?.[1]
          // eslint-disable-next-line no-param-reassign
          note.details.signatures = signaturesMapRef.current[sigId]
            ? [signaturesMapRef.current[sigId]]
            : []
          // eslint-disable-next-line no-param-reassign
          note.details.tags = groupedTags[note.id]

          const isNewNote = updateNote(note)

          // Mark new tags that have already been added to notes
          if (groupedTags[note.id]) {
            groupedTags[note.id] = null
          }

          // Track details of new notes for chat notifications
          if (isNewNote && expandedInvitations?.includes(invId) && !note.ddate) {
            if (!newMessageAuthor) {
              newMessageAuthor = prettyId(sigId, true)
              newMessage = truncate(note.content.message?.value || note.content.title?.value, {
                length: 60,
              })
              newMessageId = note.id
            } else {
              additionalReplyCount += 1
            }
            if (!attachedToBottom.current) {
              setNewMessageCounts((prevCounts) => ({
                ...prevCounts,
                [invId]: (prevCounts[invId] ?? 0) + 1,
              }))
            }
          }
        })

        // Update notes that have new reactions
        const notesToUpdate = {}
        Object.keys(groupedTags).forEach((noteId) => {
          if (!groupedTags[noteId]) return

          let newReactions = replyNoteMap[noteId].reactions
          groupedTags[noteId].forEach((tag) => {
            newReactions = addTagToReactionsList(newReactions, tag)
          })
          notesToUpdate[noteId] = {
            ...replyNoteMap[noteId],
            reactions: newReactions,
          }
        })
        if (!isEmpty(notesToUpdate)) {
          setReplyNoteMap((prevNoteMap) => ({
            ...prevNoteMap,
            ...notesToUpdate,
          }))
        }

        // Set latestMdate to the tmdate of the latest note or tag
        if (newReplies.length > 0 || newTags.length > 0) {
          const latestNote = newReplies[newReplies.length - 1]
          const latestTag = newTags[newTags.length - 1]
          setLatestMdate(Math.max(latestNote?.tmdate || 0, latestTag?.tmdate || 0))
        }

        // Show browser notification
        if (notificationPermissions === 'granted' && showNotifications && newMessageAuthor) {
          const notificationTitle = `New Message in ${
            parentNote.content.title?.value || parentNote.generatedTitle
          }`
          const notif = new Notification(notificationTitle, {
            body:
              additionalReplyCount > 0
                ? `${newMessageAuthor} and ${additionalReplyCount} others posted new messages.`
                : `${newMessageAuthor} posted: ${newMessage}`,
            icon: '/images/openreview_logo_256.png',
            data: {
              noteId: newMessageId,
            },
          })
          notif.onclick = (event) => {
            event.preventDefault()
            window.focus() // Show the browser tab if it's hidden
            setTimeout(() => {
              scrollToElement('.filters-container')
              scrollToChatNote(event.target.data.noteId)
            }, 200)
          }
        }
      })

  useEffect(() => {
    if (!events) return
    loadUpdates()
  }, [events?.uniqueId])

  return (
    <div className="forum-container">
      <ForumNote
        note={parentNote}
        updateNote={updateParentNote}
        deleteOrRestoreNote={deleteOrRestoreNote}
      />

      {repliesLoaded && orderedReplies.length > 0 && (
        <div className="filters-container mt-4">
          {replyForumViews && (
            <FilterTabs
              forumId={id}
              forumViews={replyForumViews}
              replyInvitations={parentNote.replyInvitations}
              newMessageCounts={newMessageCounts}
            />
          )}

          {filterOptions && layout === 'default' && (
            <FilterForm
              forumId={id}
              selectedFilters={selectedFilters}
              setSelectedFilters={(newFilters) => {
                setSelectedFilters(newFilters)
                setMaxLength(250)
              }}
              filterOptions={filterOptions}
              sort={sort}
              setSort={setSort}
              nesting={nesting}
              setNesting={setNesting}
              defaultCollapseLevel={defaultCollapseLevel}
              setDefaultCollapseLevel={setDefaultCollapseLevel}
              numReplies={replyNoteCount.current}
              numRepliesHidden={numRepliesHidden}
            />
          )}
          {filterOptions && layout === 'chat' && (
            <ChatFilterForm
              forumId={id}
              defaultFilters={defaultFilters}
              selectedFilters={selectedFilters}
              setSelectedFilters={(newFilters) => {
                setSelectedFilters(newFilters)
                attachedToBottom.current = true
              }}
              filterOptions={filterOptions}
              numReplies={replyNoteCount.current}
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
                const expired = invitation.expdate < Date.now()

                return (
                  <button
                    key={invitation.id}
                    type="button"
                    className={`btn btn-xs ${
                      activeInvitation?.id === invitation.id ? 'active' : ''
                    } ${expired ? 'expired' : ''}`}
                    data-id={invitation.id}
                    onClick={() => setActiveInvitation(activeInvitation ? null : invitation)}
                    data-toggle="tooltip"
                    data-placement="top"
                    title={
                      expired
                        ? `${prettyInvitationId(invitation.id)} expired ${dayjs(invitation.expdate).fromNow()}`
                        : ''
                    }
                  >
                    {prettyInvitationId(invitation.id)}
                  </button>
                )
              })}
            </div>
            {activeInvitation && (
              <NoteEditor
                note={
                  selectedNoteId && selectedInvitationId && stringToObject(prefilledValues)
                }
                replyToNote={parentNote}
                invitation={activeInvitation}
                className="note-editor-reply depth-even"
                closeNoteEditor={() => {
                  setActiveInvitation(null)
                }}
                onNoteCreated={(note) => {
                  updateNote(note)
                  setActiveInvitation(null)
                  scrollToElement('#forum-replies')
                }}
                isDirectReplyToForum={true}
              />
            )}
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
              {repliesLoaded ? renderReplies() : <LoadingSpinner inline />}
            </ForumReplyContext.Provider>

            {repliesLoaded &&
              cutoffIndex.current < orderedReplies.length &&
              layout !== 'chat' && (
                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-xs btn-default"
                    onClick={() => {
                      const newMaxLength = maxLength + 50
                      if (newMaxLength < numRepliesVisible.current) {
                        setMaxLength(numRepliesVisible.current + 50)
                      } else {
                        setMaxLength(newMaxLength)
                      }
                    }}
                  >
                    View More Replies &rarr;
                  </button>
                </div>
              )}
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
              if (!invitation) {
                return (
                  <p key={invitationId} className="empty-message">
                    You do not have permission to post in this chat.
                  </p>
                )
              }

              return (
                <ChatEditorForm
                  key={invitationId}
                  forumId={id}
                  invitation={invitation}
                  replyToNote={chatReplyNote}
                  setReplyToNote={setChatReplyNote}
                  showNotifications={showNotifications}
                  setShowNotifications={setShowNotifications}
                  signature={signature}
                  setSignature={setSignature}
                  scrollToNote={scrollToChatNote}
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
                    onClick={() => setActiveInvitation(activeInvitation ? null : invitation)}
                  >
                    {prettyInvitationId(invitation.id)}
                  </button>
                ))}
              </div>

              <NoteEditor
                replyToNote={parentNote}
                invitation={activeInvitation}
                closeNoteEditor={() => {
                  setActiveInvitation(null)
                }}
                onNoteCreated={(note) => {
                  updateNote(note)
                  setActiveInvitation(null)
                  scrollToElement('#forum-replies')
                }}
                isDirectReplyToForum={true}
              />
            </>
          )}
        </div>
      )}

      {confirmDeleteModalData && (
        <ConfirmDeleteModal
          note={confirmDeleteModalData.note}
          invitation={confirmDeleteModalData.invitation}
          updateNote={confirmDeleteModalData.updateNote}
          accessToken={accessToken}
          onClose={() => {
            $('#confirm-delete-modal').modal('hide')
            setConfirmDeleteModalData(null)
          }}
        />
      )}
    </div>
  )
}
