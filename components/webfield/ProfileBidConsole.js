/* globals promptError: false */

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
import ProfileListWithBidWidget from '../ProfileListWithBidWidget'

const getDdate = (existingBidToDelete) => {
  if (existingBidToDelete) return Date.now()
  return { delete: true }
}

const appendSearchText = (profile) => {
  const searchText = [
    ...(profile.content.names?.map((p) => p.username) ?? []),
    ...(profile.content.history?.flatMap(
      (p) => `${p.position} ${p.institution?.domain} ${p.institution?.name}`
    ) ?? []),
    ...(profile.content.expertise?.flatMap((p) => p.keywords) ?? []),
  ].flatMap((p) => (p ? p.trim().toLowerCase() : []))

  return {
    ...profile,
    searchText,
  }
}

const getBidObjectToPost = (id, updatedOption, invitation, profile, userId, ddate) => ({
  id,
  invitation: invitation.id,
  label: updatedOption,
  head: profile.id,
  tail: userId,
  signatures: [userId],
  ddate,
})

const AllSubmissionsTab = ({
  bidEdges,
  setBidEdges,
  conflictIds,
  bidOptions,
  profileGroupName,
}) => {
  const { entity: invitation, scoreIds, profileGroupId } = useContext(WebFieldContext)
  const { user, accessToken } = useUser()
  const [pageNumber, setPageNumber] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [scoreEdges, setScoreEdges] = useState([])
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)
  const [selectedScore, setSelectedScore] = useState(scoreIds?.[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')

  const [profileState, setProfileState] = useState({
    allProfiles: null,
    profilesFiltered: [],
    profilesDisplayed: [],
  })

  const sortOptions = scoreIds?.map((p) => ({ label: prettyInvitationId(p), value: p }))
  const emptyMessage = `No ${profileGroupName} to display at this time`
  const pageSize = 25

  const getProfilesSortedByAffinity = async (score = selectedScore) => {
    setIsLoading(true)
    const getProfilesByGroupId = async () => {
      const result = await api.get(
        '/profiles',
        {
          group: profileGroupId,
        },
        { accessToken }
      )
      return {
        ...result,
        profiles: result.profiles.filter((p) => !conflictIds.includes(p.id)),
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
          },
          { accessToken }
        )

        if (edgesResult.count) {
          setScoreEdges(edgesResult.edges)
          const profileIds = edgesResult.edges.map((p) => p.head)
          const profilesResult = await api.post(
            '/profiles/search',
            { ids: profileIds },
            { accessToken }
          )
          const filteredProfiles = profileIds.flatMap((profileId) => {
            const matchingProfile = profilesResult.profiles.find((p) => p.id === profileId)
            if (matchingProfile && !conflictIds.includes(profileId)) {
              return appendSearchText(matchingProfile)
            }
            return []
          })
          setProfileState({
            allProfiles: filteredProfiles,
            profilesFiltered: filteredProfiles,
            profilesDisplayed: filteredProfiles.slice(
              pageSize * (pageNumber - 1),
              pageSize * (pageNumber - 1) + pageSize
            ),
          })
        } else {
          const profilesResult = await getProfilesByGroupId()

          const profilesResultWithSearchText = profilesResult.profiles.map((p) =>
            appendSearchText(p)
          )
          setProfileState({
            allProfiles: profilesResultWithSearchText,
            profilesFiltered: profilesResultWithSearchText,
            profilesDisplayed: profilesResultWithSearchText.slice(
              pageSize * (pageNumber - 1),
              pageSize * (pageNumber - 1) + pageSize
            ),
          })
        }
      } else {
        const profilesResult = await getProfilesByGroupId()
        const profilesResultWithSearchText = profilesResult.profiles.map((p) =>
          appendSearchText(p)
        )
        setProfileState({
          allProfiles: profilesResultWithSearchText,
          profilesFiltered: profilesResultWithSearchText,
          profilesDisplayed: profilesResultWithSearchText.slice(
            pageSize * (pageNumber - 1),
            pageSize * (pageNumber - 1) + pageSize
          ),
        })
      }
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  const updateBidOption = async (profile, updatedOption) => {
    const existingBidToDelete = bidEdges.find(
      (p) => p.head === profile.id && p.label === updatedOption
    )
    const existingBidToUpdate = bidEdges.find((p) => p.head === profile.id)
    const ddate = getDdate(existingBidToDelete)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(bidId, updatedOption, invitation, profile, user.profile.id, ddate),
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

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 200),
    []
  )

  const filterProfilesBySearchTerm = async (term) => {
    setProfileState((state) => ({
      ...state,
      profilesFiltered: state.allProfiles.filter((p) =>
        p.searchText.some((q) => q.includes(term))
      ),
    }))
    setPageNumber(1)
  }

  const handleScoreDropdownChange = (scoreSelected) => {
    setPageNumber(1)
    setSearchTerm('')
    setSelectedScore(scoreSelected)
    getProfilesSortedByAffinity(scoreSelected)
  }

  useEffect(() => {
    setProfileState((state) => ({
      ...state,
      profilesDisplayed: state.profilesFiltered.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
  }, [pageNumber, profileState.profilesFiltered])

  useEffect(() => {
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    if (cleanSearchTerm) {
      filterProfilesBySearchTerm(cleanSearchTerm)
    } else {
      getProfilesSortedByAffinity()
    }
    setImmediateSearchTerm(searchTerm)
  }, [searchTerm])

  useEffect(
    () => () => {
      delaySearch.cancel()
    },
    [delaySearch]
  )

  useEffect(() => {
    getProfilesSortedByAffinity()
  }, [])

  return (
    <>
      <form
        className="form-inline notes-search-form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (immediateSearchTerm.trim().length >= 2) {
            setSearchTerm(immediateSearchTerm)
          }
        }}
      >
        <div className="form-group search-content has-feedback">
          <input
            id="paper-search-input"
            type="text"
            className="form-control"
            placeholder={`Search ${profileGroupName}`}
            autoComplete="off"
            value={immediateSearchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (e.target.value.trim().length >= 3) delaySearch(e.target.value)
              if (e.target.value.trim().length === 0) setSearchTerm('')
            }}
            disabled={!profileState.allProfiles}
          />
          <Icon name="search" extraClasses="form-control-feedback" />
        </div>
        {scoreIds?.length > 0 && (
          <div className="form-group score">
            <label htmlFor="score-dropdown">Sort By:</label>
            <Dropdown
              className="dropdown-select"
              options={sortOptions}
              value={sortOptions.find((p) => p.value === selectedScore)}
              onChange={(e) => handleScoreDropdownChange(e.value)}
            />
          </div>
        )}
        <button type="submit" style={{ display: 'none' }} />
      </form>
      {isLoading ? (
        <LoadingSpinner inline />
      ) : (
        <>
          <ProfileListWithBidWidget
            profiles={profileState.profilesDisplayed}
            bidOptions={bidOptions}
            bidEdges={bidEdges}
            scoreEdges={scoreEdges}
            emptyMessage={emptyMessage}
            updateBidOption={updateBidOption}
            bidUpdateStatus={bidUpdateStatus}
            setSearchTerm={setSearchTerm}
          />
          <PaginationLinks
            currentPage={pageNumber}
            itemsPerPage={pageSize}
            totalCount={profileState.profilesFiltered.length}
            setCurrentPage={setPageNumber}
            options={{ noScroll: true }}
          />
        </>
      )}
    </>
  )
}

