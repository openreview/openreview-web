import { useCallback, useContext, useEffect, useState } from 'react'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import { NoteListWithBidTag } from '../NoteList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import { prettyInvitationId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'
import debounce from 'lodash/debounce'
import PaginationLinks from '../PaginationLinks'

const buildArray = (invitation, fieldName, profileId, noteNumber) => {
  if (invitation.reply?.[fieldName]?.value) return invitation.reply[fieldName].value
  if (invitation.reply?.[fieldName]?.['values-copied'])
    return invitation.reply[fieldName]['values-copied']
      .map((value) => {
        if (value === '{signatures}') {
          return profileId
        } else if (value[0] === '{') {
          return null
        } else {
          return value
        }
      })
      .filter((p) => p)
  if (invitation.reply?.[fieldName]?.['values-regex'])
    return invitation.reply[fieldName]['values-regex']
      .split('|')
      .map((value) => {
        if (value.indexOf('Paper.*') !== -1) {
          return value.replace('Paper.*', `Paper${noteNumber}`)
        } else {
          return value
        }
      })
      .filter((p) => p)
  return []
}

const AllSubmissionsTab = ({
  venueId,
  scoreIds,
  bidOptions,
  blindSubmissionInvitationId,
  invitation,
  bidEdges,
  setBidEdges,
  conflictIds,
}) => {
  const [notes, setNotes] = useState([])
  const [selectedScore, setSelectedScore] = useState(scoreIds?.[0])
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { user, accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [scoreEdges, setScoreEdges] = useState([])
  const sortOptions = scoreIds.map((p) => ({ label: prettyInvitationId(p), value: p }))
  const pageSize = 50

  const getNotesSortedByAffinity = async (offset = 0, limit = 50) => {
    setIsLoading(true)
    const getNotesByBlindSubmissionInvitationP = () => {
      return api
        .get(
          '/notes',
          {
            invitation: blindSubmissionInvitationId,
            details: 'invitation',
            offset: (pageNumber - 1) * pageSize,
            limit,
          },
          { accessToken }
        )
        .then((result) => ({
          ...result,
          notes: results.notes.filter((p) => !conflictIds.includes(p.id)),
        }))
    }
    try {
      if (selectedScore) {
        const edgesResult = await api.get(
          '/edges',
          {
            invitation: selectedScore,
            tail: user.profile.id,
            sort: 'weight:desc',
            offset: (pageNumber - 1) * pageSize,
            limit,
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
            if (
              matchingNote &&
              matchingNote.invitation === blindSubmissionInvitationId &&
              !conflictIds.includes(noteId)
            )
              return matchingNote
            return []
          })
          setNotes(filteredNotes)
        } else {
          const notesResult = await getNotesByBlindSubmissionInvitationP()
          setNotes(notesResult.notes)
          setTotalCount(notesResult.count)
        }
      } else {
        const notesResult = await getNotesByBlindSubmissionInvitationP()
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
          group: venueId,
          limit: 1000,
          offset: 0,
          invitation: blindSubmissionInvitationId,
        },
        { accessToken }
      )
      setNotes(result.notes)
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
    try {
      const result = await api.post(
        '/edges',
        {
          id: existingBidToDelete?.id ?? existingBidToUpdate?.id,
          invitation: invitation.id,
          label: updatedOption,
          head: note.id,
          tail: user.profile.id,
          signatures: [user.profile.id],
          writers: [user.profile.id],
          readers: buildArray(invitation, 'readers', user.profile.id, note.number),
          nonreaders: buildArray(invitation, 'nonreaders', user.profile.id, note.number),
          ddate: existingBidToDelete ? Date.now() : null,
        },
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
    }
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
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

  useEffect(() => {
    setPageNumber(1)
    getNotesSortedByAffinity()
  }, [selectedScore])

  useEffect(() => {
    const cleanSearchTerm = searchTerm.trim()
    if (cleanSearchTerm) {
      getNotesBySearchTerm(cleanSearchTerm)
    } else {
      getNotesSortedByAffinity()
    }
  }, [searchTerm])

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
              if (e.target.value.trim().length === 0) setSearchTerm('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && immediateSearchTerm.trim().length >= 2) {
                setSearchTerm(immediateSearchTerm)
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
              onChange={(e) => setSelectedScore(e.value)}
            />
          </div>
        )}
      </form>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <NoteListWithBidTag
            notes={notes}
            bidOptions={bidOptions}
            bidEdges={bidEdges}
            scoreEdges={scoreEdges}
            displayOptions={{
              emptyMessage: 'No papers to display at this time',
              showContents: true,
              collapsibleContents: true,
              pdfLink: true,
            }}
            updateBidOption={updateBidOption}
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

const BidOptionTab = ({ bidOptions, bidOption, bidEdges, invitation, setBidEdges }) => {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, accessToken } = useUser()
  const noteIds = bidEdges.filter((p) => p.label === bidOption).map((q) => q.head)

  const getNotesByBids = async () => {
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
    try {
      const result = await api.post(
        '/edges',
        {
          id: existingBidToDelete?.id ?? existingBidToUpdate?.id,
          invitation: invitation.id,
          label: updatedOption,
          head: note.id,
          tail: user.profile.id,
          signatures: [user.profile.id],
          writers: [user.profile.id],
          readers: buildArray(invitation, 'readers', user.profile.id, note.number),
          nonreaders: buildArray(invitation, 'nonreaders', user.profile.id, note.number),
          ddate: existingBidToDelete ? Date.now() : null,
        },
        { accessToken }
      )
      let updatedBidEdges = bidEdges
      if (existingBidToDelete) {
        updatedBidEdges = bidEdges.filter((p) => p.id !== existingBidToDelete.id)
        setBidEdges(updatedBidEdges)
        setNotes((notes) => notes.filter((p) => p.id !== note.id))
        return
      }

      setBidEdges([...bidEdges.filter((p) => p.id !== existingBidToUpdate?.id), result])
      setNotes((notes) => notes.filter((p) => p.id !== note.id))
    } catch (error) {
      promptError(error.message)
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

  if (isLoading) return <LoadingSpinner />
  return (
    <NoteListWithBidTag
      notes={notes}
      bidOptions={bidOptions}
      bidEdges={bidEdges}
      displayOptions={{
        emptyMessage: 'No papers to display at this time',
        showContents: true,
        collapsibleContents: true,
        pdfLink: true,
      }}
      updateBidOption={updateBidOption}
    />
  )
}

const BidConsole = ({ appContext }) => {
  const {
    header,
    venueId,
    entity: invitation,
    bidOptions,
    scoreIds,
    blindSubmissionInvitationId,
    bidInvitationId,
    conflictInvitationId,
  } = useContext(WebFieldContext)
  const getBidOptionId = (bidOption) => bidOption.toLowerCase().split(' ').join('-')
  const allPapersOption = 'All Papers'
  const bidOptionsWithDefaultTabs = [allPapersOption, ...bidOptions]
  const getActiveTabIndex = () => {
    const tabIndex = bidOptionsWithDefaultTabs.findIndex(
      (p) => `#${getBidOptionId(p)}` === window.location.hash
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
  const router = useRouter()

  const getBidAndConflictEdges = async () => {
    try {
      const bidEdgeResultsP = api.getAll(
        '/edges',
        { invitation: bidInvitationId, tail: user.profile.id },
        { accessToken }
      )
      const conflictEdgeResultsP = api.getAll(
        '/edges',
        { invitation: conflictInvitationId, tail: user.profile.id },
        { accessToken }
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

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header?.instructions}
        options={{
          extra: <h4 id="bidcount">{`You have completed ${bidEdges.length} bids`}</h4>,
        }}
      />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Tabs>
          <TabList>
            {bidOptionsWithDefaultTabs?.map((bidOption, index) => {
              const id = getBidOptionId(bidOption)
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

          <TabPanels>
            {bidOptionsWithDefaultTabs?.map((bidOption, index) => {
              const id = getBidOptionId(bidOption)
              if (index === 0)
                return (
                  <TabPanel key={id} id={id}>
                    <AllSubmissionsTab
                      key={id}
                      venueId={venueId}
                      scoreIds={scoreIds}
                      bidOptions={bidOptions}
                      blindSubmissionInvitationId={blindSubmissionInvitationId}
                      invitation={invitation}
                      bidEdges={bidEdges}
                      setBidEdges={setBidEdges}
                      conflictIds={conflictIds}
                    />
                  </TabPanel>
                )
              if (index !== activeTabIndex) return null
              return (
                <TabPanel key={id} id={id}>
                  <BidOptionTab
                    bidOptions={bidOptions}
                    bidOption={bidOption}
                    bidEdges={bidEdges}
                    invitation={invitation}
                    setBidEdges={setBidEdges}
                  />
                </TabPanel>
              )
            })}
          </TabPanels>
        </Tabs>
      )}
    </>
  )
}

export default BidConsole
