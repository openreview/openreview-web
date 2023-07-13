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
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import {
  getNumberFromGroup,
  getIndentifierFromGroup,
  prettyId,
  prettyList,
  inflect,
  parseNumberField,
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import AreaChairConsoleMenuBar from './AreaChairConsoleMenuBar'
import LoadingSpinner from '../LoadingSpinner'
import ConsoleTaskList from './ConsoleTaskList'

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
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={true} />
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

const AreaChairConsoleTasks = ({ venueId, areaChairName }) => {
  const referrer = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}#areachair-tasks)`
  )

  return <ConsoleTaskList venueId={venueId} roleName={areaChairName} referrer={referrer} />
}

const AreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    reviewerAssignment,
    submissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    reviewerName = 'Reviewers',
    anonReviewerName = 'Reviewer_',
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

  const getSACLinkText = () => {
    if (!acConsoleData.sacProfiles?.length) return ''
    const sacText = `Your assigned Senior Area ${inflect(
      acConsoleData.sacProfiles.length,
      'Chair is',
      'Chairs are'
    )}`
    const sacProfileLinks = acConsoleData.sacProfiles.map(
      (sacProfile) =>
        `<a href='https://openreview.net/profile?id=${
          sacProfile.id
        }' target='_blank'>${prettyId(sacProfile.id)}</a> (${sacProfile.email})`
    )
    return `<p class="dark">${sacText} ${prettyList(
      sacProfileLinks,
      'long',
      'conjunction',
      false
    )}</p>`
  }

  const loadData = async () => {
    try {
      const allGroups = await api.getAll(
        '/groups',
        {
          member: user.id,
          prefix: `${venueId}/${submissionName}.*`,
          select: 'id',
        },
        { accessToken, version: 2 }
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
              select: 'id,number,forum,content,details',
              details: 'replies',
              sort: 'number:asc',
            },
            { accessToken, version: 2 }
          )
        : Promise.resolve([])

      // #region getReviewerGroups(noteNumbers)
      const reviewerGroupsP = api
        .get(
          '/groups',
          {
            prefix: `${venueId}/${submissionName}.*`,
            select: 'id,members',
            stream: true,
          },
          { accessToken, version: 2 }
        )
        .then((reviewerGroupsResult) => {
          const anonymousReviewerGroups = reviewerGroupsResult.groups.filter((p) =>
            p.id.includes(`/${anonReviewerName}`)
          )
          const reviewerGroups = reviewerGroupsResult.groups.filter((p) =>
            p.id.includes(`/${reviewerName}`)
          )
          return noteNumbers.map((p) => {
            const reviewers = reviewerGroups
              .find((q) => getNumberFromGroup(q.id, submissionName) === p)
              ?.members.flatMap((r) => {
                const anonymousReviewerGroup = anonymousReviewerGroups.find(
                  (t) =>
                    t.id.startsWith(`${venueId}/${submissionName}${p}/${anonReviewerName}`) &&
                    t.members[0] === r
                )
                if (anonymousReviewerGroup) {
                  const anonymousReviewerId = getIndentifierFromGroup(
                    anonymousReviewerGroup.id,
                    anonReviewerName
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
      const assignedSACsP = seniorAreaChairsId
        ? api
            .get(
              '/edges',
              { invitation: `${seniorAreaChairsId}/-/Assignment`, head: user.profile.id },
              { accessToken }
            )
            .then((result) => result?.edges?.map((edge) => edge.tail) ?? [])
        : Promise.resolve([])
      // #endregion

      const result = await Promise.all([blindedNotesP, reviewerGroupsP, assignedSACsP])

      // #region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers).map((p) => p.reviewerProfileId),
          ...result[2],
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
        const officialReviews = note.details.replies
          .filter((p) => {
            const officalReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officalReviewInvitationId)
          })
          ?.map((q) => {
            const anonymousId = getIndentifierFromGroup(q.signatures[0], anonReviewerName)
            const reviewValue = q.content.review?.value
            return {
              anonymousId,
              confidence: parseNumberField(q.content[reviewConfidenceName]?.value),
              rating: parseNumberField(q.content[reviewRatingName]?.value),
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
        const metaReview = note.details.replies.find((p) =>
          p.invitations.includes(metaReviewInvitationId)
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
            replyCount: note.details.replies.length,
          },
          metaReviewData: {
            [metaReviewContentField]:
              metaReview?.content[metaReviewContentField]?.value ?? 'N/A',
            metaReviewInvitationId: `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`,
            metaReview,
          },
        }
      })

      const sacProfiles = allProfiles.filter(
        (p) =>
          p.content.names.some((q) => result[2].includes(q.username)) ||
          p.content.emails.some((r) => result[2].includes(r))
      )
      // #endregion
      setAcConsoleData({
        tableRowsAll: tableRows,
        tableRows,
        reviewersInfo: result[1],
        allProfiles,
        sacProfiles: sacProfiles.map((sacProfile) => ({
          id: sacProfile.id,
          email: sacProfile.content.preferredEmail ?? sacProfile.content.emails[0],
        })),
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
  }

  const renderTable = () => {
    if (!acConsoleData.tableRowsAll) return <LoadingSpinner />
    if (acConsoleData.tableRowsAll?.length === 0)
      return (
        <p className="empty-message">
          No assigned papers.Check back later or contact info@openreview.net if you believe
          this to be an error.
        </p>
      )
    if (acConsoleData.tableRows?.length === 0)
      return (
        <div className="table-container empty-table-container">
          <AreaChairConsoleMenuBar
            tableRowsAll={acConsoleData.tableRowsAll}
            tableRows={acConsoleData.tableRows}
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
          tableRowsAll={acConsoleData.tableRowsAll}
          tableRows={acConsoleData.tableRows}
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
                  allNoteIds={acConsoleData.tableRows?.map((row) => row.note.id)}
                />
              ),
              width: '35px',
            },
            { id: 'number', content: '#', width: '55px' },
            { id: 'summary', content: 'Paper Summary', width: '34%' },
            { id: 'reviewProgress', content: 'Review Progress', width: '34%' },
            { id: 'metaReviewStatus', content: 'Meta Review Status', width: 'auto' },
          ]}
        >
          {acConsoleData.tableRows?.map((row) => (
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
    reviewerAssignment,
    submissionInvitationId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
    enableQuerySearch,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `AC Console is missing required properties: ${missingConfig.join(
      ', '
    )}`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={`${headerInstructions}${getSACLinkText()}`}
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
              <AreaChairConsoleTasks venueId={venueId} areaChairName={areaChairName} />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AreaChairConsole
