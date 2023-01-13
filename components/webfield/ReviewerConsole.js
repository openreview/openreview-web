/* globals typesetMathJax,promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
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
  prettyField,
  prettyId,
  prettyInvitationId,
} from '../../lib/utils'
import Dropdown from '../Dropdown'
import useQuery from '../../hooks/useQuery'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import ErrorDisplay from '../ErrorDisplay'
import { filterAssignedInvitations, filterHasReplyTo } from '../../lib/webfield-utils'
import DownloadPDFButton from '../DownloadPDFButton'

const AreaChairInfo = ({ areaChairName, areaChairId }) => (
  <div className="note-area-chairs">
    <p>
      <strong>{prettyField(areaChairName)}:</strong>{' '}
      <Link href={`/profile?id=${areaChairId}`}>
        <a>{prettyId(areaChairId)}</a>
      </Link>
    </p>
  </div>
)

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
        const newPaperRankingTags = [...reviewerConsoleData.paperRankingTags].filter(
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
    officialReviewInvitations,
    paperRankingInvitation,
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
  const officialReviewInvitation = officialReviewInvitations?.find(
    (p) => p.id === officialReviewInvitaitonId
  )
  const officialReview = officialReviews.find((p) =>
    isV2Note
      ? p.invitations.includes(officialReviewInvitaitonId)
      : p.invitation === officialReviewInvitaitonId
  )
  const currentTagObj = paperRankingTags?.find((p) => p.forum === note.forum)
  const anonGroupId = paperNumberAnonGroupIdMap[note.number]
  const areaChairId = areaChairMap[note.number]
  const paperRatingValue = isV2Note
    ? officialReview?.content?.[reviewRatingName]?.value
    : officialReview?.content?.[reviewRatingName]
  const review = isV2Note
    ? officialReview?.content?.review?.value
    : officialReview?.content?.review
  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Note} />
        {areaChairId && (
          <AreaChairInfo areaChairName={areaChairName} areaChairId={areaChairId} />
        )}
      </td>
      <td>
        <ReviewerConsoleNoteReviewStatus
          editUrl={
            officialReview
              ? `/forum?id=${note.forum}&noteId=${officialReview.id}&referrer=${referrerUrl}`
              : null
          }
          paperRating={paperRatingValue}
          review={review}
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

const ReviewerConsoleTasks = ({
  venueId,
  reviewerName,
  apiVersion,
  submissionName,
  noteNumbers,
}) => {
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

  const loadInvitations = async () => {
    try {
      let allInvitations = await api.getAll(
        '/invitations',
        {
          ...(apiVersion !== 2 && { regex: wildcardInvitation }),
          ...(apiVersion === 2 && { domain: venueId }),
          invitee: true,
          duedate: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )

      allInvitations = allInvitations
        .map((p) => addInvitaitonTypeAndVersion(p))
        .filter((p) => filterHasReplyTo(p, apiVersion))
        .filter((p) => filterAssignedInvitations(p, reviewerName, submissionName, noteNumbers))

      if (allInvitations.length) {
        // add details
        const validInvitationDetails = await api.getAll(
          '/invitations',
          {
            ids: allInvitations.map((p) => p.id),
            details: 'all',
            select: 'id,details',
          },
          { accessToken, version: apiVersion }
        )

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
      referrer={`${encodeURIComponent(
        `[Reviewer Console](/group?id=${venueId}/${reviewerName}#reviewer-tasks)`
      )}&t=${Date.now()}`}
    />
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
    hasPaperRanking,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [showTasks, setShowTasks] = useState(false)
  const [reviewerConsoleData, setReviewerConsoleData] = useState({})
  const [enablePaperRanking, setEnablePaperRanking] = useState(true)

  const paperRankingId = `${venueId}/${reviewerName}/-/Paper_Ranking`

  const loadData = async () => {
    const userIds = [...user.profile.usernames, ...user.profile.emails]

    let anonGroups
    let groupByNumber
    let noteNumbers
    // #region get reviewer note number
    try {
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
      anonGroups = memberGroups.filter((p) => p.id.includes(`/${singularName}_`))

      groupByNumber = memberGroups
        .filter((p) => p.id.endsWith(`/${reviewerName}`))
        .reduce((prev, curr) => {
          const num = getNumberFromGroup(curr.id, submissionName)
          const anonGroup = anonGroups.find((p) =>
            p.id.startsWith(`${venueId}/${submissionName}${num}/${singularName}_`)
          )
          return anonGroup ? { ...prev, [num]: anonGroup.id } : prev
        }, {})
      noteNumbers = Object.keys(groupByNumber)
    } catch (error) {
      promptError(error.message)
    }
    // #endregion

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
    // #endregion

    // #region paper ranking invitation
    const paperRankingInvitationP = hasPaperRanking
      ? api.getInvitationById(paperRankingId, accessToken, {
          invitee: true,
          duedate: true,
          type: 'tags',
          details: 'repliedTags',
        })
      : Promise.resolve(null)
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
        if (result.edges?.length) {
          return result.edges[0].weight
        }

        if (apiVersion === 2) {
          return api
            .get(
              '/notes',
              {
                invitation: recruitmentInvitationId,
                sort: 'cdate:desc',
              },
              { accessToken, version: 2 }
            )
            .then((noteResult) => {
              if (!noteResult.notes?.length) return reviewLoad
              return noteResult.notes[0].content?.reduced_load?.value
            })
        }

        return api
          .get(
            '/notes',
            {
              invitation: customLoadInvitationId,
              select: 'content.reviewer_load,content.user,content.reduced_load',
            },
            { accessToken, version: 1 }
          )
          .then((noteResult) => {
            if (!noteResult.notes?.length) return reviewLoad
            if (noteResult.notes.length === 1) {
              return (
                noteResult.notes[0].content.reviewer_load ||
                noteResult.notes[0].content.reduced_load
              )
            }
            // If there is more than one there might be a Program Chair
            const loads = noteResult.notes.filter((note) =>
              userIds.includes(note.content.user)
            )
            return loads.length
              ? loads[0].content.reviewer_load || loads[0].content.reduced_load
              : reviewLoad
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
      .then((groups) =>
        groups
          .filter((p) => p.id.endsWith(`/${areaChairName}`))
          .reduce((prev, curr) => {
            const num = getNumberFromGroup(curr.id, submissionName)
            prev[num] = curr.members[0] // eslint-disable-line no-param-reassign
            return prev
          }, {})
      )
    // #endregion

    Promise.all([getNotesP, paperRankingInvitationP, getCustomLoadP, getAreaChairGroupsP])
      .then(([notes, paperRankingInvitation, customLoad, areaChairMap]) => {
        const officalReviewInvitationIds = notes.map(
          (note) => `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
        )
        // get offical review invitations to show submit official review link
        return api
          .get(
            '/invitations',
            {
              ids: officalReviewInvitationIds,
            },
            { accessToken, version: apiVersion }
          )
          .then((officialReviewInvitationsResult) => [
            notes,
            paperRankingInvitation,
            customLoad,
            areaChairMap,
            officialReviewInvitationsResult.invitations,
          ])
      })
      .then(
        ([
          notes,
          paperRankingInvitation,
          customLoad,
          areaChairMap,
          officialReviewInvitations,
        ]) => {
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

          let paperRankingTagsP = Promise.resolve(null)
          if (paperRankingInvitation) {
            paperRankingTagsP = Promise.resolve(
              paperRankingInvitation.details?.repliedTags ?? []
            )
          } else if (hasPaperRanking) {
            paperRankingTagsP = api
              .get('/tags', { invitation: paperRankingId }, { accessToken })
              .then((result) => (result.tags?.length > 0 ? result.tags : []))
          }
          paperRankingTagsP.then((paperRankingTags) => {
            setReviewerConsoleData({
              paperNumberAnonGroupIdMap: groupByNumber,
              notes,
              customLoad,
              officialReviews,
              paperRankingTags,
              areaChairMap,
              noteNumbers,
              officialReviewInvitations,
              paperRankingInvitation,
            })
          })
        }
      )
      .catch((error) => {
        promptError(error.message)
      })
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
    customMaxPapersInvitationId,
    reviewLoad,
    hasPaperRanking,
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
          <Tab id="reviewer-tasks" onClick={() => setShowTasks(true)}>
            Reviewer Tasks
          </Tab>
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
                    { id: 'number', content: '#', width: '55px' },
                    { id: 'summary', content: 'Paper Summary', width: '46%' },
                    { id: 'ratings', content: 'Your Ratings', width: 'auto' },
                  ]}
                >
                  {reviewerConsoleData.notes?.map((note) => (
                    <AssignedPaperRow
                      key={note.id}
                      note={note}
                      reviewerConsoleData={reviewerConsoleData}
                      paperRankingId={paperRankingId}
                      setReviewerConsoleData={setReviewerConsoleData}
                      enablePaperRanking={enablePaperRanking}
                      setEnablePaperRanking={setEnablePaperRanking}
                    />
                  ))}
                </Table>
              </div>
            )}
          </TabPanel>

          <TabPanel id="reviewer-tasks">
            {showTasks && (
              <ReviewerConsoleTasks
                venueId={venueId}
                reviewerName={reviewerName}
                apiVersion={apiVersion}
                submissionName={submissionName}
                noteNumbers={reviewerConsoleData.noteNumbers}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ReviewerConsole
