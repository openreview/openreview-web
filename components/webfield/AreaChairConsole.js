/* globals $,promptMessage,promptError,typesetMathJax: false */

import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import ErrorDisplay from '../ErrorDisplay'
import NoteSummary from './NoteSummary'
import { AcPcConsoleNoteReviewStatus } from './NoteReviewStatus'
import { AreaChairConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import {
  formatTasksData,
  getNumberFromGroup,
  getIndentifierFromGroup,
  prettyId,
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import AreaChairConsoleMenuBar from './AreaChairConsoleMenuBar'

const SelectAllCheckBox = ({ selectedNoteIds, setSelectedNoteIds, allNoteIds }) => {
  const allNotesSelected = selectedNoteIds.length === allNoteIds?.length

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNoteIds(allNoteIds)
      return
    }
    setSelectedNoteIds([])
  }
  return (
    <input
      type="checkbox"
      id="select-all-papers"
      checked={allNotesSelected}
      onChange={handleSelectAll}
    />
  )
}

const AssignedPaperRow = ({
  rowData,
  venueId,
  areaChairName,
  officialReviewName,
  submissionName,
  metaReviewContentField,
  selectedNoteIds,
  setSelectedNoteIds,
  shortPhrase,
}) => {
  const { note, metaReviewData } = rowData
  const referrerUrl = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}#assigned-papers)`
  )
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={selectedNoteIds.includes(note.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNoteIds((noteIds) => [...noteIds, note.id])
              return
            }
            setSelectedNoteIds((noteIds) => noteIds.filter((p) => p !== note.id))
          }}
        />
      </td>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={note.version === 2} />
      </td>
      <td>
        <AcPcConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
        />
      </td>
      <td>
        <AreaChairConsoleNoteMetaReviewStatus
          note={note}
          metaReviewData={metaReviewData}
          metaReviewContentField={metaReviewContentField}
          referrerUrl={referrerUrl}
        />
      </td>
    </tr>
  )
}

const AreaChairConsoleTasks = ({ venueId, areaChairName, apiVersion }) => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const addInvitaitonTypeAndVersion = (invitation) => {
    let invitaitonType = 'tagInvitation'
    if (apiVersion === 2 && invitation.edit?.note) invitaitonType = 'noteInvitation'
    if (apiVersion === 1 && !invitation.reply.content?.tag && !invitation.reply.content?.head)
      invitaitonType = 'noteInvitation'
    return { ...invitation, [invitaitonType]: true, apiVersion }
  }

  // for note invitations only
  const filterHasReplyTo = (invitation) => {
    if (!invitation.noteInvitation) return true
    if (apiVersion === 2) {
      const result = invitation.edit?.note?.replyto?.const || invitation.edit?.note?.id?.const
      return result
    }
    const result = invitation.reply.replyto || invitation.reply.referent
    return result
  }
  const loadInvitations = async () => {
    try {
      let allInvitations = await api.getAll(
        '/invitations',
        {
          ...(apiVersion !== 2 && { regex: `${venueId}/.*` }),
          ...(apiVersion === 2 && { prefix: `${venueId}/.*` }),
          invitee: true,
          duedate: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )

      allInvitations = allInvitations
        .map((p) => addInvitaitonTypeAndVersion(p))
        .filter((p) => filterHasReplyTo(p))
        .filter((p) => p.invitees.indexOf(areaChairName) !== -1)

      if (allInvitations.length) {
        // add details
        const validInvitationDetails = await api.getAll('/invitations', {
          ids: allInvitations.map((p) => p.id),
          details: 'all',
          select: 'id,details',
        })

        allInvitations.forEach((p) => {
          // eslint-disable-next-line no-param-reassign
          p.details = validInvitationDetails.find((q) => q.id === p.id)?.details
        })
      }

      setInvitations(formatTasksData([allInvitations, [], []], true))
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    loadInvitations()
  }, [])

  return (
    <TaskList
      invitations={invitations}
      emptyMessage={isLoading ? 'Loading...' : 'No outstanding tasks for this conference'}
      referrer={encodeURIComponent(
        `[Area Chair Console](/group?id=${venueId}/${areaChairName}'#areachair-tasks)`
      )}
    />
  )
}

const AreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    reviewerAssignment,
    submissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
    filterOperators,
    propertiesAllowed,
    enableQuerySearch,
  } = useContext(WebFieldContext)
  const {
    showEdgeBrowserUrl,
    proposedAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
  } = reviewerAssignment ?? {}
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [acConsoleData, setAcConsoleData] = useState({})
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [selectedNoteIds, setSelectedNoteIds] = useState([])

  const edgeBrowserUrl = proposedAssignmentTitle
    ? edgeBrowserProposedUrl
    : edgeBrowserDeployedUrl
  const headerInstructions = showEdgeBrowserUrl
    ? `${header.instructions}<p><strong>Reviewer Assignment Browser: </strong><a id="edge_browser_url" href="${edgeBrowserUrl}"" target="_blank" rel="nofollow">Modify Reviewer Assignments</a></p>`
    : header.instructions

  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? prettyId(reviewerProfile.id) : `${name.first} ${name.last}`
  }

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
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith(areaChairName))
      const anonymousAreaChairGroups = allGroups.filter((p) => p.id.includes('/Area_Chair_'))
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/${submissionName}${num}/Area_Chair_`)
        )
        if (anonymousAreaChairGroup) return num
        return []
      })

      const noteNumbers = [...new Set(areaChairPaperNums)]
      const blindedNotesP = noteNumbers.length
        ? api.getAll(
            '/notes',
            {
              invitation: submissionInvitationId,
              number: noteNumbers.join(','),
              select: 'id,number,forum,content,details,invitation,version',
              details: 'invitation,replyCount,directReplies',
              sort: 'number:asc',
            },
            { accessToken, version: apiVersion }
          )
        : Promise.resolve([])

      // #region getReviewerGroups(noteNumbers)
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
                  (t) =>
                    t.id.startsWith(`${venueId}/${submissionName}${p}/Reviewer_`) &&
                    t.members[0] === r
                )
                if (anonymousReviewerGroup) {
                  const anonymousReviewerId = getIndentifierFromGroup(
                    anonymousReviewerGroup.id,
                    'Reviewer_'
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
              reviewers,
            }
          })
        })

      // #endregion

      // #region assigned SAC
      const assignedSACP = seniorAreaChairsId
        ? api
            .get(
              '/edges',
              { invitation: `${seniorAreaChairsId}/-/Assignment`, head: user.profile.id },
              { accessToken }
            )
            .then((result) => {
              if (result?.edges?.length) return result.edges[0].tail
              return null
            })
        : Promise.resolve()
      // #endregion

      const result = await Promise.all([blindedNotesP, reviewerGroupsP, assignedSACP])

      // #region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers).map((p) => p.reviewerProfileId),
          ...(result[2] ? [result[2]] : []),
        ]),
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
      // #endregion

      // #region calculate reviewProgressData and metaReviewData
      const notes = result[0]
      const allProfiles = (profileResults[0].profiles ?? []).concat(
        profileResults[1].profiles ?? []
      )
      const tableRows = notes.map((note) => {
        const assignedReviewers =
          result[1].find((p) => p.number === note.number)?.reviewers ?? []
        const assignedReviewerProfiles = assignedReviewers.map((reviewer) =>
          allProfiles.find(
            (p) =>
              p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
              p.content.emails.includes(reviewer.reviewerProfileId)
          )
        )
        const officialReviews = (note.details.directReplies ?? [])
          .filter((p) => {
            const officalReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.version === 2
              ? p.invitations.includes(officalReviewInvitationId)
              : p.invitation === officalReviewInvitationId
          })
          ?.map((q) => {
            const isV2Note = q.version === 2
            const anonymousId = getIndentifierFromGroup(q.signatures[0], 'Reviewer_')
            const reviewRatingValue = isV2Note
              ? q.content[reviewRatingName]?.value
              : q.content[reviewRatingName]
            const ratingNumber = reviewRatingValue
              ? reviewRatingValue.substring(0, reviewRatingValue.indexOf(':'))
              : null
            const confidenceValue = isV2Note
              ? q.content[reviewConfidenceName]?.value
              : q.content[reviewConfidenceName]
            const confidenceMatch = confidenceValue && confidenceValue.match(/^(\d+): .*/)
            const reviewValue = isV2Note ? q.content.review?.value : q.content.review
            return {
              anonymousId,
              confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : null,
              rating: ratingNumber ? parseInt(ratingNumber, 10) : null,
              reviewLength: reviewValue?.length,
              id: q.id,
            }
          })
        const ratings = officialReviews.map((p) => p.rating)
        const validRatings = ratings.filter((p) => p !== null)
        const ratingAvg = validRatings.length
          ? (validRatings.reduce((sum, curr) => sum + curr, 0) / validRatings.length).toFixed(
              2
            )
          : 'N/A'
        const ratingMin = validRatings.length ? Math.min(...validRatings) : 'N/A'
        const ratingMax = validRatings.length ? Math.max(...validRatings) : 'N/A'

        const confidences = officialReviews.map((p) => p.confidence)
        const validConfidences = confidences.filter((p) => p !== null)
        const confidenceAvg = validConfidences.length
          ? (
              validConfidences.reduce((sum, curr) => sum + curr, 0) / validConfidences.length
            ).toFixed(2)
          : 'N/A'
        const confidenceMin = validConfidences.length ? Math.min(...validConfidences) : 'N/A'
        const confidenceMax = validConfidences.length ? Math.max(...validConfidences) : 'N/A'

        const metaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
        const metaReview = note.details.directReplies.find((p) =>
          p.version === 2
            ? p.invitations.includes(metaReviewInvitationId)
            : p.invitation === metaReviewInvitationId
        )
        return {
          note,
          reviewers: result[1]
            .find((p) => p.number === note.number)
            ?.reviewers?.map((reviewer) => {
              const profile = allProfiles.find(
                (p) =>
                  p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
                  p.content.emails.includes(reviewer.reviewerProfileId)
              )
              return {
                ...reviewer,
                type: 'reviewer',
                profile,
                hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
                noteNumber: note.number,
                preferredName: profile ? getReviewerName(profile) : reviewer.reviewerProfileId,
                preferredEmail: profile
                  ? profile.content.preferredEmail ?? profile.content.emails[0]
                  : reviewer.reviewerProfileId,
              }
            }),
          reviewerProfiles: assignedReviewerProfiles,
          officialReviews,
          reviewProgressData: {
            reviewers: assignedReviewerProfiles,
            numReviewersAssigned: assignedReviewers.length,
            numReviewsDone: officialReviews.length,
            ratingAvg,
            ratingMax,
            ratingMin,
            confidenceAvg,
            confidenceMax,
            confidenceMin,
            replyCount: note.details.replyCount,
          },
          metaReviewData: {
            [metaReviewContentField]:
              metaReview?.version === 2
                ? metaReview?.content[metaReviewContentField]?.value
                : metaReview?.content[metaReviewContentField],
            metaReviewInvitationId: `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`,
            metaReview,
          },
        }
      })

      const sacProfile = allProfiles.find(
        (p) =>
          p.content.names.some((q) => q.username === result[2]) ||
          p.content.emails.includes(result[2])
      )
      // #endregion
      setAcConsoleData({
        tableRowsAll: tableRows,
        tableRows,
        tableRowsDisplayed: tableRows,
        reviewersInfo: result[1],
        allProfiles,
        sacProfile: sacProfile
          ? {
              id: sacProfile.id,
              email: sacProfile.content.preferredEmail ?? sacProfile.content.emails[0],
            }
          : null,
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
  }

  const renderTable = () => {
    if (acConsoleData.tableRows?.length === 0)
      return (
        <p className="empty-message">
          No assigned papers.Check back later or contact info@openreview.net if you believe
          this to be an error.
        </p>
      )
    if (acConsoleData.tableRowsDisplayed?.length === 0)
      return (
        <div className="table-container empty-table-container">
          <AreaChairConsoleMenuBar
            tableRowsAll={acConsoleData.tableRows} // ac console has no pagination
            tableRows={acConsoleData.tableRowsDisplayed}
            selectedNoteIds={selectedNoteIds}
            setAcConsoleData={setAcConsoleData}
            shortPhrase={shortPhrase}
            enableQuerySearch={enableQuerySearch}
            filterOperators={filterOperators}
            propertiesAllowed={propertiesAllowed}
          />
          <p className="empty-message">No assigned papers matching search criteria.</p>
        </div>
      )
    return (
      <div className="table-container">
        <AreaChairConsoleMenuBar
          tableRowsAll={acConsoleData.tableRows}
          tableRows={acConsoleData.tableRowsDisplayed}
          selectedNoteIds={selectedNoteIds}
          setAcConsoleData={setAcConsoleData}
          shortPhrase={shortPhrase}
          enableQuerySearch={enableQuerySearch}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
        />
        <Table
          className="console-table table-striped areachair-console-table"
          headings={[
            {
              id: 'select-all',
              content: (
                <SelectAllCheckBox
                  selectedNoteIds={selectedNoteIds}
                  setSelectedNoteIds={setSelectedNoteIds}
                  allNoteIds={acConsoleData.tableRowsDisplayed?.map((row) => row.note.id)}
                />
              ),
            },
            { id: 'number', content: '#' },
            { id: 'summary', content: 'Paper Summary' },
            { id: 'reviewProgress', content: 'Review Progress', width: '30%' },
            { id: 'metaReviewStatus', content: 'Meta Review Status' },
          ]}
        >
          {acConsoleData.tableRowsDisplayed?.map((row) => (
            <AssignedPaperRow
              key={row.note.id}
              rowData={row}
              venueId={venueId}
              areaChairName={areaChairName}
              officialReviewName={officialReviewName}
              officialMetaReviewName={officialMetaReviewName}
              submissionName={submissionName}
              metaReviewContentField={metaReviewContentField}
              selectedNoteIds={selectedNoteIds}
              setSelectedNoteIds={setSelectedNoteIds}
              shortPhrase={shortPhrase}
            />
          ))}
        </Table>
      </div>
    )
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
    if (
      userLoading ||
      !user ||
      !group ||
      !venueId ||
      !submissionName ||
      !officialReviewName ||
      !submissionInvitationId
    )
      return
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
    reviewerAssignment,
    submissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
    enableQuerySearch,
  }).filter(([key, value]) => value === undefined).map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `AC Console is missing required properties: ${missingConfig.join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={`${headerInstructions}${
          acConsoleData.sacProfile
            ? `<p class="dark">Your assigned Senior Area Chair is <a href="https://openreview.net/profile?id=${
                acConsoleData.sacProfile.id
              }" target="_blank">${prettyId(acConsoleData.sacProfile.id)}</a> (${
                acConsoleData.sacProfile.email
              })`
            : ''
        }`}
      />

      <Tabs>
        <TabList>
          <Tab id="assigned-papers" active>
            Assigned Papers
          </Tab>
          <Tab id="areachair-tasks" onClick={() => setActiveTabIndex(1)}>
            Area Chair Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">{renderTable()}</TabPanel>
          <TabPanel id="areachair-tasks">
            {activeTabIndex === 1 && (
              <AreaChairConsoleTasks
                venueId={venueId}
                areaChairName={areaChairName}
                apiVersion={apiVersion}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AreaChairConsole
