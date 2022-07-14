import { useContext, useEffect, useState } from 'react'
import api from '../../lib/api-client'
import Table from '../Table'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import TaskList from '../TaskList'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { ReviewerConsoleNoteReviewStatus } from './NoteReviewStatus'
import NoteSummary from './NoteSummary'
import useUser from '../../hooks/useUser'
import {
  formatTasksData,
  getNumberFromGroup,
  prettyId,
  prettyInvitationId,
} from '../../lib/utils'
import Dropdown from '../Dropdown'
import { useRouter } from 'next/router'
import useQuery from '../../hooks/useQuery'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import ErrorDisplay from '../ErrorDisplay'
import { filterAssignedInvitations } from '../../lib/webfield-utils'

const AreaChairInfo = ({ areaChairId }) => {
  return (
    <div className="note-area-chairs">
      <p>
        <strong>Area Chair:</strong>{' '}
        <a href={`/profile?id=${areaChairId}`} target="_blank">
          {prettyId(areaChairId)}
        </a>
      </p>
    </div>
  )
}

const PaperRankingDropdown = ({
  noteId,
  noteForum,
  notesCount,
  currentTagObj,
  existingPaperRankingTags,
  paperRankingInvitation,
  paperRankingId,
  anonGroupId,
  tagReaders,
  setReviewerConsoleData,
  enablePaperRanking,
  setEnablePaperRanking,
}) => {
  const { accessToken } = useUser()
  const noRankingText = 'No Ranking'
  const currentTagvalue = currentTagObj?.tag
  const allOptions = [{ label: noRankingText, value: noRankingText }].concat(
    [...Array(notesCount).keys()].map((p) => {
      const tagValue = `${p + 1} of ${notesCount}`
      return { label: tagValue, value: tagValue }
    })
  )
  const currentRanking = existingPaperRankingTags.flatMap((p) =>
    !p.tag || p.tag === noRankingText ? [] : p.tag
  )
  const availableOptions = allOptions.filter((p) => !currentRanking.includes(p.value))

  const getCurrentValue = () => {
    const matchingOption = allOptions.find((p) => p.value === currentTagvalue)
    if (matchingOption) return matchingOption
    return currentTagvalue ? { label: currentTagvalue, value: currentTagvalue } : undefined
  }

  const postTag = async (newTagValue) => {
    setEnablePaperRanking(false)
    try {
      const result = await api.post(
        '/tags',
        {
          id: currentTagObj.id,
          tag: newTagValue,
          signatures: [anonGroupId],
          readers: tagReaders,
          forum: noteId,
          invitation: paperRankingInvitation?.id ?? paperRankingId,
          ddate: null,
        },
        { accessToken }
      )

      setReviewerConsoleData((reviewerConsoleData) => {
        let newPaperRankingTags = [...reviewerConsoleData.paperRankingTags].filter(
          (p) => p?.forum !== noteForum
        )
        newPaperRankingTags.push(result)
        return {
          ...reviewerConsoleData,
          paperRankingTags: newPaperRankingTags,
        }
      })
    } catch (error) {
      promptError(error.message)
    }
    setEnablePaperRanking(true)
  }

  return (
    <div className="tag-widget reviewer-console">
      <label className="ranking-label">
        {prettyInvitationId(paperRankingInvitation.id ?? paperRankingId)}
      </label>
      <Dropdown
        className={`ranking-dropdown dropdown-sm${
          enablePaperRanking ? '' : ' dropdown-disable'
        }`}
        options={availableOptions}
        onChange={(e) => {
          postTag(e.value)
        }}
        value={getCurrentValue()}
      />
    </div>
  )
}

