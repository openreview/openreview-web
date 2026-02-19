/* eslint-disable max-len */
/* globals typesetMathJax,promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { chunk } from 'lodash'
import api from '../../lib/api-client'
import Table from '../Table'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { ReviewerConsoleNoteReviewStatus } from './NoteReviewStatus'
import NoteSummary from './NoteSummary'
import useUser from '../../hooks/useUser'
import {
  getNumberFromGroup,
  pluralizeString,
  prettyField,
  prettyId,
  prettyInvitationId,
  getSingularRoleName,
  getRoleHashFragment,
} from '../../lib/utils'
import Dropdown from '../Dropdown'
import ErrorDisplay from '../ErrorDisplay'
import ReviewerConsoleMenuBar from './ReviewerConsoleMenuBar'
import LoadingSpinner from '../LoadingSpinner'
import ConsoleTaskList from './ConsoleTaskList'
import ConsoleTabs from './ConsoleTabs'
import ProfileLink from './ProfileLink'

const AreaChairInfo = ({ areaChairName, areaChairIds }) => (
  <div className="note-area-chairs">
    <strong>{prettyField(areaChairName)}:</strong>
    {areaChairIds.map((areaChairId) => (
      <div key={areaChairId}>
        <ProfileLink id={areaChairId} name={prettyId(areaChairId)} />
      </div>
    ))}
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
      const result = await api.post('/tags', {
        id: currentTagObj.id,
        tag: newTagValue,
        signatures: [anonGroupId],
        readers: tagReaders,
        forum: noteId,
        invitation: paperRankingInvitation?.id ?? paperRankingId,
        ddate: null,
      })

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
  reviewDisplayFields,
  activeTabId,
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
    `[${prettyField(
      reviewerName
    )} Console](/group?id=${venueId}/${reviewerName}${activeTabId})`
  )
  const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
  const officialReviewInvitation = officialReviewInvitations?.find(
    (p) => p.id === officialReviewInvitationId
  )
  const officialReview = officialReviews.find((p) =>
    p.invitations.includes(officialReviewInvitationId)
  )
  const currentTagObj = paperRankingTags?.find((p) => p.forum === note.forum)
  const anonGroupId = paperNumberAnonGroupIdMap[note.number]
  const areaChairIds = areaChairMap[note.number]
  const paperRatingValues = (
    Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]
  ).map((ratingName) => {
    let ratingDisplayName
    let ratingValue
    if (typeof ratingName === 'object') {
      ratingDisplayName = Object.keys(ratingName)[0]
      ratingValue = Object.values(ratingName)[0]
        .map((p) => officialReview?.content?.[p]?.value)
        .find((q) => q !== undefined)
    } else {
      ratingDisplayName = ratingName
      ratingValue = officialReview?.content?.[ratingName]?.value
    }
    return { [ratingDisplayName]: ratingValue }
  })

  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={true} />
        {areaChairIds?.length > 0 && (
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
          officialReview={officialReview}
          invitationUrl={
            officialReviewInvitation
              ? `/forum?id=${note.forum}&noteId=${note.id}&invitationId=${officialReviewInvitation.id}&referrer=${referrerUrl}`
              : null
          }
          reviewDisplayFields={reviewDisplayFields}
          officialReviewName={officialReviewName}
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
  const reviewerUrlFormat = getRoleHashFragment(reviewerName)
  const referrer = `${encodeURIComponent(
    `[${prettyField(
      reviewerName
    )} Console](/group?id=${venueId}/${reviewerName}#${reviewerUrlFormat}-tasks)`
  )}`

  return (
    <ConsoleTaskList
      venueId={venueId}
      roleName={reviewerName}
      referrer={referrer}
      filterAssignedInvitation={true}
      submissionName={submissionName}
      submissionNumbers={noteNumbers}
    />
  )
}

const ReviewerConsoleTabs = ({
  reviewerConsoleData,
  setReviewerConsoleData,
  paperRankingId,
}) => {
  const [enablePaperRanking, setEnablePaperRanking] = useState(true)
  const {
    venueId,
    reviewerName,
    officialReviewName,
    submissionName,
    reviewDisplayFields = ['review'],
  } = useContext(WebFieldContext)
  const defaultActiveTabId = `assigned-${pluralizeString(submissionName ?? '').toLowerCase()}`
  const [activeTabId, setActiveTabId] = useState(defaultActiveTabId)
  const reviewerUrlFormat = reviewerName ? getRoleHashFragment(reviewerName) : null

  const renderTable = () => {
    if (!reviewerConsoleData.notes) return <LoadingSpinner />
    if (reviewerConsoleData.notes?.length === 0) {
      return (
        <p className="empty-message">
          You have no assigned papers. Please check again after the paper assignment process is
          complete.
        </p>
      )
    }

    if (reviewerConsoleData.tableRows?.length === 0)
      return (
        <div className="table-container empty-table-container">
          <ReviewerConsoleMenuBar
            venueId={venueId}
            tableRowsAll={reviewerConsoleData.tableRowsAll}
            tableRows={reviewerConsoleData.tableRows}
            setReviewerConsoleData={setReviewerConsoleData}
            submissionName={submissionName}
          />
          <p className="empty-message">No {submissionName} matching search criteria.</p>
        </div>
      )
    return (
      <div className="table-container">
        <ReviewerConsoleMenuBar
          venueId={venueId}
          tableRowsAll={reviewerConsoleData.tableRowsAll}
          tableRows={reviewerConsoleData.tableRows}
          setReviewerConsoleData={setReviewerConsoleData}
          submissionName={submissionName}
        />
        <Table
          className="console-table table-striped"
          headings={[
            { id: 'number', content: '#', width: '55px' },
            { id: 'summary', content: `${submissionName} Summary`, width: '46%' },
            {
              id: 'ratings',
              content: `Your ${prettyField(officialReviewName)} Ratings`,
              width: 'auto',
            },
          ]}
        >
          {reviewerConsoleData.tableRows?.map((row) => (
            <AssignedPaperRow
              key={row.note.id}
              note={row.note}
              reviewerConsoleData={reviewerConsoleData}
              paperRankingId={paperRankingId}
              setReviewerConsoleData={setReviewerConsoleData}
              enablePaperRanking={enablePaperRanking}
              setEnablePaperRanking={setEnablePaperRanking}
              reviewDisplayFields={reviewDisplayFields}
              activeTabId={activeTabId}
            />
          ))}
        </Table>
      </div>
    )
  }
  return (
    <ConsoleTabs
      defaultActiveTabId={defaultActiveTabId}
      tabs={[
        {
          id: `assigned-${pluralizeString(submissionName).toLowerCase()}`,
          label: `Assigned ${pluralizeString(submissionName)}`,
          content: renderTable(),
          visible: true,
        },
        {
          id: `${reviewerUrlFormat}-tasks`,
          label: `${getSingularRoleName(prettyField(reviewerName))} Tasks`,
          content: (
            <ReviewerConsoleTasks
              venueId={venueId}
              reviewerName={reviewerName}
              submissionName={submissionName}
              noteNumbers={reviewerConsoleData.noteNumbers}
            />
          ),
          visible: true,
        },
      ]}
      updateActiveTabId={setActiveTabId}
    />
  )
}

// #region config docs
/** Reviewer Console config doc
 *
 * @typedef {Object} ReviewerConsoleConfig
 *
 // eslint-disable-next-line max-len
 * @property {Object} header mandatory but can be empty object
 * @property {string} venueId mandatory
 * @property {string} reviewerName mandatory
 * @property {string} officialReviewName mandatory
 * @property {string|string[]|object[]} reviewRatingName mandatory
 * @property {string} areaChairName optional
 * @property {string} submissionName mandatory
 * @property {string} submissionInvitationId mandatory
 * @property {string} recruitmentInvitationId mandatory
 * @property {string} customMaxPapersInvitationId mandatory
 * @property {string[]} edgeInvitationIds optional
 * @property {string|number} reviewLoad mandatory
 * @property {boolean} hasPaperRanking mandatory
 * @property {string[]} reviewDisplayFields optional
 */

