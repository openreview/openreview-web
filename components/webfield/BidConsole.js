/* globals typesetMathJax,promptError: false */

import { useCallback, useContext, useEffect, useReducer, useState } from 'react'
import debounce from 'lodash/debounce'
import kebabCase from 'lodash/kebabCase'
import { useSearchParams } from 'next/navigation'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import { pluralizeString, prettyField, prettyInvitationId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
import PaginationLinks from '../PaginationLinks'
import ErrorDisplay from '../ErrorDisplay'
import NoteListWithBidWidget from '../NoteListWithBidWidget'

const getDdate = (existingBidToDelete) => {
  if (existingBidToDelete) return Date.now()
  return { delete: true }
}

const getBidObjectToPost = (id, updatedOption, invitation, note, userId, ddate) => ({
  id,
  invitation: invitation.id,
  label: updatedOption,
  head: note.id,
  tail: userId,
  signatures: [userId],
  ddate,
})

const AllSubmissionsTab = ({
  bidEdges,
  setBidEdges,
  conflictIds,
  bidOptions,
  user,
  accessToken,
}) => {
  const {
    entity: invitation,
    scoreIds,
    submissionVenueId,
    subjectAreas,
    subjectAreasName,
    enableSearch = true,
  } = useContext(WebFieldContext)
  const defaultSubjectArea = subjectAreasName
    ? `All ${prettyField(subjectAreasName)}`
    : 'All Subject Areas'
  const [notes, setNotes] = useState([])
  const [pageNumber, setPageNumber] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [scoreEdges, setScoreEdges] = useState([])
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)
  const [showPagination, setShowPagination] = useState(true)
  const [showBidScore, setShowBidScore] = useState(true)

  const sortOptions = scoreIds?.map((p) => ({ label: prettyInvitationId(p), value: p }))
  const subjectAreaOptions = subjectAreas?.length
    ? [
        {
          label: `All ${subjectAreasName ? prettyField(subjectAreasName) : 'Subject Areas'}`,
          value: `All ${subjectAreasName ? prettyField(subjectAreasName) : 'Subject Areas'}`,
        },
      ].concat(
        subjectAreasName
          ? subjectAreas.map((p) => ({ label: p.description, value: p.value }))
          : subjectAreas.map((p) => ({ label: p, value: p }))
      )
    : []
  const pageSize = 50

  const searchStateReducer = (state, action) => {
    switch (action.type) {
      case 'selectedScore':
        return {
          selectedScore: action.payload,
          selectedSubjectArea: defaultSubjectArea,
          immediateSearchTerm: '',
          searchTerm: '',
          source: 'selectedScore',
        }
      case 'selectedSubjectArea':
        return {
          selectedScore: scoreIds?.[0],
          selectedSubjectArea: action.payload,
          immediateSearchTerm: '',
          searchTerm: '',
          source: 'selectedSubjectArea',
        }
      case 'immediateSearchTerm':
        return {
          selectedScore: scoreIds?.[0],
          selectedSubjectArea: defaultSubjectArea,
          immediateSearchTerm: action.payload,
          searchTerm: state.searchTerm,
          source: 'immediateSearchTerm',
        }
      case 'searchTerm':
        return {
          selectedScore: scoreIds?.[0],
          selectedSubjectArea: defaultSubjectArea,
          immediateSearchTerm: state.immediateSearchTerm,
          searchTerm: action.payload,
          source: 'searchTerm',
        }
      default:
        return state
    }
  }
  const [searchState, setSearchState] = useReducer(searchStateReducer, {
    selectedScore: scoreIds?.[0],
    selectedSubjectArea: defaultSubjectArea,
    immediateSearchTerm: '',
    searchTerm: '',
  })

  const getNotesSortedByAffinity = async (score = searchState.selectedScore, limit = 50) => {
    setIsLoading(true)
    const getNotesBySubmissionInvitationP = async () => {
      const result = await api.get(
        '/notes',
        {
          'content.venueid': submissionVenueId,
          offset: (pageNumber - 1) * pageSize,
          limit,
          domain: invitation.domain,
        },
        { accessToken }
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
            domain: invitation.domain,
          },
          { accessToken }
        )
        if (edgesResult.count) {
          setTotalCount(edgesResult.count)
          setScoreEdges(edgesResult.edges)
          const noteIds = edgesResult.edges.map((p) => p.head)
          const notesResult = await api.post(
            '/notes/search',
            { ids: noteIds },
            { accessToken }
          )
          const filteredNotes = noteIds.flatMap((noteId) => {
            const matchingNote = notesResult.notes.find((p) => p.id === noteId)
            const isActiveSubmission =
              matchingNote?.content?.venueid?.value === submissionVenueId
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
          limit: 200,
          offset: 0,
          venueid: submissionVenueId,
        },
        { accessToken }
      )
      setNotes(result.notes.filter((p) => !conflictIds.includes(p.id)).slice(0, 100))
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
    const ddate = getDdate(existingBidToDelete)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(bidId, updatedOption, invitation, note, user.profile.id, ddate),
        { accessToken }
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

  const handleSubjectAreaDropdownChange = async (subjectAreaSelected) => {
    if (subjectAreaSelected === defaultSubjectArea) {
      getNotesSortedByAffinity()
      return
    }
    setIsLoading(true)
    try {
      if (subjectAreasName) {
        const notesResult = await api
          .get(
            '/notes',
            {
              'content.venueid': submissionVenueId,
              domain: invitation.domain,
              stream: true,
            },
            { accessToken }
          )
          .then((result) => result.notes)
        setNotes(
          notesResult.filter(
            (p) => p.content?.[subjectAreasName]?.value === subjectAreaSelected
          )
        )
      } else {
        const result = await api.get(
          '/notes/search',
          {
            term: subjectAreaSelected,
            type: 'terms',
            content: 'subject_areas',
            source: 'forum',
            limit: 200,
            offset: 0,
            venueid: submissionVenueId,
          },
          { accessToken }
        )
        setNotes(result.notes.filter((p) => !conflictIds.includes(p.id)).slice(0, 100))
      }
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  const delaySearch = useCallback(
    // debounce((term) => handleSearchTermChange(term), 200),
    debounce((term) => setSearchState({ type: 'searchTerm', payload: term }), 200),
    []
  )

  useEffect(() => {
    if (notes.length) {
      typesetMathJax()
    }
  }, [notes])

  useEffect(() => {
    if (!pageNumber) return
    getNotesSortedByAffinity()
  }, [pageNumber])

  useEffect(() => {
    if (searchState.source === 'searchTerm' && searchState.searchTerm) {
      getNotesBySearchTerm(searchState.searchTerm)
      setShowPagination(false)
      setShowBidScore(false)
      return
    }
    if (
      searchState.source === 'selectedScore' &&
      searchState.selectedScore !== scoreIds?.[0]
    ) {
      getNotesSortedByAffinity(searchState.selectedScore)
      setShowPagination(true)
      setShowBidScore(true)
      setPageNumber(1)
      return
    }
    if (searchState.source === 'selectedSubjectArea') {
      handleSubjectAreaDropdownChange(searchState.selectedSubjectArea)
      setShowPagination(searchState.selectedSubjectArea === defaultSubjectArea)
      setShowBidScore(searchState.selectedSubjectArea === defaultSubjectArea)
      return
    }
    if (searchState.source === 'immediateSearchTerm') {
      if (searchState.immediateSearchTerm === '') {
        getNotesSortedByAffinity()
        setShowPagination(true)
        setShowBidScore(true)
      }
      return
    }
    setPageNumber(1)
    setShowPagination(true)
    setShowBidScore(true)
  }, [searchState])

  return (
    <>
      <form
        className="form-inline notes-search-form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (searchState.immediateSearchTerm.trim().length >= 2) {
            setSearchState({
              type: 'searchTerm',
              payload: searchState.immediateSearchTerm,
            })
          }
        }}
      >
        {enableSearch && (
          <div className="form-group search-content has-feedback">
            <input
              id="paper-search-input"
              type="text"
              className="form-control"
              placeholder="Search by paper title and metadata"
              autoComplete="off"
              value={searchState.immediateSearchTerm}
              onChange={(e) => {
                setSearchState({ type: 'immediateSearchTerm', payload: e.target.value })
                if (e.target.value.trim().length >= 3) delaySearch(e.target.value)
              }}
            />
            <Icon name="search" extraClasses="form-control-feedback" />
          </div>
        )}
        {scoreIds?.length > 0 && (
          <div className="form-group score">
            <label htmlFor="score-dropdown">Sort By:</label>
            <Dropdown
              className="dropdown-select"
              options={sortOptions}
              value={sortOptions.find((p) => p.value === searchState.selectedScore)}
              onChange={(e) => setSearchState({ type: 'selectedScore', payload: e.value })}
            />
          </div>
        )}
        {subjectAreas?.length > 0 && (
          <div className="form-group">
            <label htmlFor="subjectarea-dropdown">
              {subjectAreasName ? prettyField(subjectAreasName) : 'Subject Area'}:
            </label>
            <Dropdown
              className="dropdown-select subjectarea"
              options={subjectAreaOptions}
              value={subjectAreaOptions.find(
                (p) => p.value === searchState.selectedSubjectArea
              )}
              onChange={(e) =>
                setSearchState({ type: 'selectedSubjectArea', payload: e.value })
              }
            />
          </div>
        )}
        <button type="submit" style={{ display: 'none' }} />
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
            bidUpdateStatus={bidUpdateStatus}
            showBidScore={showBidScore}
          />
          {showPagination && (
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
  submissionVenueId,
  invitation,
  bidEdges,
  setBidEdges,
  conflictIds,
  user,
  accessToken,
}) => {
  const [notes, setNotes] = useState([])
  const [scoreEdges, setScoreEdges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const selectedScore = scoreIds[0]
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)

  const getNotesWithNoBids = async () => {
    setIsLoading(true)

    const getNotesBySubmissionInvitation = async () => {
      const result = await api.get(
        '/notes',
        {
          'content.venueid': submissionVenueId,
          limit: 1000,
          domain: invitation.domain,
        },
        { accessToken }
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
            domain: invitation.domain,
          },
          { accessToken }
        )
        if (edgesResult.count) {
          setScoreEdges(edgesResult.edges)
          const noteIds = edgesResult.edges.map((p) => p.head)
          const notesResult = await api.post(
            '/notes/search',
            { ids: noteIds },
            { accessToken }
          )
          const filteredNotes = noteIds.flatMap((noteId) => {
            const matchingNote = notesResult.notes.find((p) => p.id === noteId)
            const isActiveSubmission =
              matchingNote?.content?.venueid?.value === submissionVenueId
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
    const ddate = getDdate(existingBidToDelete)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(bidId, updatedOption, invitation, note, user.profile.id, ddate),
        { accessToken }
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
  user,
  accessToken,
}) => {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
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
        { accessToken }
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
    const ddate = getDdate(existingBidToDelete)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(bidId, updatedOption, invitation, note, user.profile.id, ddate),
        { accessToken }
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
      bidUpdateStatus={bidUpdateStatus}
    />
  )
}

// only work with v2 api
const BidConsole = ({ appContext }) => {
  const {
    header,
    venueId,
    entity: invitation,
    scoreIds,
    submissionVenueId,
    conflictInvitationId,
    subjectAreas,
    subjectAreasName,
    submissionName = 'Submission',
    enableSearch = true,
  } = useContext(WebFieldContext)

  const bidOptions = invitation.edge?.label?.param?.enum
  const bidOptionsWithDefaultTabs = [
    `All ${pluralizeString(submissionName)}`,
    ...(bidOptions ?? []),
    'No Bid',
  ]
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
  const { setBannerContent } = appContext ?? {}
  const { accessToken, user, isRefreshing } = useUser()
  const query = useSearchParams()

  const getBidAndConflictEdges = async () => {
    try {
      const bidEdgeResultsP = api
        .get(
          '/edges',
          {
            invitation: invitation.id,
            tail: user.profile.id,
            domain: invitation.domain,
            stream: true,
          },
          { accessToken }
        )
        .then((result) => result.edges)
      const conflictEdgeResultsP = api
        .get(
          '/edges',
          {
            invitation: conflictInvitationId,
            tail: user.profile.id,
            domain: invitation.domain,
            stream: true,
          },
          { accessToken }
        )
        .then((result) => result.edges)
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

    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else {
      setBannerContent({ type: 'venueHomepageLink', value: venueId })
    }
  }, [query, venueId])

  useEffect(() => {
    if (isRefreshing) return
    getBidAndConflictEdges()
  }, [isRefreshing])

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
            user={user}
            accessToken={accessToken}
          />
        </TabPanel>
      )
    if (activeTabIndex === bidOptionsWithDefaultTabs.length - 1)
      return (
        <TabPanel id={id}>
          <NoBidTab
            scoreIds={scoreIds}
            bidOptions={bidOptions}
            submissionVenueId={submissionVenueId}
            invitation={invitation}
            bidEdges={bidEdges}
            setBidEdges={setBidEdges}
            conflictIds={conflictIds}
            user={user}
            accessToken={accessToken}
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
          user={user}
          accessToken={accessToken}
        />
      </TabPanel>
    )
  }

  const missingConfig = Object.entries({
    header,
    venueId,
    invitation,
    scoreIds,
    submissionVenueId,
    conflictInvitationId,
    bidOptions,
  }).filter(([key, value]) => value === undefined)
  if (missingConfig?.length) {
    const errorMessage = `Bidding Console is missing required properties: ${missingConfig
      .map((p) => p[0])
      .join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
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
