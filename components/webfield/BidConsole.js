/* globals typesetMathJax,promptError: false */

import { useCallback, useContext, useEffect, useState } from 'react'
import debounce from 'lodash/debounce'
import kebabCase from 'lodash/kebabCase'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import useQuery from '../../hooks/useQuery'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import { prettyInvitationId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
import PaginationLinks from '../PaginationLinks'
import ErrorDisplay from '../ErrorDisplay'
import NoteListWithBidWidget from '../NoteListWithBidWidget'

const buildArray = (invitation, fieldName, profileId, noteNumber) => {
  if (invitation.reply?.[fieldName]?.values) return invitation.reply[fieldName].values
  if (invitation.reply?.[fieldName]?.['values-copied'])
    return invitation.reply[fieldName]['values-copied']
      .map((value) => {
        if (value === '{signatures}') return profileId
        if (value[0] === '{') return null
        return value
      })
      .filter((p) => p)
  if (invitation.reply?.[fieldName]?.['values-regex'])
    return invitation.reply[fieldName]['values-regex']
      .split('|')
      .map((value) => {
        if (value.indexOf('Paper.*') !== -1)
          return value.replace('Paper.*', `Paper${noteNumber}`)
        return value
      })
      .filter((p) => p)
  return []
}

const getDdate = (existingBidToDelete, apiVersion) => {
  if (existingBidToDelete) return Date.now()
  if (apiVersion === 2) return { delete: true }
  return null
}

const getBidObjectToPost = (
  id,
  updatedOption,
  invitation,
  note,
  userId,
  ddate,
  apiVersion
) => ({
  id,
  invitation: invitation.id,
  label: updatedOption,
  head: note.id,
  tail: userId,
  signatures: [userId],
  ...(apiVersion !== 2 && {
    readers: buildArray(invitation, 'readers', userId, note.number),
    nonreaders: buildArray(invitation, 'nonreaders', userId, note.number),
    writers: buildArray(invitation, 'writers', userId, note.number),
  }),
  ddate,
})

const AllSubmissionsTab = ({ bidEdges, setBidEdges, conflictIds, bidOptions }) => {
  const {
    venueId,
    entity: invitation,
    apiVersion,
    scoreIds,
    submissionInvitationId,
    submissionVenueId,
  } = useContext(WebFieldContext)
  const [notes, setNotes] = useState([])
  const [selectedScore, setSelectedScore] = useState(scoreIds?.[0])
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { user, accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [scoreEdges, setScoreEdges] = useState([])
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)
  const sortOptions = scoreIds.map((p) => ({ label: prettyInvitationId(p), value: p }))
  const pageSize = 50

  const getNotesSortedByAffinity = async (score = selectedScore, limit = 50) => {
    setIsLoading(true)
    const getNotesBySubmissionInvitationP = async () => {
      const result = await api.get(
        '/notes',
        {
          ...(apiVersion !== 2 && { invitation: submissionInvitationId }),
          ...(apiVersion === 2 && { 'content.venueid': submissionVenueId }),
          offset: (pageNumber - 1) * pageSize,
          limit,
        },
        { accessToken, version: apiVersion }
      )
      return {
        ...result,
        notes: result.notes.filter((p) => !conflictIds.includes(p.id)),
      }
    }

    try {
      if (score) {
        const edgesResult = await api.get(
          '/edges',
          {
            invitation: score,
            tail: user.profile.id,
            sort: 'weight:desc',
            offset: (pageNumber - 1) * pageSize,
            limit,
          },
          { accessToken, version: apiVersion }
        )
        if (edgesResult.count) {
          setTotalCount(edgesResult.count)
          setScoreEdges(edgesResult.edges)
          const noteIds = edgesResult.edges.map((p) => p.head)
          const notesResult = await api.post(
            '/notes/search',
            { ids: noteIds },
            { accessToken, version: apiVersion }
          )
          const filteredNotes = noteIds.flatMap((noteId) => {
            const matchingNote = notesResult.notes.find((p) => p.id === noteId)
            const isActiveSubmission =
              apiVersion === 2
                ? matchingNote?.content?.venueid?.value === submissionVenueId
                : matchingNote.invitation === submissionInvitationId
            if (matchingNote && isActiveSubmission && !conflictIds.includes(noteId)) {
              return matchingNote
            }
            return []
          })
          setNotes(filteredNotes)
        } else {
          const notesResult = await getNotesBySubmissionInvitationP()
          setNotes(notesResult.notes)
          setTotalCount(notesResult.count)
        }
      } else {
        const notesResult = await getNotesBySubmissionInvitationP()
        setNotes(notesResult.notes)
        setTotalCount(notesResult.count)
      }
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  const getNotesBySearchTerm = async (term) => {
    setIsLoading(true)
    try {
      const result = await api.get(
        '/notes/search',
        {
          term,
          type: 'terms',
          content: 'all',
          source: 'forum',
          ...(apiVersion !== 2 && { group: venueId }),
          limit: 1000,
          offset: 0,
          ...(apiVersion !== 2 && { invitation: submissionInvitationId }),
          ...(apiVersion === 2 && { venueid: submissionVenueId }),
        },
        { accessToken, version: apiVersion }
      )
      setNotes(result.notes.filter((p) => !conflictIds.includes(p.id)))
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  const updateBidOption = async (note, updatedOption) => {
    const existingBidToDelete = bidEdges.find(
      (p) => p.head === note.id && p.label === updatedOption
    )
    const existingBidToUpdate = bidEdges.find((p) => p.head === note.id)
    const ddate = getDdate(existingBidToDelete, apiVersion)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(
          bidId,
          updatedOption,
          invitation,
          note,
          user.profile.id,
          ddate,
          apiVersion
        ),
        { accessToken, version: apiVersion }
      )
      let updatedBidEdges = bidEdges
      if (existingBidToDelete) {
        updatedBidEdges = bidEdges.filter((p) => p.id !== existingBidToDelete.id)
        setBidEdges(updatedBidEdges)
        return
      }

      setBidEdges([...bidEdges.filter((p) => p.id !== existingBidToUpdate?.id), result])
    } catch (error) {
      promptError(error.message)
      setBidUpdateStatus((status) => !status)
    }
  }

  const handleSearchTermChange = (updatedSearchTerm) => {
    const cleanSearchTerm = updatedSearchTerm.trim()
    if (cleanSearchTerm) {
      getNotesBySearchTerm(cleanSearchTerm)
    } else {
      getNotesSortedByAffinity()
    }
    setSearchTerm(updatedSearchTerm)
  }

  const handleScoreDropdownChange = (scoreSelected) => {
    setPageNumber(1)
    setSelectedScore(scoreSelected)
    getNotesSortedByAffinity(scoreSelected)
  }

  const delaySearch = useCallback(
    debounce((term) => handleSearchTermChange(term), 200),
    []
  )

  useEffect(() => {
    if (notes.length) {
      typesetMathJax()
    }
  }, [notes])

  useEffect(() => {
    getNotesSortedByAffinity()
  }, [pageNumber])

  return (
    <>
      <form className="form-inline notes-search-form" role="search">
        <div className="form-group search-content has-feedback">
          <input
            id="paper-search-input"
            type="text"
            className="form-control"
            placeholder="Search by paper title and metadata"
            autoComplete="off"
            value={immediateSearchTerm}
            onChange={(e) => {
              setImmediateSearchTerm(e.target.value)
              if (e.target.value.trim().length >= 3) delaySearch(e.target.value)
              if (e.target.value.trim().length === 0) handleSearchTermChange('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && immediateSearchTerm.trim().length >= 2) {
                handleSearchTermChange(immediateSearchTerm)
              }
            }}
          />
          <Icon name="search" extraClasses="form-control-feedback" />
        </div>
        {scoreIds.length > 0 && (
          <div className="form-group score">
            <label htmlFor="score-dropdown">Sort By:</label>
            <Dropdown
              className="dropdown-select"
              options={sortOptions}
              placeholder="Select a score to sort by"
              value={sortOptions.find((p) => p.value === selectedScore)}
              onChange={(e) => handleScoreDropdownChange(e.value)}
            />
          </div>
        )}
      </form>
      {isLoading ? (
        <LoadingSpinner inline />
      ) : (
        <>
          <NoteListWithBidWidget
            notes={notes}
            bidOptions={bidOptions}
            bidEdges={bidEdges}
            scoreEdges={scoreEdges}
            displayOptions={{
              emptyMessage: 'No papers to display at this time',
              showContents: true,
              collapse: true,
              pdfLink: true,
            }}
            updateBidOption={updateBidOption}
            apiVersion={apiVersion}
            bidUpdateStatus={bidUpdateStatus}
          />
          {!searchTerm && (
            <PaginationLinks
              currentPage={pageNumber}
              itemsPerPage={pageSize}
              totalCount={totalCount}
              setCurrentPage={setPageNumber}
            />
          )}
        </>
      )}
    </>
  )
}

const NoBidTab = ({
  scoreIds,
  bidOptions,
  submissionInvitationId,
  submissionVenueId,
  invitation,
  bidEdges,
  setBidEdges,
  conflictIds,
  apiVersion,
}) => {
  const [notes, setNotes] = useState([])
  const [scoreEdges, setScoreEdges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, accessToken } = useUser()
  const selectedScore = scoreIds[0]
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)

  const getNotesWithNoBids = async () => {
    setIsLoading(true)

    const getNotesBySubmissionInvitation = async () => {
      const result = await api.get(
        '/notes',
        {
          ...(apiVersion !== 2 && { invitation: submissionInvitationId }),
          ...(apiVersion === 2 && { 'content.venueid': submissionVenueId }),
          limit: 1000,
        },
        { accessToken, version: apiVersion }
      )
      return {
        ...result,
        notes: result.notes.filter(
          (p) => !conflictIds.includes(p.id) && !bidEdges.find((q) => q.head === p.id)
        ),
      }
    }

    try {
      if (selectedScore) {
        const edgesResult = await api.get(
          '/edges',
          {
            invitation: selectedScore,
            tail: user.profile.id,
            sort: 'weight:desc',
          },
          { accessToken, version: apiVersion }
        )
        if (edgesResult.count) {
          setScoreEdges(edgesResult.edges)
          const noteIds = edgesResult.edges.map((p) => p.head)
          const notesResult = await api.post(
            '/notes/search',
            { ids: noteIds },
            { accessToken, version: apiVersion }
          )
          const filteredNotes = noteIds.flatMap((noteId) => {
            const matchingNote = notesResult.notes.find((p) => p.id === noteId)
            const isActiveSubmission =
              apiVersion === 2
                ? matchingNote?.content?.venueid?.value === submissionVenueId
                : matchingNote.invitation === submissionInvitationId
            if (
              matchingNote &&
              isActiveSubmission &&
              !conflictIds.includes(noteId) &&
              !bidEdges.find((p) => p.head === noteId)
            ) {
              return matchingNote
            }
            return []
          })
          setNotes(filteredNotes)
        } else {
          const notesResult = await getNotesBySubmissionInvitation()
          setNotes(notesResult.notes)
        }
      } else {
        const notesResult = await getNotesBySubmissionInvitation()
        setNotes(notesResult.notes)
      }
    } catch (error) {
      promptError(error.message)
    }

    setIsLoading(false)
  }

  const updateBidOption = async (note, updatedOption) => {
    const existingBidToDelete = bidEdges.find(
      (p) => p.head === note.id && p.label === updatedOption
    )
    const existingBidToUpdate = bidEdges.find((p) => p.head === note.id)
    const ddate = getDdate(existingBidToDelete, apiVersion)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(
          bidId,
          updatedOption,
          invitation,
          note,
          user.profile.id,
          ddate,
          apiVersion
        ),
        { accessToken, version: apiVersion }
      )
      let updatedBidEdges = bidEdges
      if (existingBidToDelete) {
        updatedBidEdges = bidEdges.filter((p) => p.id !== existingBidToDelete.id)
        setBidEdges(updatedBidEdges)
        setNotes((notes) => notes.filter((p) => p.id !== note.id)) // eslint-disable-line no-shadow
        return
      }

      setBidEdges([...bidEdges.filter((p) => p.id !== existingBidToUpdate?.id), result])
      setNotes((notes) => notes.filter((p) => p.id !== note.id)) // eslint-disable-line no-shadow
    } catch (error) {
      promptError(error.message)
      setBidUpdateStatus((status) => !status)
    }
  }

  useEffect(() => {
    getNotesWithNoBids()
  }, [])

  if (isLoading) return <LoadingSpinner inline />

  return (
    <NoteListWithBidWidget
      notes={notes}
      bidOptions={bidOptions}
      bidEdges={bidEdges}
      scoreEdges={scoreEdges}
      displayOptions={{
        emptyMessage: 'No papers to display at this time',
        showContents: true,
        collapse: true,
        pdfLink: true,
      }}
      updateBidOption={updateBidOption}
      virtualList={true}
      apiVersion={apiVersion}
      bidUpdateStatus={bidUpdateStatus}
    />
  )
}

