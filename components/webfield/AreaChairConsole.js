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
import { formatTasksData, getNumberFromGroup, prettyId } from '../../lib/utils'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import NoteSummary from './NoteSummary'
import { AreaChairConsoleNoteReviewStatus } from './NoteReviewStatus'
import { AreaChairConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'

const SelectAllCheckBox = ({ selectedNoteIds, setSelectedNoteIds, allNoteIds }) => {
  const allNotesSelected = selectedNoteIds.length === allNoteIds.length

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
  reviewersInfo,
  officalReviewName,
  reviewRatingName,
  reviewConfidenceName,
  enableReviewerReassignment,
  reviewerRankingByPaper,
  reviewerGroupMembers,
  allProfiles,
  reviewerGroupWithConflict,
  officialMetaReviewName,
  submissionName,
  metaReviewContentField,
  selectedNoteIds,
  setSelectedNoteIds,
}) => {
  const referrerUrl = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}#assigned-papers)`
  )
  const assignedReviewers =
    reviewersInfo.find((p) => p.number === note.number)?.reviewers ?? []
  const ratingExp = /^(\d+): .*/
  const officialReviews = (note.details.directReplies ?? [])
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
        reviewLength: q.content.review?.length,
        id: q.id,
      }
    })
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
        <NoteSummary note={note} referrerUrl={referrerUrl} />
      </td>
      <td>
        <AreaChairConsoleNoteReviewStatus
          note={note}
          assignedReviewers={assignedReviewers}
          officialReviews={officialReviews}
          enableReviewerReassignment={enableReviewerReassignment}
          referrerUrl={referrerUrl}
          venueId={venueId}
          officalReviewName={officalReviewName}
          allProfiles={allProfiles}
          reviewerGroupMembers={reviewerGroupMembers}
          reviewerGroupWithConflict={reviewerGroupWithConflict}
        />
      </td>
      <td>
        <AreaChairConsoleNoteMetaReviewStatus
          note={note}
          venueId={venueId}
          submissionName={submissionName}
          officialMetaReviewName={officialMetaReviewName}
          metaReviewContentField={metaReviewContentField}
          referrerUrl={referrerUrl}
        />
      </td>
    </tr>
  )
}