/**
 * @name ReviewerConsoleConfig.header
 * @description Page header. Contains two string fields: "title" and "instructions" (markdown supported).
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "header": {
 *     "title": "Some conference",
 *     "instructions": "some **instructions**"
 *   }
 * }
 */

/**
 * @name ReviewerConsoleConfig.venueId
 * @description Used to construct banner content, referrer link and various group/invitation ids. The value is usually domain.id
 * @type {string}
 * @default no default value
 * @example
 * { "venueId": "ICLR.cc/202X/Conference" }
 */

/**
 * @name ReviewerConsoleConfig.reviewerName
 * @description Used to construct referrer link, title and for filtering groups
 * @type {string}
 * @default no default value
 * @example
 * { "reviewerName": "Reviewers" }
 */

/**
 * @name ReviewerConsoleConfig.officialReviewName
 * @description Used to construct official review invitation id
 * @type {string}
 * @default no default value
 * @example
 * { "officialReviewName": "Official_Review" }
 */

/**
 * @name ReviewerConsoleConfig.reviewRatingName
 * @description Used to get rating value from official review, support string, string array for displaying multiple rating fields and object array which allows custom rating name and fallback values
 * @type {string|string[]|object[]}
 * @default no default value
 * @example <caption>string shows single rating</caption>
 * { "reviewRatingName": "rating" }
 * @example <caption>string array shows multiple ratings</caption>
 * { "reviewRatingName": ["soundness","excitement","reproducibility"] }
 * @example <caption>object array/mixed shows multiple ratings with fallback options the following config would show 2 ratings: "overall_rating" and "overall_recommendation" for "overall_rating", it's value will be final_rating field, when final_rating field is not available, it will take the next available value defined in the array, in this example it will take "preliminary_rating"</caption>
 * {
 *  "reviewRatingName": [
 *    {
 *      "overall_rating": [
 *        "final_rating",
 *        "preliminary_rating"
 *      ]
 *    },
 *    "overall_recommendation",
 *  ]
 */