const BidOptionTab = ({
  bidOptions,
  bidOption,
  bidEdges,
  invitation,
  setBidEdges,
  profileGroupName,
}) => {
  const [profiles, setProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, accessToken } = useUser()
  const profileIds = bidEdges.filter((p) => p.label === bidOption).map((q) => q.head)
  const [bidUpdateStatus, setBidUpdateStatus] = useState(true)
  const emptyMessage = `No ${profileGroupName} to display at this time`

  const getProfilesByIds = async () => {
    setIsLoading(true)
    if (!profileIds?.length) {
      setIsLoading(false)
      return
    }
    try {
      const profileSearchResults = await api.post(
        '/profiles/search',
        {
          ids: profileIds,
        },
        { accessToken }
      )
      setProfiles(profileSearchResults.profiles)
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  const updateBidOption = async (profile, updatedOption) => {
    const existingBidToDelete = bidEdges.find(
      (p) => p.head === profile.id && p.label === updatedOption
    )
    const existingBidToUpdate = bidEdges.find((p) => p.head === profile.id)
    const ddate = getDdate(existingBidToDelete)
    const bidId = existingBidToDelete?.id ?? existingBidToUpdate?.id
    try {
      const result = await api.post(
        '/edges',
        getBidObjectToPost(bidId, updatedOption, invitation, profile, user.profile.id, ddate),
        { accessToken }
      )
      let updatedBidEdges = bidEdges
      if (existingBidToDelete) {
        updatedBidEdges = bidEdges.filter((p) => p.id !== existingBidToDelete.id)
        setBidEdges(updatedBidEdges)
        setProfiles((profiles) => profiles.filter((p) => p.id !== profile.id)) // eslint-disable-line no-shadow
        return
      }

      setBidEdges([...bidEdges.filter((p) => p.id !== existingBidToUpdate?.id), result])
      setProfiles((profiles) => profiles.filter((p) => p.id !== profile.id)) // eslint-disable-line no-shadow
    } catch (error) {
      promptError(error.message)
      setBidUpdateStatus((status) => !status)
    }
  }

  useEffect(() => {
    getProfilesByIds()
  }, [])

  if (isLoading) return <LoadingSpinner inline />
  return (
    <ProfileListWithBidWidget
      profiles={profiles}
      bidOptions={bidOptions}
      bidEdges={bidEdges}
      emptyMessage={emptyMessage}
      updateBidOption={updateBidOption}
      bidUpdateStatus={bidUpdateStatus}
    />
  )
}

// only work with v2 api
const ProfileBidConsole = ({ appContext }) => {
  const {
    header,
    venueId,
    entity: invitation,
    scoreIds,
    conflictInvitationId,
    profileGroupId,
  } = useContext(WebFieldContext)
  const profileGroupName = profileGroupId?.split('/')?.pop()?.replaceAll('_', ' ')

  const bidOptions = invitation?.edge?.label?.param?.enum
  const bidOptionsWithDefaultTabs = [`All ${profileGroupName}`, ...(bidOptions ?? [])]
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
        { accessToken }
      )
      const conflictEdgeResultsP = conflictInvitationId
        ? api.getAll(
            '/edges',
            { invitation: conflictInvitationId, tail: user.profile.id },
            { accessToken }
          )
        : Promise.resolve([])
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
            profileGroupName={profileGroupName}
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
          profileGroupName={profileGroupName}
        />
      </TabPanel>
    )
  }

  const missingConfig = Object.entries({
    header,
    venueId,
    invitation,
    scoreIds,
    bidOptions,
    profileGroupId,
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

export default ProfileBidConsole
