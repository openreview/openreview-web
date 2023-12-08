/* globals typesetMathJax,promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { chunk } from 'lodash'
import api from '../../lib/api-client'
import Table from '../Table'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { ReviewerConsoleNoteReviewStatus } from './NoteReviewStatus'
import NoteSummary from './NoteSummary'
import useUser from '../../hooks/useUser'
import { getNumberFromGroup, prettyField, prettyId, prettyInvitationId } from '../../lib/utils'
import Dropdown from '../Dropdown'
import useQuery from '../../hooks/useQuery'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import ErrorDisplay from '../ErrorDisplay'
import ReviewerConsoleMenuBar from './ReviewerConsoleMenuBar'
import LoadingSpinner from '../LoadingSpinner'
import ConsoleTaskList from './ConsoleTaskList'

const AreaChairInfo = ({ areaChairName, areaChairIds }) => (
  <div className="note-area-chairs">
    <p>
      <strong>{prettyField(areaChairName)}:</strong>{' '}
      {areaChairIds.map((areaChairId) => (
        <Link key={areaChairId} href={`/profile?id=${areaChairId}`}>
          {prettyId(areaChairId)}{' '}
        </Link>
      ))}
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
    p.invitations.includes(officialReviewInvitaitonId)
  )
  const currentTagObj = paperRankingTags?.find((p) => p.forum === note.forum)
  const anonGroupId = paperNumberAnonGroupIdMap[note.number]
  const areaChairIds = areaChairMap[note.number]
  const paperRatingValues = (
    Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]
  ).map((ratingName) => ({ [ratingName]: officialReview?.content?.[ratingName]?.value }))
  const review = officialReview?.content?.review?.value

  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={true} />
        {areaChairIds?.length && (
          <AreaChairInfo areaChairName={areaChairName} areaChairIds={areaChairIds} />
        )}
      </td>
      <td>
        <ReviewerConsoleNoteReviewStatus
          editUrl={
            officialReview
              ? `/forum?id=${note.forum}&noteId=${officialReview.id}&referrer=${referrerUrl}`
              : null
          }
          paperRatings={paperRatingValues}
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
              ...(areaChairName
                ? [`${venueId}/${submissionName}${note.number}/${areaChairName}`]
                : []),
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

const ReviewerConsoleTasks = ({ venueId, reviewerName, submissionName, noteNumbers }) => {
  const referrer = `${encodeURIComponent(
    `[Reviewer Console](/group?id=${venueId}/${reviewerName}#reviewer-tasks)`
  )}`

  return (
    <ConsoleTaskList
      venueId={venueId}
      roleName={reviewerName}
      referrer={referrer}
      filterAssignedInvitaiton={true}
      submissionName={submissionName}
      submissionNumbers={noteNumbers}
    />
  )
}

const ReviewerConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    reviewerName,
    officialReviewName,
    reviewRatingName,
    areaChairName,
    submissionName,
    submissionInvitationId,
    recruitmentInvitationId,
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
          prefix: `${venueId}/${submissionName}.*`,
          member: user.id,
          domain: group.domain,
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
              domain: group.domain,
              details: 'invitation,directReplies',
            },
            { accessToken }
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
          domain: group.domain,
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
          domain: group.domain,
        },
        { accessToken }
      )
      .then((result) => {
        if (result.edges?.length) {
          return result.edges[0].weight
        }

        return api
          .get(
            '/notes',
            {
              invitation: recruitmentInvitationId,
              domain: group.domain,
              sort: 'cdate:desc',
            },
            { accessToken }
          )
          .then((noteResult) => {
            if (!noteResult.notes?.length) return reviewLoad
            return noteResult.notes[0].content?.reduced_load?.value
          })
      })
    // #endregion

    // #region get area chair groups
    const getAreaChairGroupsP = areaChairName
      ? api
          .get(
            '/groups',
            {
              prefix: `${venueId}/${submissionName}.*`,
              select: 'id,members',
              domain: group.domain,
              stream: true,
            },
            { accessToken }
          )
          .then((result) => {
            const areaChairMap = {}
            result.groups.forEach((areaChairgroup) => {
              if (areaChairgroup.id.endsWith(`/${areaChairName}`)) {
                const num = getNumberFromGroup(areaChairgroup.id, submissionName)
                areaChairMap[num] = areaChairgroup.members
              }
            })
            result.groups.forEach((anonGroup) => {
              if (anonGroup.id.includes(`/Area_Chair_`)) {
                // TODO: parametrize anon group name
                const num = getNumberFromGroup(anonGroup.id, submissionName)
                if (areaChairMap[num]) {
                  const index = areaChairMap[num].indexOf(anonGroup.id)
                  if (index >= 0) areaChairMap[num][index] = anonGroup.members[0]
                }
              }
            })
            return areaChairMap
          })
      : Promise.resolve({})
    // #endregion

    Promise.all([getNotesP, paperRankingInvitationP, getCustomLoadP, getAreaChairGroupsP])
      .then(([notes, paperRankingInvitation, customLoad, areaChairMap]) => {
        const noteChunks = chunk(notes, 50)
        // get offical review invitations to show submit official review link
        const officalReviewInvitationPs = noteChunks.map((noteChunk) => {
          const officalReviewInvitationIds = noteChunk.map(
            (note) => `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
          )
          return api
            .get(
              '/invitations',
              {
                ids: officalReviewInvitationIds,
                domain: group.domain,
              },
              { accessToken }
            )
            .then((result) => result.invitations)
        })
        return Promise.all(officalReviewInvitationPs)
          .then((invitationChunks) => invitationChunks.flat())
          .then((officialReviewInvitationsResult) => [
            notes,
            paperRankingInvitation,
            customLoad,
            areaChairMap,
            officialReviewInvitationsResult,
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
          const officialReviews = notes
            .flatMap((p) => p.details.directReplies)
            .filter(
              (q) =>
                q.invitations.some((r) => r.includes(officialReviewName)) &&
                q.signatures.some((r) => anonGroupIds.includes(r))
            )

          let paperRankingTagsP = Promise.resolve(null)
          if (paperRankingInvitation) {
            paperRankingTagsP = Promise.resolve(
              paperRankingInvitation.details?.repliedTags ?? []
            )
          } else if (hasPaperRanking) {
            paperRankingTagsP = api
              .get(
                '/tags',
                { invitation: paperRankingId, domain: group.domain },
                { accessToken }
              )
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
    if (!userLoading && !user) {
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
    reviewerName,
    officialReviewName,
    reviewRatingName,
    submissionName,
    submissionInvitationId,
    customMaxPapersInvitationId,
    reviewLoad,
    hasPaperRanking,
  }).filter(([key, value]) => value === undefined)
  if (missingConfig?.length || recruitmentInvitationId === undefined) {
    const errorMessage = `Reviewer Console is missing required properties: ${
      missingConfig.length
        ? missingConfig.map((p) => p[0]).join(', ')
        : 'recruitmentInvitationId'
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  if (!reviewerConsoleData.notes) return <LoadingSpinner />

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
                <ReviewerConsoleMenuBar
                  venueId={venueId}
                  records={reviewerConsoleData.notes}
                />
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