const AreaChairConsoleTasks = ({ venueId, areaChairName, apiVersion }) => {
  const wildcardInvitation = `${venueId}/.*`

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
          regex: wildcardInvitation,
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
    enableEditReviewAssignments,
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
    reviewerPaperRankingInvitationId,
    reviewerGroup,
    reviewerGroupWithConflict,
    officialMetaReviewName,
    metaReviewContentField,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [acConsoleData, setAcConsoleData] = useState({})
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [selectedNoteIds, setSelectedNoteIds] = useState([])

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
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith('Area_Chairs'))
      const anonymousAreaChairGroups = allGroups.filter((p) => p.id.includes('/Area_Chair_'))
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/Paper${num}/Area_Chair_`)
        )
        if (anonymousAreaChairGroup) return num
        return []
      })

      const noteNumbers = [...new Set(areaChairPaperNums)]
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

      //#region reviewer paper ranking
      const reviewerPaperRankingsP = api
        .get(
          '/tags',
          {
            invitation: reviewerPaperRankingInvitationId,
          },
          { accessToken }
        )
        .then((result) => {
          return result.tags.reduce((rankingByForum, tag) => {
            if (!rankingByForum[tag.forum]) {
              rankingByForum[tag.forum] = {}
            }
            var index = getNumberFromGroup(tag.signatures[0], 'Reviewer_')
            rankingByForum[tag.forum][index] = tag
            return rankingByForum
          }, {})
        })
      //#endregion

      //#region  get all reviewers for reassignment dropdown
      const reviewerGroupMembersP = enableReviewerReassignment
        ? api
            .get('/groups', { id: reviewerGroup, select: 'members' }, { accessToken })
            .then((result) => {
              return result.groups[0].members
            })
        : Promise.resolve([])
      //#endregion

      const result = await Promise.all([
        blindedNotesP,
        reviewerGroupsP,
        assignedSACP,
        reviewerPaperRankingsP,
        reviewerGroupMembersP,
      ])

      //#region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers).map((p) => p.reviewerProfileId),
          ...(result[2] ?? []),
          ...result[4],
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
      //#endregion

      setAcConsoleData({
        notes: result[0],
        reviewersInfo: result[1],
        // ?.map((p) => ({
        //   ...p,
        //   reviewers: p.reviewers.map((q) => {
        //     let reviewerProfile = profileResults[0].profiles
        //       .concat(profileResults[1])
        //       .find(
        //         (r) =>
        //           r.content.names.some((s) => s.username === q.reviewerProfileId) ||
        //           r.content.emails.includes(q.reviewerProfileId)
        //       )
        //     if (reviewerProfile) {
        //       const name =
        //         reviewerProfile.content.names.find((t) => t.preferred) ||
        //         reviewerProfile.content.names[0]
        //       reviewerProfile = {
        //         id: q.reviewerProfileId,
        //         name: name ? prettyId(reviewerProfile.id) : `${name.first} ${name.last}`,
        //         email:
        //           reviewerProfile.content.preferredEmail ?? reviewerProfile.content.emails[0],
        //         allEmails: reviewerProfile.content.emailsConfirmed,
        //         names: reviewerProfile.content.names,
        //         emails: reviewerProfile.content.emailsConfirmed,
        //       }
        //     } else {
        //       reviewerProfile = {
        //         id: q.reviewerProfileId,
        //         name: '',
        //         email: q.reviewerProfileId,
        //         allEmails: [q.reviewerProfileId],
        //         // content: {
        //         //   names: [{ username: q.reviewerProfileId }],
        //         // },
        //         names: [q.reviewerProfileId],
        //         emails: [q.reviewerProfileId],
        //       }
        //     }

        //     // return { ...q, reviewerProfile }
        //     return q
        //   }),
        // })),
        reviewerRankingByPaper: result[3],
        reviewerGroupMembers: result[4],
        allProfiles: profileResults[0].profiles.concat(profileResults[1].profiles),
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
    reviewerPaperRankingInvitationId,
    reviewerGroup,
    reviewerGroupWithConflict,
    officialMetaReviewName,
    metaReviewContentField,
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
          <Tab id="areachair-tasks" onClick={() => setActiveTabIndex(1)}>
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
                    {
                      id: 'select-all',
                      content: (
                        <SelectAllCheckBox
                          selectedNoteIds={selectedNoteIds}
                          setSelectedNoteIds={setSelectedNoteIds}
                          allNoteIds={acConsoleData.notes?.map((p) => p.id) ?? []}
                        />
                      ),
                      width: '8%',
                    },
                    { id: 'number', content: '#', width: '8%' },
                    { id: 'summary', content: 'Paper Summary', width: '46%' },
                    { id: 'reviewProgress', content: 'Review Progress', width: '46%' },
                    { id: 'metaReviewStatus', content: 'Meta Review Status', width: '46%' },
                  ]}
                >
                  {acConsoleData.notes?.map((note) => (
                    <AssignedPaperRow
                      key={note.id}
                      note={note}
                      venueId={venueId}
                      areaChairName={areaChairName}
                      reviewersInfo={acConsoleData.reviewersInfo}
                      officalReviewName={officalReviewName}
                      reviewRatingName={reviewRatingName}
                      reviewConfidenceName={reviewConfidenceName}
                      enableReviewerReassignment={enableReviewerReassignment}
                      reviewerRankingByPaper={acConsoleData.reviewerRankingByPaper}
                      reviewerGroupMembers={acConsoleData.reviewerGroupMembers}
                      allProfiles={acConsoleData.allProfiles}
                      reviewerGroupWithConflict={reviewerGroupWithConflict}
                      officialMetaReviewName={officialMetaReviewName}
                      submissionName={submissionName}
                      metaReviewContentField={metaReviewContentField}
                      selectedNoteIds={selectedNoteIds}
                      setSelectedNoteIds={setSelectedNoteIds}
                    />
                  ))}
                </Table>
              </div>
            )}
          </TabPanel>
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