const AssignedPaperRow = ({
  note,
  reviewerConsoleData,
  paperRankingId,
  setReviewerConsoleData,
  enablePaperRanking,
  setEnablePaperRanking,
}) => {
  const isV2Note = note.version === 2
  const {
    invitations,
    officialReviews,
    paperRankingTags,
    notes,
    paperNumberAnonGroupIdMap,
    areaChairMap,
  } = reviewerConsoleData
  const {
    venueId,
    reviewerName,
    officialReviewName,
    reviewRatingName,
    areaChairName,
    submissionName,
  } = useContext(WebFieldContext)
  const notesCount = notes.length
  const referrerUrl = encodeURIComponent(
    `[Reviewer Console](/group?id=${venueId}/${reviewerName}#assigned-papers)`
  )
  const officialReviewInvitaitonId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
  const officialReviewInvitation = invitations?.find(
    (p) => p.id === officialReviewInvitaitonId
  )
  const officialReview = officialReviews.find((p) =>
    isV2Note
      ? p.invitations.includes(officialReviewInvitaitonId)
      : p.invitation === officialReviewInvitaitonId
  )
  const currentTagObj = paperRankingTags?.find((p) => p.forum === note.forum)
  const paperRankingInvitation = invitations?.find((p) => p.id === paperRankingId)
  const anonGroupId = paperNumberAnonGroupIdMap[note.number]
  const areaChairId = areaChairMap[note.number]
  const paperRatingValue = isV2Note
    ? officialReview?.content?.[reviewRatingName]?.value
    : officialReview?.content?.[reviewRatingName]
  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Note} />
        {areaChairId && <AreaChairInfo areaChairId={areaChairId} />}
      </td>
      <td>
        <ReviewerConsoleNoteReviewStatus
          editUrl={
            officialReview
              ? `/forum?id=${note.forum}&noteId=${officialReview.id}&referrer=${referrerUrl}`
              : null
          }
          paperRating={paperRatingValue}
          review={officialReview?.content?.review}
          invitationUrl={
            officialReviewInvitation
              ? `/forum?id=${note.forum}&noteId=${note.id}&invitationId=${officialReviewInvitation.id}&referrer=${referrerUrl}`
              : null
          }
        />
        {paperRankingTags && (
          <PaperRankingDropdown
            noteId={note.id}
            noteForum={note.forum}
            notesCount={notesCount}
            currentTagObj={currentTagObj}
            existingPaperRankingTags={paperRankingTags}
            paperRankingInvitation={paperRankingInvitation}
            paperRankingId={paperRankingId}
            anonGroupId={anonGroupId}
            tagReaders={[
              venueId,
              `${venueId}/${submissionName}${note.number}/${areaChairName}`,
              anonGroupId,
            ]}
            setReviewerConsoleData={setReviewerConsoleData}
            enablePaperRanking={enablePaperRanking}
            setEnablePaperRanking={setEnablePaperRanking}
          />
        )}
      </td>
    </tr>
  )
}

const ReviewerConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    reviewerName,
    officialReviewName,
    reviewRatingName,
    areaChairName,
    submissionName,
    submissionInvitationId,
    customLoadInvitationId, // for v1 only
    recruitmentInvitationId, // for v2 only
    customMaxPapersInvitationId, // to query custom load edges
    reviewLoad,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [reviewerConsoleData, setReviewerConsoleData] = useState({})
  const [enablePaperRanking, setEnablePaperRanking] = useState(true)

  const wildcardInvitation = `${venueId}/.*`
  const paperRankingId = `${venueId}/${reviewerName}/-/Paper_Ranking`

  const formatInvitations = (allInvitations) => formatTasksData([allInvitations, [], []], true)
  const loadData = async () => {
    const userIds = [...user.profile.usernames, ...user.profile.emails]

    try {
      // #region get reviewer note number
      const singularName = reviewerName.endsWith('s')
        ? reviewerName.slice(0, -1)
        : reviewerName
      const memberGroups = await api.getAll(
        '/groups',
        {
          regex: `${venueId}/${submissionName}.*`,
          member: user.id,
        },
        { accessToken }
      )
      const anonGroups = memberGroups.filter((p) => p.id.includes(`/${singularName}_`))

      const groupByNumber = memberGroups
        .filter((p) => p.id.endsWith(`/${reviewerName}`))
        .reduce((prev, curr) => {
          const num = getNumberFromGroup(curr.id, submissionName)
          const anonGroup = anonGroups.find((p) =>
            p.id.startsWith(`${venueId}/${submissionName}${num}/${singularName}_`)
          )
          return anonGroup ? { ...prev, [num]: anonGroup.id } : prev
        }, {})
      //#endregion
      const noteNumbers = Object.keys(groupByNumber)

      // #region get notes
      const getNotesP = noteNumbers.length
        ? api
            .get(
              '/notes',
              {
                invitation: submissionInvitationId,
                number: noteNumbers.join(','),
                details: 'invitation,directReplies',
              },
              { accessToken, version: apiVersion }
            )
            .then((result) => result.notes ?? [])
        : Promise.resolve([])
      //#endregion

      // #region get all invitations
      const invitationsP = api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'notes',
          details: 'replytoNote,repliedNotes',
        },
        { accessToken, version: apiVersion }
      )
      const edgeInvitationsP = api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'edges',
          details: 'repliedEdges',
        },
        { accessToken, version: apiVersion }
      )
      const tagInvitationsP = api.getAll(
        '/invitations',
        {
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'tags',
          details: 'repliedTags',
        },
        { accessToken, version: apiVersion }
      )
      const getAllInvitationsP = Promise.all([
        invitationsP,
        edgeInvitationsP,
        tagInvitationsP,
      ]).then(([noteInvitations, edgeInvitations, tagInvitations]) => {
        return noteInvitations
          .map((p) => ({ ...p, noteInvitation: true, apiVersion }))
          .concat(edgeInvitations.map((p) => ({ ...p, tagInvitation: true, apiVersion })))
          .concat(tagInvitations.map((p) => ({ ...p, tagInvitation: true, apiVersion })))
          .filter((p) => {
            return filterAssignedInvitations(p, reviewerName, submissionName, noteNumbers)
          })
      })
      // #endregion

      // #region get custom load
      const getCustomLoadP = api
        .get(
          '/edges',
          {
            invitation: customMaxPapersInvitationId,
            tail: user.id,
          },
          { accessToken }
        )
        .then((result) => {
          if (result.edges?.length) return result.edges[0].weight
          return apiVersion === 2
            ? api
                .get(
                  '/notes',
                  {
                    invitation: recruitmentInvitationId,
                    sort: 'cdate:desc',
                  },
                  { accessToken, version: 2 }
                )
                .then((result) => {
                  if (!result.notes?.length) return reviewLoad
                  return result.notes[0].content?.['reduced_load']?.value
                })
            : api
                .get(
                  '/notes',
                  {
                    invitation: customLoadInvitationId,
                    select: 'content.reviewer_load,content.user,content.reduced_load',
                  },
                  { accessToken, version: 1 }
                )
                .then((result) => {
                  if (!result.notes?.length) return reviewLoad
                  if (result.notes.length === 1) {
                    return (
                      result.notes[0].content.reviewer_load ||
                      result.notes[0].content.reduced_load
                    )
                  } else {
                    // If there is more than one there might be a Program Chair
                    const loads = result.notes.filter((p) =>
                      userIds.includes(note.content.user)
                    )
                    return loads.length
                      ? loads[0].content.reviewer_load || loads[0].content.reduced_load
                      : reviewLoad
                  }
                })
        })
      // #endregion

      // #region get area chair groups
      const getAreaChairGroupsP = api
        .getAll(
          '/groups',
          {
            regex: `${venueId}/${submissionName}.*`,
            select: 'id,members',
          },
          { accessToken }
        )
        .then((groups) => {
          return groups
            .filter((p) => p.id.includes(areaChairName))
            .reduce((prev, curr) => {
              const num = getNumberFromGroup(curr.id, submissionName)
              prev[num] = curr.members[0]
              return prev
            }, {})
        })
      // #endregion

      Promise.all([getNotesP, getAllInvitationsP, getCustomLoadP, getAreaChairGroupsP]).then(
        ([notes, invitations, customLoad, areaChairMap]) => {
          const anonGroupIds = anonGroups.map((p) => p.id)
          // get official reviews from notes details
          const officialReviewFilterFn =
            apiVersion === 2
              ? (p) => p.invitations.some((q) => q.includes(officialReviewName))
              : (p) => p.invitation.includes(officialReviewName)
          const officialReviews = notes
            .flatMap((p) => p.details.directReplies)
            .filter(
              (q) =>
                officialReviewFilterFn(q) && q.signatures.some((r) => anonGroupIds.includes(r))
            )
          const paperRankingInvitation = invitations.find((p) => p.id === paperRankingId)
          if (paperRankingInvitation) {
            setReviewerConsoleData({
              paperNumberAnonGroupIdMap: groupByNumber,
              notes,
              customLoad,
              invitations: formatInvitations(invitations),
              officialReviews,
              paperRankingTags: paperRankingInvitation.details?.repliedTags ?? [],
              areaChairMap,
            })
          } else {
            return api
              .get(
                '/tags',
                {
                  invitation: paperRankingId,
                },
                { accessToken }
              )
              .then((result) => {
                setReviewerConsoleData({
                  paperNumberAnonGroupIdMap: groupByNumber,
                  notes,
                  customLoad,
                  invitations: formatInvitations(invitations),
                  officialReviews,
                  paperRankingTags: result.tags?.length ? result.tags : null, // null will not render paper ranking
                  areaChairMap,
                })
              })
          }
        }
      )
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
    if (
      userLoading ||
      !user ||
      !group ||
      !submissionInvitationId ||
      !submissionName ||
      !venueId
    )
      return
    loadData()
  }, [user, userLoading, group])

  useEffect(() => {
    if (reviewerConsoleData.notes) {
      typesetMathJax()
    }
  }, [reviewerConsoleData.notes])

  const missingConfig = Object.entries({
    header,
    group,
    venueId,
    apiVersion,
    reviewerName,
    officialReviewName,
    reviewRatingName,
    areaChairName,
    submissionName,
    submissionInvitationId,
    reviewLoad,
  }).filter(([key, value]) => value === undefined)
  if (
    missingConfig?.length ||
    (apiVersion === 2 && recruitmentInvitationId === undefined) ||
    (apiVersion === 1 && customLoadInvitationId === undefined)
  ) {
    const errorMessage = `Reviewer Console is missing required properties: ${
      missingConfig.length
        ? missingConfig.map((p) => p[0]).join(', ')
        : `${apiVersion === 2 ? 'recruitmentInvitationId' : 'customLoadInvitationId'}`
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header.instructions}
        customLoad={reviewerConsoleData.customLoad}
      />
      <Tabs>
        <TabList>
          <Tab id="assigned-papers" active>
            Assigned Papers
          </Tab>
          <Tab id="reviewer-tasks">Reviewer Tasks</Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">
            {reviewerConsoleData.notes?.length === 0 ? (
              <p className="empty-message">
                You have no assigned papers. Please check again after the paper assignment
                process is complete.
              </p>
            ) : (
              <div className="table-container">
                <Table
                  className="console-table table-striped"
                  headings={[
                    { id: 'number', content: '#', width: '8%' },
                    { id: 'summary', content: 'Paper Summary', width: '46%' },
                    { id: 'ratings', content: 'Your Ratings', width: '46%' },
                  ]}
                >
                  {reviewerConsoleData.notes?.map((note) => {
                    return (
                      <AssignedPaperRow
                        key={note.id}
                        note={note}
                        reviewerConsoleData={reviewerConsoleData}
                        paperRankingId={paperRankingId}
                        setReviewerConsoleData={setReviewerConsoleData}
                        enablePaperRanking={enablePaperRanking}
                        setEnablePaperRanking={setEnablePaperRanking}
                      />
                    )
                  })}
                </Table>
              </div>
            )}
          </TabPanel>
          <TabPanel id="reviewer-tasks">
            <TaskList
              invitations={reviewerConsoleData.invitations}
              emptyMessage="No outstanding tasks for this conference"
              referrer={`${encodeURIComponent(
                `[Reviewer Console](/group?id=${venueId}/${reviewerName}'#reviewer-tasks)`
              )}&t=${Date.now()}`}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ReviewerConsole
