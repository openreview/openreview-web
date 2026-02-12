/* globals promptError: false */

import { useState, useEffect, useCallback } from 'react'
import keyBy from 'lodash/keyBy'
import kebabCase from 'lodash/kebabCase'
import escapeRegExp from 'lodash/escapeRegExp'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from './Tabs'
import PaginatedList from './PaginatedList'
import Note, { NoteV2 } from './Note'
import { BidRadioButtonGroup } from './webfield/BidWidget'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { prettyInvitationId } from '../lib/utils'
import { buildNoteSearchText } from '../lib/edge-utils'

import styles from '../styles/components/ExpertiseSelector.module.scss'

const paperDisplayOptions = {
  pdfLink: true,
  replyCount: false,
  showContents: true,
  collapse: true,
  showEdges: true,
}

export default function ExpertiseSelector({ invitation, venueId, apiVersion, shouldReload }) {
  const { user, isRefreshing } = useUser()
  const [edgesMap, setEdgesMap] = useState(null)
  const [userNotes, setUserNotes] = useState(null)

  const options =
    apiVersion === 2
      ? invitation.edge?.label?.param?.enum
      : invitation.reply?.content?.label?.['value-radio']
  const invitationOption = options?.[0] || 'Exclude'
  const tabLabel = `${invitationOption}d Papers`
  const tabId = kebabCase(tabLabel)

  const selectedIds =
    userNotes && edgesMap
      ? Object.keys(edgesMap).filter(
          (noteId) => userNotes.find((n) => n.id === noteId) && !edgesMap[noteId].ddate
        )
      : null

  const loadNotePage = useCallback(
    (limit, offset) =>
      Promise.resolve({
        items: userNotes.slice(offset, offset + limit),
        count: userNotes.length,
      }),
    [userNotes]
  )

  const loadSelectedPage = useCallback(
    (limit, offset) => {
      const selectedNotes = userNotes.filter((note) => selectedIds.includes(note.id))
      return Promise.resolve({
        items: selectedNotes.slice(offset, offset + limit),
        count: selectedNotes.length,
      })
    },
    [userNotes, selectedIds]
  )

  const loadSearchPage = useCallback(
    (term, limit, offset) => {
      const searchRegex = new RegExp(`\\b${escapeRegExp(term)}`, 'mi')
      const filteredNotes = userNotes.filter((note) => note.searchText?.match(searchRegex))
      return Promise.resolve({
        items: filteredNotes.slice(offset, offset + limit),
        count: filteredNotes.length,
      })
    },
    [userNotes]
  )

  const toggleEdge = async (noteId, value) => {
    const existingEdge = edgesMap[noteId]
    let ddate = {}
    if (existingEdge && existingEdge.label === value) {
      if (existingEdge.ddate) {
        // Un-delete the edge
        ddate = apiVersion === 2 ? { ddate: { delete: true } } : { ddate: null }
      } else {
        // Delete the edge
        ddate = { ddate: Date.now() }
      }
    }

    try {
      const res = await api.post(
        '/edges',
        {
          ...(existingEdge ? { id: existingEdge.id } : {}),
          invitation: invitation.id,
          readers: [venueId, user.profile.id],
          writers: [venueId, user.profile.id],
          signatures: [user.profile.id],
          head: noteId,
          tail: user.profile.id,
          label: value,
          ...ddate,
        },
        { version: apiVersion }
      )
      setEdgesMap({
        ...edgesMap,
        [noteId]: res,
      })
      return res
    } catch (error) {
      promptError(error.message)
      return null
    }
  }

  function NoteListItem({ item }) {
    const edge = edgesMap[item.id]

    return (
      <>
        {item.apiVersion === 2 ? (
          <NoteV2 note={item} options={paperDisplayOptions} />
        ) : (
          <Note note={item} options={paperDisplayOptions} />
        )}
        <BidRadioButtonGroup
          label={prettyInvitationId(invitation.id)}
          options={options}
          selectedBidOption={!edge || edge.ddate ? undefined : edge.label}
          updateBidOption={(value) => toggleEdge(item.id, value)}
          className="mb-2"
        />
      </>
    )
  }

  const markTaskAsComplete = async () => {
    try {
      await api.post(
        '/edges',
        {
          invitation: invitation.id,
          readers: [venueId, user.profile.id],
          writers: [venueId, user.profile.id],
          signatures: [user.profile.id],
          head: 'xf0zSBd2iufMg', // OpenReview paper
          tail: user.profile.id,
          label: invitationOption,
        },
        { version: apiVersion }
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error marking invitation as completed: ${error.message}`)
    }
  }

  useEffect(() => {
    if (isRefreshing || !user) return

    const loadNotes = async () => {
      try {
        // Only get authored notes readable by everyone
        const { notes } = await api.getCombined(
          '/notes',
          {
            'content.authorids': user.profile.id,
            sort: 'cdate',
            details: 'invitation',
          },
          null,
          { includeVersion: true }
        )
        const publicNotes = notes.filter((note) => note.readers.includes('everyone'))
        publicNotes.forEach((note) => {
          // eslint-disable-next-line no-param-reassign
          note.searchText = buildNoteSearchText(note, note.apiVersion === 2)
        })
        setUserNotes(publicNotes)
      } catch (error) {
        promptError(error.message)
        setUserNotes([])
      }
    }

    const loadEdges = async () => {
      try {
        const edges = await api.getAll(
          '/edges',
          {
            invitation: invitation.id,
            tail: user.profile.id,
          },
          { version: apiVersion }
        )
        setEdgesMap(keyBy(edges, 'head'))
      } catch (error) {
        promptError(error.message)
        setEdgesMap({})
      }
    }

    loadNotes()
    loadEdges()
  }, [isRefreshing, user, shouldReload])

  useEffect(() => {
    // Mark task as complete if the invitation is an "Exclude" type and it's the
    // first time the user is visiting the page
    if (
      invitationOption === 'Exclude' &&
      userNotes &&
      edgesMap &&
      Object.keys(edgesMap).length === 0
    ) {
      markTaskAsComplete()
    }
  }, [invitation.id, userNotes, edgesMap])

  if (isRefreshing) return <LoadingSpinner />

  if (!user) {
    return <ErrorAlert error={{ message: 'You must be logged in to select your expertise' }} />
  }

  return (
    <Tabs className={styles.container}>
      <TabList>
        <Tab id="all-your-papers" icon="search" active>
          All Your Papers
        </Tab>
        <Tab id={tabId} headingCount={selectedIds?.length}>
          {tabLabel}
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="all-your-papers">
          {userNotes && edgesMap ? (
            <PaginatedList
              loadItems={loadNotePage}
              searchItems={loadSearchPage}
              ListItem={NoteListItem}
              itemsPerPage={15}
              className="submissions-list"
              enableSearch
            />
          ) : (
            <LoadingSpinner inline />
          )}
        </TabPanel>
        <TabPanel id={tabId}>
          {selectedIds?.length > 0 ? (
            <PaginatedList
              loadItems={loadSelectedPage}
              ListItem={NoteListItem}
              itemsPerPage={15}
              className="submissions-list"
            />
          ) : (
            <p className="empty-message">No {tabLabel.toLowerCase()} to display</p>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