const BidOptionTab = ({
  bidOptions,
  bidOption,
  bidEdges,
  invitation,
  setBidEdges,
  apiVersion,
}) => {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, accessToken } = useUser()
  const noteIds = bidEdges.filter((p) => p.label === bidOption).map((q) => q.head)
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)

  const getNotesByBids = async () => {
    setIsLoading(true)
    if (!noteIds?.length) {
      setIsLoading(false)
      return
    }
    try {
      const noteSearchResults = await api.post(
        '/notes/search',
        {
          ids: noteIds,
        },
        { accessToken, version: apiVersion }
      )
      setNotes(noteSearchResults.notes)
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  const updateBidOption = async (note, updatedOption) => {
    const existingBidToDelete = bidEdges.find(
      (p) => p.head === note.id && p.label === updatedOption
    )
    const existingBidToUpdate = bidEdges.find((p) => p.head === note.id)
    const ddate = getDdate(existingBidToDelete, apiVersion)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(
          bidId,
          updatedOption,
          invitation,
          note,
          user.profile.id,
          ddate,
          apiVersion
        ),
        { accessToken, version: apiVersion }
      )
      let updatedBidEdges = bidEdges
      if (existingBidToDelete) {
        updatedBidEdges = bidEdges.filter((p) => p.id !== existingBidToDelete.id)
        setBidEdges(updatedBidEdges)
        setNotes((notes) => notes.filter((p) => p.id !== note.id)) // eslint-disable-line no-shadow
        return
      }

      setBidEdges([...bidEdges.filter((p) => p.id !== existingBidToUpdate?.id), result])
      setNotes((notes) => notes.filter((p) => p.id !== note.id)) // eslint-disable-line no-shadow
    } catch (error) {
      promptError(error.message)
      setBidUpdateStatus((status) => !status)
    }
  }

  useEffect(() => {
    if (notes.length) {
      typesetMathJax()
    }
  }, [notes])

  useEffect(() => {
    getNotesByBids()
  }, [])

  if (isLoading) return <LoadingSpinner inline />
  return (
    <NoteListWithBidWidget
      notes={notes}
      bidOptions={bidOptions}
      bidEdges={bidEdges}
      displayOptions={{
        emptyMessage: 'No papers to display at this time',
        showContents: true,
        collapse: true,
        pdfLink: true,
      }}
      updateBidOption={updateBidOption}
      apiVersion={apiVersion}
      bidUpdateStatus={bidUpdateStatus}
    />
  )
}

