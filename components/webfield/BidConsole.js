import { useContext, useEffect, useRef, useState } from 'react'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import NoteList, { NoteListWithBidTag, NoteListWithTag } from '../NoteList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import PaginationLinks from '../PaginationLinks'
import Icon from '../Icon'
import Dropdown from '../Dropdown'
import { prettyInvitationId } from '../../lib/utils'
import LoadingSpinner from '../LoadingSpinner'

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
  scoreIds,
  bidOptions,
  blindSubmissionInvitationId,
  invitation,
  bidEdges,
  setBidEdges,
}) => {
  const [notes, setNotes] = useState([])
  const [selectedScore, setSelectedScore] = useState(scoreIds?.[0])
  const { user, accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const sortOptions = scoreIds.map((p) => ({ label: prettyInvitationId(p), value: p }))
  const pageSize = 50

  const getNotesSortedByAffinity = async (offset = 0, limit = 50) => {
    const getNotesByBlindSubmissionInvitationP = () =>
      api.get(
        '/notes',
        {
          invitation: blindSubmissionInvitationId,
          details: 'invitation',
          offset: (pageNumber - 1) * pageSize,
          limit,
        },
        { accessToken }
      )
    try {
      if (selectedScore) {
        const edgesResult = await api.get(
          '/edges',
          {
            invitation: selectedScore,
            tail: user.profile.id,
            sort: 'weight:desc',
            offset,
            limit,
          },
          { accessToken }
        )
        if (edgesResult.count) {
          //TODO: data loading when there's edge
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
            />
          </div>
        )}
      </form>
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
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true }}
      />
    </>
  )
}

const BidOptionTab = ({ bidOptions, bidOption, bidEdges, invitation, setBidEdges }) => {
  const [notes, setNotes] = useState([])
  const { user, accessToken } = useUser()
  const noteIds = bidEdges.filter((p) => p.label === bidOption).map((q) => q.head)

  const getNotesByBids = async () => {
    if (!noteIds?.length) return
    try {
      const noteSearchResults = await api.post(
        '/notes/search',
        {
          ids: noteIds,
        },
        { accessToken }
      )
      console.log('noteSearchResults', noteSearchResults)
      setNotes(noteSearchResults.notes)
    } catch (error) {
      promptError(error.message)
    }
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
  const [bidCount, setBidCount] = useState(0)
  const [selectedScore, setSelectedScore] = useState(scoreIds?.[0])
  const [isLoading, setIsLoading] = useState(true)
  const [bidEdges, setBidEdges] = useState([])
  const { setBannerContent } = appContext
  const { accessToken, user } = useUser()
  const query = useQuery()
  const router = useRouter()

  const getBidEdges = async () => {
    try {
      const edgeResults = await api.getAll(
        '/edges',
        { invitation: bidInvitationId, tail: user.profile.id },
        { accessToken }
      )
      setBidEdges(edgeResults)
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
    getBidEdges()
  }, [])

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header?.instructions}
        options={{ extra: <h4 id="bidcount">{`You have completed ${bidCount} bids`}</h4> }}
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
              if (activeTabIndex !== index) return null
              if (index === 0)
                return (
                  <TabPanel key={id} id={id}>
                    <AllSubmissionsTab
                      key={id}
                      scoreIds={scoreIds}
                      bidOptions={bidOptions}
                      blindSubmissionInvitationId={blindSubmissionInvitationId}
                      invitation={invitation}
                      bidEdges={bidEdges}
                      setBidEdges={setBidEdges}
                    />
                  </TabPanel>
                )
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