/**
 * @name ReviewerConsoleConfig.areaChairName
 * @description Used to construct AC/Anonymous AC group and label. optional for venues that don't have area chairs
 * @type {string}
 * @default no default value
 * @example
 * { "areaChairName": "Area_Chairs" }
 */

/**
 * @name ReviewerConsoleConfig.submissionName
 * @description Used to filter/construct group id (paper display/tasks), invitation id, header text
 * @type {string}
 * @default no default value
 * @example
 * { "submissionName": "Submission" }
 */

/**
 * @name ReviewerConsoleConfig.submissionInvitationId
 * @description Notes with the submissionInvitationId will be fetched
 * @type {string}
 * @default no default value
 * @example
 * { "submissionInvitationId": "ICLR.cc/202X/Conference/-/Submission" }
 */

/**
 * @name ReviewerConsoleConfig.recruitmentInvitationId
 * @description Related to customMaxPapersInvitationId and reviewLoad. The invitation to get recruitment note where custom load is saved (if there's no custom load edge) and custom load is displayed in header
 * @type {string}
 * @default no default value
 * @example
 * { "recruitmentInvitationId": "ICLR.cc/202X/Conference/Reviewers/-/Recruitment" }
 */

/**
 * @name ReviewerConsoleConfig.customMaxPapersInvitationId
 * @description Related to recruitmentInvitationId and reviewLoad. The invitation to get custom load edge. If edge exist the weight is used as custom load otherwise it will load the recruitment note to read the reduced_load field.
 * @type {string}
 * @default no default value
 * @example
 * { "customMaxPapersInvitationId": "ICLR.cc/202X/Conference/Reviewers/-/Custom_Max_Papers" }
 */

/**
 * @name ReviewerConsoleConfig.edgeInvitationIds
 * @description The invitations to get edge for the logged in reviewer. If edge exist the label or weight is shown at top of page. When there are multiple edges, the value is joined
 * @type {string[]}
 * @default []
 * @example
 * { "edgeInvitationIds": ["ICLR.cc/202X/Conference/Reviewers/-/Review_Policy"] }
 */

/**
 * @name ReviewerConsoleConfig.reviewLoad
 * @description Related to recruitmentInvitationId and customMaxPapersInvitationId. The default value to display in header when there's no custom load edge or recruitment note
 * @type {string|number}
 * @default no default value
 * @example
 * { "reviewLoad": "" }
 */

/**
 * @name ReviewerConsoleConfig.hasPaperRanking
 * @description Flag to enable paper ranking (tag fetching and display)
 * @type {boolean}
 * @default no default value
 * @example
 * { "hasPaperRanking": false }
 */

/**
 * @name ReviewerConsoleConfig.reviewDisplayFields
 * @description The content fields to display from official review note
 * @type {string[]}
 * @default ['review']
 * @example
 * { "reviewDisplayFields": ['review'] }
 */

