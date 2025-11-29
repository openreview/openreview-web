/* globals $,promptMessage,promptError,typesetMathJax: false */

import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { chunk, orderBy } from 'lodash'
import Link from 'next/link'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import Table from '../Table'
import ErrorDisplay from '../ErrorDisplay'
import NoteSummary from './NoteSummary'
import { AcPcConsoleNoteReviewStatus, LatestReplies } from './NoteReviewStatus'
import { AreaChairConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import {
  getNumberFromGroup,
  getIndentifierFromGroup,
  prettyId,
  prettyList,
  inflect,
  parseNumberField,
  prettyField,
  pluralizeString,
  getSingularRoleName,
  getRoleHashFragment,
} from '../../lib/utils'
import AreaChairConsoleMenuBar from './AreaChairConsoleMenuBar'
import LoadingSpinner from '../LoadingSpinner'
import ConsoleTaskList from './ConsoleTaskList'
import { getProfileLink } from '../../lib/webfield-utils'
import { formatProfileContent } from '../../lib/edge-utils'
import ConsoleTabs from './ConsoleTabs'
import SelectAllCheckBox from './SelectAllCheckbox'

const AssignedPaperRow = ({
  rowData,
  venueId,
  areaChairName,
  officialReviewName,
  submissionName,
  metaReviewRecommendationName,
  selectedNoteIds,
  setSelectedNoteIds,
  shortPhrase,
  showCheckbox = true,
  additionalMetaReviewFields,
  activeTabId,
  displayReplyInvitations,
}) => {
  const { note, metaReviewData, ithenticateEdge } = rowData
  const referrerUrl = encodeURIComponent(
    `[${prettyField(
      areaChairName
    )} Console](/group?id=${venueId}/${areaChairName}${activeTabId})`
  )
  return (
    <tr>
      {showCheckbox && (
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
      )}
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary
          note={note}
          referrerUrl={referrerUrl}
          isV2Note={true}
          ithenticateEdge={ithenticateEdge}
        />
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
      {displayReplyInvitations?.length && (
        <td>
          <LatestReplies rowData={rowData} referrerUrl={referrerUrl} />
        </td>
      )}
      <td>
        <AreaChairConsoleNoteMetaReviewStatus
          note={note}
          metaReviewData={metaReviewData}
          metaReviewRecommendationName={metaReviewRecommendationName}
          referrerUrl={referrerUrl}
          additionalMetaReviewFields={additionalMetaReviewFields}
        />
      </td>
    </tr>
  )
}

const AreaChairConsoleTasks = ({
  venueId,
  areaChairName,
  defaultAreaChairName = areaChairName,
}) => {
  const areaChairUrlFormat = areaChairName ? getRoleHashFragment(areaChairName) : null
  const referrer = encodeURIComponent(
    `[${prettyField(
      defaultAreaChairName
    )} Console](/group?id=${venueId}/${defaultAreaChairName}#${areaChairUrlFormat}-tasks)`
  )

  return (
    <ConsoleTaskList
      venueId={venueId}
      roleName={areaChairName}
      filterAssignedInvitation={true}
      referrer={referrer}
    />
  )
}

const AreaChairConsoleTabs = ({ acConsoleData, setAcConsoleData }) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const {
    venueId,
    areaChairName,
    secondaryAreaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    officialMetaReviewName,
    reviewerName = 'Reviewers',
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    shortPhrase,
    filterOperators,
    propertiesAllowed,
    enableQuerySearch,
    extraExportColumns,
    ithenticateInvitationId,
    extraRoleNames,
    sortOptions,
    displayReplyInvitations,
  } = useContext(WebFieldContext)
  const defaultActiveTabId = `assigned-${pluralizeString(submissionName).toLowerCase()}`
  const [activeTabId, setActiveTabId] = useState(defaultActiveTabId)

  const areaChairUrlFormat = areaChairName ? getRoleHashFragment(areaChairName) : null
  const extraRoleNamesWithUrlFormat = extraRoleNames?.map((roleName) => ({
    name: roleName,
    urlFormat: getRoleHashFragment(roleName),
  }))
  const secondaryAreaChairUrlFormat = secondaryAreaChairName
    ? getRoleHashFragment(secondaryAreaChairName)
    : null

  const renderTable = () => {
    if (!acConsoleData.tableRowsAll) return <LoadingSpinner />
    if (acConsoleData.tableRowsAll?.length === 0)
      return (
        <p className="empty-message">
          No assigned {submissionName.toLowerCase()}. Check back later or{' '}
          <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
        </p>
      )
    if (acConsoleData.tableRows?.length === 0)
      return (
        <div className="table-container empty-table-container">
          <AreaChairConsoleMenuBar
            tableRowsAll={acConsoleData.tableRowsAll}
            tableRows={acConsoleData.tableRows}
            selectedNoteIds={selectedNoteIds}
            setSelectedNoteIds={setSelectedNoteIds}
            setAcConsoleData={setAcConsoleData}
            shortPhrase={shortPhrase}
            enableQuerySearch={enableQuerySearch}
            extraExportColumns={extraExportColumns}
            filterOperators={filterOperators}
            propertiesAllowed={propertiesAllowed}
            reviewRatingName={reviewRatingName}
            metaReviewRecommendationName={metaReviewRecommendationName}
            additionalMetaReviewFields={additionalMetaReviewFields}
            reviewerName={reviewerName}
            officialReviewName={officialReviewName}
            submissionName={submissionName}
            officialMetaReviewName={officialMetaReviewName}
            areaChairName={areaChairName}
            ithenticateInvitationId={ithenticateInvitationId}
            sortOptions={sortOptions}
          />
          <p className="empty-message">
            No assigned {submissionName.toLowerCase()} matching search criteria.
          </p>
        </div>
      )
    return (
      <div className="table-container">
        <AreaChairConsoleMenuBar
          tableRowsAll={acConsoleData.tableRowsAll}
          tableRows={acConsoleData.tableRows}
          selectedNoteIds={selectedNoteIds}
          setSelectedNoteIds={setSelectedNoteIds}
          setAcConsoleData={setAcConsoleData}
          shortPhrase={shortPhrase}
          enableQuerySearch={enableQuerySearch}
          extraExportColumns={extraExportColumns}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
          reviewRatingName={reviewRatingName}
          metaReviewRecommendationName={metaReviewRecommendationName}
          additionalMetaReviewFields={additionalMetaReviewFields}
          reviewerName={reviewerName}
          officialReviewName={officialReviewName}
          submissionName={submissionName}
          officialMetaReviewName={officialMetaReviewName}
          areaChairName={areaChairName}
          ithenticateInvitationId={ithenticateInvitationId}
          sortOptions={sortOptions}
        />
        <Table
          className="console-table table-striped areachair-console-table"
          headings={[
            {
              id: 'select-all',
              content: (
                <SelectAllCheckBox
                  selectedIds={selectedNoteIds}
                  setSelectedIds={setSelectedNoteIds}
                  allIds={acConsoleData.tableRows?.map((row) => row.note.id)}
                />
              ),
              width: '35px',
            },
            { id: 'number', content: '#', width: '55px' },
            { id: 'summary', content: `${submissionName} Summary`, width: '34%' },
            {
              id: 'reviewProgress',
              content: `${prettyField(officialReviewName)} Progress`,
              width: '34%',
            },
            ...(displayReplyInvitations?.length
              ? [
                  {
                    id: 'latestReplies',
                    content: 'Latest Replies',
                    width: '50%',
                  },
                ]
              : []),
            {
              id: 'metaReviewStatus',
              content: `${prettyField(officialMetaReviewName)} Status`,
              width: 'auto',
            },
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
              metaReviewRecommendationName={metaReviewRecommendationName}
              selectedNoteIds={selectedNoteIds}
              setSelectedNoteIds={setSelectedNoteIds}
              shortPhrase={shortPhrase}
              additionalMetaReviewFields={additionalMetaReviewFields}
              activeTabId={activeTabId}
              displayReplyInvitations={displayReplyInvitations}
            />
          ))}
        </Table>
      </div>
    )
  }

  const renderTripletACTable = () => {
    if (!acConsoleData.tripletACtableRows) return <LoadingSpinner />
    if (acConsoleData.tripletACtableRows?.length === 0)
      return (
        <p className="empty-message">
          No assigned {submissionName.toLowerCase()}.Check back later or{' '}
          <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
        </p>
      )
    return (
      <div className="table-container">
        <Table
          className="console-table table-striped areachair-console-table"
          headings={[
            { id: 'number', content: '#', width: '55px' },
            { id: 'summary', content: `${submissionName} Summary`, width: '34%' },
            {
              id: 'reviewProgress',
              content: `${prettyField(officialReviewName)} Progress`,
              width: '34%',
            },
            ...(displayReplyInvitations?.length
              ? [
                  {
                    id: 'latestReplies',
                    content: 'Latest Replies',
                    width: '50%',
                  },
                ]
              : []),
            {
              id: 'metaReviewStatus',
              content: `${prettyField(officialMetaReviewName)} Status`,
              width: 'auto',
            },
          ]}
        >
          {acConsoleData.tripletACtableRows?.map((row) => (
            <AssignedPaperRow
              key={row.note.id}
              rowData={row}
              venueId={venueId}
              areaChairName={areaChairName}
              officialReviewName={officialReviewName}
              officialMetaReviewName={officialMetaReviewName}
              submissionName={submissionName}
              metaReviewRecommendationName={metaReviewRecommendationName}
              shortPhrase={shortPhrase}
              showCheckbox={false}
              additionalMetaReviewFields={additionalMetaReviewFields}
              activeTabId={activeTabId}
              displayReplyInvitations={displayReplyInvitations}
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
          id: `assigned-${pluralizeString(submissionName ?? '').toLowerCase()}`,
          label: `Assigned ${pluralizeString(submissionName)}`,
          content: renderTable(),
          visible: true,
        },
        {
          id: `${secondaryAreaChairUrlFormat}-assignments`,
          label: `${getSingularRoleName(prettyField(secondaryAreaChairName))} Assignments`,
          content: renderTripletACTable(),
          visible: secondaryAreaChairName,
        },
        {
          id: `${areaChairUrlFormat}-tasks`,
          label: `${getSingularRoleName(prettyField(areaChairName))} Tasks`,
          content: <AreaChairConsoleTasks venueId={venueId} areaChairName={areaChairName} />,
          visible: true,
        },
        ...(extraRoleNamesWithUrlFormat?.length > 0
          ? extraRoleNamesWithUrlFormat.map((role) => ({
              id: `${role.urlFormat}-tasks`,
              label: `${getSingularRoleName(prettyField(role.name))} Tasks`,
              content: (
                <AreaChairConsoleTasks
                  venueId={venueId}
                  areaChairName={role.name}
                  defaultAreaChairName={areaChairName}
                />
              ),
              visible: true,
            }))
          : []),
      ]}
      updateActiveTabId={setActiveTabId}
    />
  )
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
    secondaryAreaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    reviewerName = 'Reviewers',
    anonReviewerName = 'Reviewer_',
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    shortPhrase,
    filterOperators,
    propertiesAllowed,
    enableQuerySearch,
    emailReplyTo,
    extraExportColumns,
    preferredEmailInvitationId,
    ithenticateInvitationId,
    extraRoleNames,
    sortOptions,
    displayReplyInvitations,
  } = useContext(WebFieldContext)
  const {
    showEdgeBrowserUrl,
    proposedAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
  } = reviewerAssignment ?? {}
  const { user, accessToken, isRefreshing } = useUser()
  const query = useSearchParams()
  const { setBannerContent } = appContext ?? {}
  const [acConsoleData, setAcConsoleData] = useState({})
  const [sacLinkText, setSacLinkText] = useState('')

  const edgeBrowserUrl = proposedAssignmentTitle
    ? edgeBrowserProposedUrl
    : edgeBrowserDeployedUrl
  const headerInstructions = showEdgeBrowserUrl
    ? `${header?.instructions}<p><strong>${getSingularRoleName(
        prettyField(reviewerName)
      )} Assignment Browser: </strong><a id="edge_browser_url" href="${edgeBrowserUrl}" target="_blank" rel="nofollow">Modify ${getSingularRoleName(
        prettyField(reviewerName)
      )} Assignments</a></p>`
    : header?.instructions

  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? name.fullname : prettyId(reviewerProfile.id)
  }

  const getSACLinkText = async () => {
    if (!acConsoleData.sacProfiles?.length) return
    const sacName = prettyField(seniorAreaChairsId?.split('/')?.pop())
    const singluarSACName = sacName.endsWith('s') ? sacName.slice(0, -1) : sacName
    const sacText = `Your assigned ${inflect(
      acConsoleData.sacProfiles.length,
      `${singluarSACName} is`,
      `${singluarSACName}s are`
    )}`

    let sacEmails = []
    if (preferredEmailInvitationId) {
      try {
        const sacEmailPs = acConsoleData.sacProfiles.map((sacProfile) =>
          api
            .get(
              '/edges',
              { invitation: preferredEmailInvitationId, head: sacProfile.id },
              { accessToken }
            )
            .then((result) => result.edges[0]?.tail)
        )
        sacEmails = await Promise.all(sacEmailPs)
      } catch (error) {
        /* empty */
      }
    }
    const sacProfileLinks = acConsoleData.sacProfiles.map(
      (sacProfile, index) =>
        `<a href="${getProfileLink(sacProfile.id)}" >${prettyId(sacProfile.id)}</a>${
          sacEmails[index] ? `(${sacEmails[index]})` : ''
        }`
    )
    setSacLinkText(
      `<p class="dark">${sacText} ${prettyList(
        sacProfileLinks,
        'long',
        'conjunction',
        false
      )}</p>`
    )
  }

  const loadData = async () => {
    try {
      const allGroups = await api.getAll(
        '/groups',
        {
          member: user.id,
          prefix: `${venueId}/${submissionName}.*`,
          select: 'id',
          stream: true,
          domain: group.domain,
        },
        { accessToken }
      )
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith(`/${areaChairName}`))
      const secondaryAreaChairGroups = secondaryAreaChairName
        ? allGroups.filter((p) => p.id.endsWith(`/${secondaryAreaChairName}`))
        : []

      const singularName = areaChairName.endsWith('s')
        ? areaChairName.slice(0, -1)
        : areaChairName
      const anonymousAreaChairGroups = allGroups.filter((p) =>
        p.id.includes(`/${singularName}_`)
      )
      const anonymousAreaChairIdByNumber = {}
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/${submissionName}${num}/${singularName}_`)
        )
        if (anonymousAreaChairGroup) {
          anonymousAreaChairIdByNumber[num] = anonymousAreaChairGroup.id
          return num
        }
        return []
      })
      const secondaryAreaChairPaperNums = secondaryAreaChairGroups.map((p) =>
        getNumberFromGroup(p.id, submissionName)
      )

      const noteNumbers = [
        ...new Set(areaChairPaperNums),
        ...new Set(secondaryAreaChairPaperNums),
      ]
      const blindedNotesP = noteNumbers.length
        ? api.getAll(
            '/notes',
            {
              invitation: submissionInvitationId,
              number: noteNumbers.join(','),
              select: 'id,number,forum,content,details',
              details: 'replies',
              sort: 'number:asc',
              domain: group.domain,
            },
            { accessToken }
          )
        : Promise.resolve([])

      // #region getReviewerGroups(noteNumbers)
      const reviewerGroupsP = chunk([...new Set(areaChairPaperNums)], 25)
        .reduce(
          (prev, curr) =>
            prev.then((acc) =>
              Promise.all(
                curr.map((paperNumber) =>
                  api.get(
                    '/groups',
                    {
                      parent: `${venueId}/${submissionName}${paperNumber}`,
                      select: 'id,members',
                      domain: group.domain,
                    },
                    { accessToken }
                  )
                )
              ).then((res) => acc.concat(res))
            ),
          Promise.resolve([])
        )
        .then((result) => {
          const reviewerGroupsResult = result.flatMap((p) => p.groups)
          const anonymousReviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes(`/${anonReviewerName}`)
          )
          const reviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes(`/${reviewerName}`)
          )
          return noteNumbers.map((p) => {
            const reviewers = reviewerGroups
              .find((q) => getNumberFromGroup(q.id, submissionName) === p)
              ?.members.flatMap((r) => {
                const anonymousReviewerGroup = anonymousReviewerGroups.find(
                  (t) =>
                    t.id.startsWith(`${venueId}/${submissionName}${p}/${anonReviewerName}`) &&
                    (t.id === r || t.members[0] === r)
                )
                return {
                  anonymizedGroup: anonymousReviewerGroup?.id ?? r,
                  anonymousId: getIndentifierFromGroup(
                    anonymousReviewerGroup?.id || r,
                    anonReviewerName
                  ),
                  reviewerProfileId: anonymousReviewerGroup?.members.length
                    ? anonymousReviewerGroup.members[0]
                    : r,
                }
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
              {
                invitation: `${seniorAreaChairsId}/-/Assignment`,
                head: user.profile.id,
                domain: group.domain,
              },
              { accessToken }
            )
            .then((result) => result?.edges?.map((edge) => edge.tail) ?? [])
        : Promise.resolve([])
      // #endregion

      // #region get ithenticate edges
      const ithenticateEdgesP = ithenticateInvitationId
        ? api
            .getAll(
              '/edges',
              {
                invitation: ithenticateInvitationId,
                groupBy: 'id',
              },
              { accessToken, resultsKey: 'groupedEdges' }
            )
            .then((result) => result.map((p) => p.values[0]))
        : Promise.resolve([])
      // #endregion
      const result = await Promise.all([
        blindedNotesP,
        reviewerGroupsP,
        assignedSACsP,
        ithenticateEdgesP,
      ])

      // #region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers ?? []).map((p) => p.reviewerProfileId),
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
      const ithenticateEdges = result[3]
      const allProfiles = (profileResults[0].profiles ?? [])
        .concat(profileResults[1].profiles ?? [])
        .map((profile) => ({
          ...profile,
          title: formatProfileContent(profile.content).title,
        }))
      const tableRows = notes.map((note) => {
        const assignedReviewers =
          result[1].find((p) => p.number === note.number)?.reviewers ?? []
        const assignedReviewerProfiles = assignedReviewers.map((reviewer) =>
          allProfiles.find(
            (p) =>
              p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
              p.email === reviewer.reviewerProfileId
          )
        )
        const officialReviews = note.details.replies
          .filter((p) => {
            const officalReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officalReviewInvitationId)
          })
          ?.map((q) => {
            const anonymousId = getIndentifierFromGroup(q.signatures[0], anonReviewerName)
            const reviewValue = q.content?.review?.value
            return {
              ...q,
              anonymousId,
              confidence: parseNumberField(q.content?.[reviewConfidenceName]?.value),
              ...Object.fromEntries(
                (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                  (ratingName) => {
                    const ratingDisplayName =
                      typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                    const ratingValue =
                      typeof ratingName === 'object'
                        ? Object.values(ratingName)[0]
                            .map((r) => q.content?.[r]?.value)
                            .find((s) => s !== undefined)
                        : q.content?.[ratingName]?.value
                    return [[ratingDisplayName], parseNumberField(ratingValue)]
                  }
                )
              ),
              reviewLength: reviewValue?.length,
            }
          })

        const ratings = Object.fromEntries(
          (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
            (ratingName) => {
              const displayRatingName =
                typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
              const ratingValues = officialReviews.map((p) => p[displayRatingName])
              const validRatingValues = ratingValues.filter((p) => p !== null)
              const ratingAvg = validRatingValues.length
                ? (
                    validRatingValues.reduce((sum, curr) => sum + curr, 0) /
                    validRatingValues.length
                  ).toFixed(2)
                : 'N/A'
              const ratingMin = validRatingValues.length
                ? Math.min(...validRatingValues)
                : 'N/A'
              const ratingMax = validRatingValues.length
                ? Math.max(...validRatingValues)
                : 'N/A'
              return [displayRatingName, { ratingAvg, ratingMin, ratingMax }]
            }
          )
        )

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
        const allMetaReviews = note.details.replies.flatMap((p) => {
          if (!p.invitations.includes(metaReviewInvitationId)) return []
          return {
            ...p,
            anonId: getIndentifierFromGroup(p.signatures[0], `${singularName}_`),
            isByOtherAC: p.signatures[0] !== anonymousAreaChairIdByNumber[note.number],
          }
        })
        const metaReview = allMetaReviews.find((p) => !p.isByOtherAC)
        if (typeof note.content?.authors?.value === 'object') {
          // eslint-disable-next-line no-param-reassign
          note.authorSearchValue = note.content.authors.value.map((p) => ({
            ...p,
            type: 'authorObj',
          }))
        }
        return {
          note,
          reviewers: result[1]
            .find((p) => p.number === note.number)
            ?.reviewers?.map((reviewer) => {
              const profile = allProfiles.find(
                (p) =>
                  p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
                  p.email === reviewer.reviewerProfileId
              )
              return {
                ...reviewer,
                type: 'profile',
                profile,
                hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
                noteNumber: note.number,
                preferredId: reviewer.reviewerProfileId,
                preferredName: profile ? getReviewerName(profile) : reviewer.reviewerProfileId,
              }
            }),
          reviewerProfiles: assignedReviewerProfiles,
          officialReviews,
          reviewProgressData: {
            reviewers: assignedReviewerProfiles,
            numReviewersAssigned: assignedReviewers.length,
            numReviewsDone: officialReviews.length,
            ratings,
            confidenceAvg,
            confidenceMax,
            confidenceMin,
            replyCount: note.details.replies.length,
          },
          metaReviewData: {
            [metaReviewRecommendationName]:
              metaReview?.content?.[metaReviewRecommendationName]?.value ?? 'N/A',
            ...additionalMetaReviewFields.reduce((prev, curr) => {
              const additionalMetaReviewFieldValue =
                metaReview?.content?.[curr]?.value ?? 'N/A'
              return { ...prev, [curr]: additionalMetaReviewFieldValue }
            }, {}),
            metaReviewInvitationId: `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`,
            metaReview,
            metaReviewByOtherACs: allMetaReviews.flatMap((p) => {
              if (p.isByOtherAC)
                return {
                  [metaReviewRecommendationName]:
                    p.content?.[metaReviewRecommendationName]?.value ?? 'N/A',
                  ...additionalMetaReviewFields.reduce((prev, curr) => {
                    const additionalMetaReviewFieldValue = p.content?.[curr]?.value ?? 'N/A'
                    return { ...prev, [curr]: additionalMetaReviewFieldValue }
                  }, {}),
                  anonId: p.anonId,
                  id: p.id,
                }
              return []
            }),
          },
          messageSignature: anonymousAreaChairIdByNumber[note.number],
          ...(ithenticateInvitationId && {
            ithenticateEdge: ithenticateEdges.find((p) => p.head === note.id),
            ithenticateWeight:
              ithenticateEdges.find((p) => p.head === note.id)?.weight ?? 'N/A',
          }),
          displayReplies: displayReplyInvitations?.map((p) => {
            const displayInvitaitonId = p.id.replaceAll('{number}', note.number)
            const latestReply = orderBy(
              note.details.replies.filter((q) => q.invitations.includes(displayInvitaitonId)),
              ['mdate'],
              'desc'
            )?.[0]
            return {
              id: latestReply?.id,
              date: latestReply?.mdate,
              invitationId: displayInvitaitonId,
              values: p.fields.map((field) => {
                const value = latestReply?.content?.[field]?.value?.toString()
                return {
                  field,
                  value,
                }
              }),
              signature: latestReply?.signatures?.[0],
            }
          }),
        }
      })

      const sacProfiles = allProfiles.filter(
        (p) =>
          p.content.names.some((q) => result[2].includes(q.username)) ||
          result[2].includes(p.email)
      )

      const assignedPaperRows = tableRows.filter((p) =>
        areaChairPaperNums.includes(p.note.number)
      )
      const tripletACPaperRows = tableRows.filter((p) =>
        secondaryAreaChairPaperNums.includes(p.note.number)
      )

      // #endregion
      setAcConsoleData({
        tableRowsAll: assignedPaperRows,
        tableRows: assignedPaperRows,
        tripletACtableRows: tripletACPaperRows,
        reviewersInfo: result[1],
        allProfiles,
        sacProfiles: sacProfiles.map((sacProfile) => ({
          id: sacProfile.id,
        })),
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
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
      !venueId ||
      !submissionName ||
      !officialReviewName ||
      !submissionInvitationId
    )
      return
    loadData()
  }, [user, isRefreshing, group])

  useEffect(() => {
    if (acConsoleData.notes) {
      typesetMathJax()
    }
  }, [acConsoleData.notes])

  useEffect(() => {
    getSACLinkText()
  }, [acConsoleData.sacProfiles])

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
    shortPhrase,
    enableQuerySearch,
    reviewerName,
    anonReviewerName,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `${
      areaChairName ? `${prettyField(areaChairName)} ` : ''
    }Console is missing required properties: ${missingConfig.join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={`${headerInstructions}${sacLinkText}`}
      />
      <AreaChairConsoleTabs
        acConsoleData={acConsoleData}
        setAcConsoleData={setAcConsoleData}
      />
    </>
  )
}

export default AreaChairConsole
