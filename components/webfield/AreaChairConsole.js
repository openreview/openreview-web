import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import ErrorDisplay from '../ErrorDisplay'
import { getNumberFromGroup } from '../../lib/utils'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import NoteSummary from './NoteSummary'
import { AcConsoleNoteReviewStatus } from './NoteReviewStatus'

const SelectAllCheckBox = () => <input type="checkbox" id="select-all-papers" />

const MenuBar = () => {
  return (
    <div className="menu-bar">
      <div className="message-button-container">
        <button className="btn message-button">
          <Icon name="envelope" />
          <Dropdown
            className="dropdown-sm message-button-dropdown"
            placeholder="Message"
            components={{
              IndicatorSeparator: () => null,
              DropdownIndicator: () => null,
            }}
          />
        </button>
      </div>
      <div className="btn-group">
        <button className="btn btn-export-data">Export</button>
      </div>
      <span className="search-label">Search:</span>
      <input
        className="form-control search-input"
        placeholder="Enter search term or type + to start a query and press enter"
      />
      <span className="sort-label">Sort by:</span>
      <Dropdown
        className="dropdown-sm sort-dropdown"
        value={{ label: 'Paper Number', value: '' }}
      />
      <button className="btn btn-icon sort-button">
        <Icon name="sort" />
      </button>
    </div>
  )
}

const AssignedPaperRow = ({
  note,
  venueId,
  areaChairName,
  activeTabIndex,
  reviewersInfo,
  officalReviewName,
  reviewRatingName,
  reviewConfidenceName,
  enableReviewerReassignment,
}) => {
  const referrerContainer = activeTabIndex === 0 ? '#assigned-papers' : '#secondary-papers'
  const referrerUrl = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}${referrerContainer} + ')`
  )
  const reviewers = reviewersInfo.find((p) => p.number === note.number)?.reviewers ?? []
  const ratingExp = /^(\d+): .*/
  const officialReviews =
    note.details.directReplies ??
    []
      .filter((p) => p.invitation === `${venueId}/Paper${note.number}/-/${officalReviewName}`)
      ?.map((q) => {
        const anonymousId = getNumberFromGroup(q.signatures[0], 'Reviewer_', false)
        const ratingNumber = q.content[reviewRatingName]
          ? q.content[reviewRatingName].substring(0, q.content[reviewRatingName].indexOf(':'))
          : null
        const confidenceMatch =
          q.content[reviewConfidenceName] && q.content[reviewConfidenceName].match(ratingExp)
        return {
          anonymousId: anonymousId,
          confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : null,
          rating: ratingNumber ? parseInt(ratingNumber, 10) : null,
        }
      })
  return (
    <tr>
      <td>
        <input type="checkbox" />
      </td>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} />
      </td>
      <td>
        <AcConsoleNoteReviewStatus
          reviewers={reviewers}
          officialReviews={officialReviews}
          enableReviewerReassignment={enableReviewerReassignment}
        />
      </td>
      <td></td>
    </tr>
  )
}

const AreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    enableEditReviewAssignments,
    secondaryAreaChairName,
    reviewerAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
    blindSubmissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officalReviewName,
    reviewRatingName,
    reviewConfidenceName,
    enableReviewerReassignment,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [acConsoleData, setAcConsoleData] = useState({})
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  let edgeBrowserUrl = reviewerAssignmentTitle
    ? edgeBrowserProposedUrl
    : edgeBrowserDeployedUrl
  const headerInstructions = enableEditReviewAssignments
    ? `${header.instructions}<p><strong>Reviewer Assignment Browser: </strong><a id="edge_browser_url" href="${edgeBrowserUrl}"" target="_blank" rel="nofollow">Modify Reviewer Assignments</a></p>`
    : header.instructions

  const loadData = async () => {
    try {
      const allGroups = await api.getAll(
        '/groups',
        {
          member: user.id,
          regex: `${venueId}/${submissionName}.*`,
          select: 'id',
        },
        { accessToken }
      )
      const secondaryAreaChairPaperNums = secondaryAreaChairName
        ? allGroups.flatMap((p) => {
            if (p.id.includes(secondaryAreaChairName))
              return getNumberFromGroup(p.id, submissionName)
            return []
          })
        : []
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith('Area_Chairs'))
      const anonymousAreaChairGroups = allGroups.filter((p) => p.id.includes('/Area_Chair_'))
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        if (secondaryAreaChairPaperNums.includes(num)) return []
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/Paper${num}/Area_Chair_`)
        )
        if (anonymousAreaChairGroup) return num
        return []
      })

      const noteNumbers = [...new Set([...areaChairPaperNums, ...secondaryAreaChairPaperNums])]
      const blindedNotesP = noteNumbers.length
        ? api.getAll('/notes', {
            invitation: blindSubmissionInvitationId,
            number: noteNumbers.join(','),
            select: 'id,number,forum,content,details,invitation',
            details: 'invitation,replyCount,directReplies',
            sort: 'number:asc',
          })
        : Promise.resolve([])

      //#region getReviewerGroups(noteNumbers)
      const reviewerGroupsP = api
        .getAll(
          '/groups',
          {
            regex: `${venueId}/${submissionName}.*`,
            select: 'id,members',
          },
          { accessToken }
        )
        .then((reviewerGroupsResult) => {
          const anonymousReviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes('/Reviewer_')
          )
          const reviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes('/Reviewers')
          )
          return noteNumbers.map((p) => {
            const reviewers = reviewerGroups
              .find((q) => getNumberFromGroup(q.id, submissionName) === p)
              ?.members.flatMap((r) => {
                const anonymousReviewerGroup = anonymousReviewerGroups.find(
                  (t) => t.id.startsWith(`${venueId}/Paper${p}/Reviewer_`) && t.members[0] == r
                )
                if (anonymousReviewerGroup) {
                  const anonymousReviewerId = getNumberFromGroup(
                    anonymousReviewerGroup.id,
                    'Reviewer_',
                    false
                  )
                  return {
                    anonymousId: anonymousReviewerId,
                    reviewerProfileId: r,
                  }
                }
                return []
              })
            return {
              number: p,
              reviewers: reviewers,
            }
          })
        })

      //#endregion

      //#region assigned SAC

      const assignedSACP = seniorAreaChairsId
        ? api
            .get(
              '/edges',
              { invitation: `${seniorAreaChairsId}/-/Assignment`, head: user.profile.id },
              { accessToken }
            )
            .then((result) => {
              if (result?.edges?.length) return result.edges[0].tail
            })
        : Promise.resolve()
      //#endregion
      const result = await Promise.all([blindedNotesP, reviewerGroupsP, assignedSACP])
      //#region get reviewer and sac profiles
      const allIds = [
        ...results[1].flatMap((p) => p.reviewers).map((p) => p.reviewerProfileId),
        ...(result[2] ?? []),
      ]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const emails = allIds.filter((p) => p.match(/.+@.+/))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
      //#endregion

      setAcConsoleData({
        notes: result[0],
        reviewersInfo: result[1],
      })
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
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group || !venueId) return
    loadData()
  }, [user, userLoading, group])

  useEffect(() => {
    if (acConsoleData.notes) {
      typesetMathJax()
    }
  }, [acConsoleData.notes])

  const missingConfig = Object.entries({
    header,
    group,
    venueId,
    apiVersion,
    enableEditReviewAssignments,
    secondaryAreaChairName,
    reviewerAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
    blindSubmissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officalReviewName,
    reviewRatingName,
    reviewConfidenceName,
    enableReviewerReassignment,
  }).filter(([key, value]) => value === undefined)
  if (missingConfig?.length) {
    const errorMessage = `AC Console is missing required properties: ${
      missingConfig.length ? missingConfig.map((p) => p[0]).join(', ') : ''
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader title={header?.title} instructions={headerInstructions} />
      <Tabs>
        <TabList>
          <Tab id="assigned-papers" active>
            Assigned Papers
          </Tab>
          {secondaryAreaChairName && (
            <Tab id="secondary-papers" onClick={() => setActiveTabIndex(1)}>
              Secondary AC Assignments
            </Tab>
          )}
          <Tab id="areachair-tasks" onClick={() => setActiveTabIndex(2)}>
            Area Chair Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">
            {acConsoleData.notes?.length === 0 ? (
              <p className="empty-message">
                No assigned papers.Check back later or contact info@openreview.net if you
                believe this to be an error.
              </p>
            ) : (
              <div className="table-container">
                <MenuBar />
                <Table
                  className="console-table table-striped"
                  headings={[
                    { id: 'select-all', content: <SelectAllCheckBox />, width: '8%' },
                    { id: 'number', content: '#', width: '8%' },
                    { id: 'summary', content: 'Paper Summary', width: '46%' },
                    { id: 'reviewProgress', content: 'Review Progress', width: '46%' },
                    { id: 'metaReviewStatus', content: 'Meta Review Status', width: '46%' },
                  ]}
                >
                  {console.log('acConsoleData', acConsoleData)}
                  {acConsoleData.notes?.map((note) => (
                    <AssignedPaperRow
                      key={note.id}
                      note={note}
                      venueId={venueId}
                      areaChairName={areaChairName}
                      activeTabIndex={activeTabIndex}
                      reviewersInfo={acConsoleData.reviewersInfo}
                      officalReviewName={officalReviewName}
                      reviewRatingName={reviewRatingName}
                      reviewConfidenceName={reviewConfidenceName}
                      enableReviewerReassignment={enableReviewerReassignment}
                    />
                  ))}
                </Table>
              </div>
            )}
          </TabPanel>
          <TabPanel id="secondary-papers">{123}</TabPanel>
          <TabPanel id="areachair-tasks">{1234}</TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AreaChairConsole