// #endregion
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
    edgeInvitationIds = [],
    reviewLoad,
    hasPaperRanking,
    reviewDisplayFields = ['review'],
  } = useContext(WebFieldContext)
  const { user, isRefreshing } = useUser()
  const query = useSearchParams()
  const { setBannerContent } = appContext ?? {}
  const [reviewerConsoleData, setReviewerConsoleData] = useState({})

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
      const memberGroups = await api.getAll('/groups', {
        prefix: `${venueId}/${submissionName}.*`,
        member: user.id,
        domain: group.domain,
      })
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
          .get('/notes', {
            invitation: submissionInvitationId,
            number: noteNumbers.join(','),
            domain: group.domain,
            details: 'invitation,directReplies',
          })
          .then((result) => result.notes ?? [])
      : Promise.resolve([])
    // #endregion

    // #region paper ranking invitation
    const paperRankingInvitationP = hasPaperRanking
      ? api.getInvitationById(paperRankingId, undefined, {
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
      .get('/edges', {
        invitation: customMaxPapersInvitationId,
        tail: user.profile.id,
        domain: group.domain,
      })
      .then((result) => {
        if (result.edges?.length) {
          return result.edges[0].weight
        }

        return api
          .get('/notes', {
            invitation: recruitmentInvitationId,
            domain: group.domain,
            sort: 'cdate:desc',
          })
          .then((noteResult) => {
            if (!noteResult.notes?.length) return reviewLoad
            return parseInt(noteResult.notes[0].content?.reduced_load?.value, 10)
          })
      })
    // #endregion

    // #region get reviewer edges
    const getReviewerEdgesP = edgeInvitationIds.length
      ? Promise.all(
          edgeInvitationIds.flatMap((invitationId) =>
            api
              .get('/edges', {
                invitation: invitationId,
                tail: user.profile.id,
                domain: group.domain,
              })
              .then((result) => {
                if (!result.edges?.length) return []
                const displayName = prettyInvitationId(invitationId)
                const displayValue = result.edges
                  .map((p) => {
                    if ('label' in p) return p.label
                    return p.weight
                  })
                  .join(', ')
                return [{ displayName, displayValue }]
              })
          )
        ).then((edgeResults) => edgeResults.flat())
      : Promise.resolve(null)
    // #endregion

    // #region get area chair groups
    const getAreaChairGroupsP = areaChairName
      ? Promise.all(
          noteNumbers.map((noteNumber) =>
            api.get('/groups', {
              parent: `${venueId}/${submissionName}${noteNumber}`,
              select: 'id,members',
              domain: group.domain,
            })
          )
        ).then((result) => {
          const singularAreaChairName = areaChairName.endsWith('s')
            ? areaChairName.slice(0, -1)
            : areaChairName
          const areaChairMap = {}
          const allACGroupResult = result.flatMap((p) => p.groups)
          allACGroupResult.forEach((areaChairgroup) => {
            if (areaChairgroup.id.endsWith(`/${areaChairName}`)) {
              const num = getNumberFromGroup(areaChairgroup.id, submissionName)
              areaChairMap[num] = areaChairgroup.members
            }
          })
          allACGroupResult.forEach((anonGroup) => {
            if (anonGroup.id.includes(`/${singularAreaChairName}_`)) {
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

    Promise.all([
      getNotesP,
      paperRankingInvitationP,
      getCustomLoadP,
      getAreaChairGroupsP,
      getReviewerEdgesP,
    ])
      .then(([notes, paperRankingInvitation, customLoad, areaChairMap, reviewerEdges]) => {
        const noteChunks = chunk(notes, 50)
        // get offical review invitations to show submit official review link
        const officalReviewInvitationPs = noteChunks.map((noteChunk) => {
          const officalReviewInvitationIds = noteChunk.map(
            (note) => `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
          )
          return api
            .get('/invitations', {
              ids: officalReviewInvitationIds,
              domain: group.domain,
            })
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
            reviewerEdges,
          ])
      })
      .then(
        ([
          notes,
          paperRankingInvitation,
          customLoad,
          areaChairMap,
          officialReviewInvitations,
          reviewerEdges,
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
              .get('/tags', { invitation: paperRankingId, domain: group.domain })
              .then((result) => (result.tags?.length > 0 ? result.tags : []))
          }
          paperRankingTagsP.then((paperRankingTags) => {
            setReviewerConsoleData({
              paperNumberAnonGroupIdMap: groupByNumber,
              notes,
              customLoad,
              reviewerEdges,
              officialReviews,
              paperRankingTags,
              areaChairMap,
              noteNumbers,
              officialReviewInvitations,
              paperRankingInvitation,
              tableRowsAll: notes.map((p) => ({ note: p })),
              tableRows: notes.map((p) => ({ note: p })),
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

    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else {
      setBannerContent({ type: 'venueHomepageLink', value: venueId })
    }
  }, [query, venueId])

  useEffect(() => {
    if (
      isRefreshing ||
      !user ||
      !group ||
      !submissionInvitationId ||
      !submissionName ||
      !venueId ||
      !reviewerName
    )
      return
    loadData()
  }, [user, isRefreshing, group])

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
    recruitmentInvitationId,
  }).filter(([_, value]) => value === undefined)
  if (missingConfig?.length) {
    const errorMessage = `${
      reviewerName ? `${prettyId(reviewerName)} ` : ''
    }Console is missing required properties: ${missingConfig.map((p) => p[0]).join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
  }
  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header.instructions}
        customLoad={reviewerConsoleData.customLoad}
        submissionName={submissionName}
        options={{
          extra: reviewerConsoleData.reviewerEdges?.length ? (
            <>
              {reviewerConsoleData.reviewerEdges.map(
                ({ displayName, displayValue }, index) => (
                  <p key={`${displayName}${index}`} className="dark">
                    {displayName}: <strong>{displayValue}</strong>
                  </p>
                )
              )}
            </>
          ) : undefined,
        }}
      />
      {reviewerConsoleData.notes ? (
        <ReviewerConsoleTabs
          reviewerConsoleData={reviewerConsoleData}
          setReviewerConsoleData={setReviewerConsoleData}
          paperRankingId={paperRankingId}
        />
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

export default ReviewerConsole