const BidConsole = ({ appContext }) => {
  const {
    header,
    venueId,
    entity: invitation,
    apiVersion,
    scoreIds,
    submissionInvitationId,
    submissionVenueId,
    bidInvitationId,
    conflictInvitationId,
  } = useContext(WebFieldContext)

  const bidOptions =
    apiVersion === 2
      ? invitation.edge?.label?.param?.enum
      : invitation.reply?.content?.label?.['value-radio']
  const bidOptionsWithDefaultTabs = ['All Papers', ...(bidOptions ?? []), 'No Bid']
  const getActiveTabIndex = () => {
    const tabIndex = bidOptionsWithDefaultTabs.findIndex(
      (p) => `#${kebabCase(p)}` === window.location.hash
    )
    return tabIndex < 0 ? 0 : tabIndex
  }

  const [activeTabIndex, setActiveTabIndex] = useState(() => getActiveTabIndex())
  const [isLoading, setIsLoading] = useState(true)
  const [bidEdges, setBidEdges] = useState([])
  const [conflictIds, setConflictIds] = useState([])
  const { setBannerContent } = appContext
  const { accessToken, user } = useUser()
  const query = useQuery()

  const getBidAndConflictEdges = async () => {
    try {
      const bidEdgeResultsP = api.getAll(
        '/edges',
        { invitation: invitation.id, tail: user.profile.id },
        { accessToken, version: apiVersion }
      )
      const conflictEdgeResultsP = api.getAll(
        '/edges',
        { invitation: conflictInvitationId, tail: user.profile.id },
        { accessToken, version: apiVersion }
      )
      const results = await Promise.all([bidEdgeResultsP, conflictEdgeResultsP])
      setBidEdges(results[0])
      setConflictIds(results[1]?.map((p) => p.head))
      setIsLoading(false)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    getBidAndConflictEdges()
  }, [])

  const renderActiveTab = () => {
    const id = kebabCase(bidOptionsWithDefaultTabs[activeTabIndex])
    if (activeTabIndex === 0)
      return (
        <TabPanel id={id}>
          <AllSubmissionsTab
            bidEdges={bidEdges}
            setBidEdges={setBidEdges}
            conflictIds={conflictIds}
            bidOptions={bidOptions}
          />
        </TabPanel>
      )
    if (activeTabIndex === bidOptionsWithDefaultTabs.length - 1)
      return (
        <TabPanel id={id}>
          <NoBidTab
            scoreIds={scoreIds}
            bidOptions={bidOptions}
            submissionInvitationId={submissionInvitationId}
            submissionVenueId={submissionVenueId}
            invitation={invitation}
            bidEdges={bidEdges}
            setBidEdges={setBidEdges}
            conflictIds={conflictIds}
            apiVersion={apiVersion}
          />
        </TabPanel>
      )
    const bidOption = bidOptionsWithDefaultTabs[activeTabIndex]
    return (
      <TabPanel id={id} key={id}>
        <BidOptionTab
          bidOptions={bidOptions}
          bidOption={bidOption}
          bidEdges={bidEdges}
          invitation={invitation}
          setBidEdges={setBidEdges}
          apiVersion={apiVersion}
        />
      </TabPanel>
    )
  }

  const missingConfig = Object.entries({
    header,
    venueId,
    invitation,
    apiVersion,
    scoreIds,
    ...(apiVersion !== 2 && { submissionInvitationId }),
    ...(apiVersion === 2 && { submissionVenueId }),
    conflictInvitationId,
    bidOptions,
  }).filter(([key, value]) => value === undefined)
  if (missingConfig?.length) {
    const errorMessage = `Bidding Console is missing required properties: ${missingConfig
      .map((p) => p[0])
      .join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header?.instructions}
        options={{
          extra: <h4 id="bidcount">You have completed {bidEdges.length} bids</h4>,
        }}
      />

      {isLoading ? (
        <LoadingSpinner inline />
      ) : (
        <Tabs>
          <TabList>
            {bidOptionsWithDefaultTabs?.map((bidOption, index) => {
              const id = kebabCase(bidOption)
              const bidCountByOption = bidEdges.filter((p) => p.label === bidOption).length
              return (
                <Tab
                  key={id}
                  id={id}
                  {...(index === activeTabIndex ? { active: true } : {})}
                  icon={index === 0 ? 'search' : undefined}
                  onClick={() => {
                    window.location.hash = id
                    setActiveTabIndex(() => getActiveTabIndex())
                  }}
                >
                  {bidOption}
                  {bidCountByOption !== 0 && <span className="badge">{bidCountByOption}</span>}
                </Tab>
              )
            })}
          </TabList>

          <TabPanels>{renderActiveTab()}</TabPanels>
        </Tabs>
      )}
    </>
  )
}

export default BidConsole
