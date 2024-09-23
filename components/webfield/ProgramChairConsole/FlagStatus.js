/* globals promptError: false */
/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import groupBy from 'lodash/groupBy'
import useUser from '../../../hooks/useUser'
import useQuery from '../../../hooks/useQuery'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../Tabs'
import { referrerLink, venueHomepageLink } from '../../../lib/banner-links'
import api from '../../../lib/api-client'
import WebFieldContext from '../../WebFieldContext'
import BasicHeader from '../BasicHeader'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
  prettyField,
  parseNumberField,
  isValidEmail,
  getSingularRoleName,
  pluralizeString,
  getRoleHashFragment,
} from '../../../lib/utils'
import { formatProfileContent } from '../../../lib/edge-utils'

import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import { ProgramChairConsolePaperAreaChairProgress } from '../NoteMetaReviewStatus'
import { AcPcConsoleNoteReviewStatus } from '../NoteReviewStatus'
import NoteSummary from '../NoteSummary'
import PaperStatusMenuBar from './PaperStatusMenuBar'

// #region copiedPaperStatus
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

const PaperRow = ({
  rowData,
  selectedNoteIds,
  setSelectedNoteIds,
  decision,
  venue,
  getManualAssignmentUrl,
  noteContentField,
  accessToken,
}) => {
  const {
    reviewerName,
    areaChairName,
    areaChairsId,
    venueId,
    officialReviewName,
    shortPhrase,
    submissionName,
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    preferredEmailInvitationId,
  } = useContext(WebFieldContext)
  const { note, metaReviewData, ithenticateEdge } = rowData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#${submissionName.toLowerCase()}-status)`
  )

  // Find note(s) that responds to the flag
  const responseNotes =
    noteContentField &&
    note.details?.replies?.filter((reply) =>
      reply.invitations.some((replyInvitation) =>
        noteContentField.responseInvitations?.some((reasonInvitation) =>
          replyInvitation.endsWith(reasonInvitation)
        )
      )
    )

  // Find note(s) that justify the flag, display using non meta-invitation invitation
  const reasonNotes =
    noteContentField &&
    note.details?.replies?.filter((reply) => {
      if (!reply?.invitations || !reply?.content) return false
      return (
        reply.invitations.some((replyInvitation) =>
          noteContentField.reasonInvitations?.some((reasonInvitation) =>
            replyInvitation.endsWith(reasonInvitation)
          )
        ) &&
        Object.keys(reply.content).some((replyField) =>
          noteContentField.reasonFields?.[replyField]?.includes(
            reply.content[replyField].value
          )
        )
      )
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
        <NoteSummary
          note={note}
          referrerUrl={referrerUrl}
          showReaders={true}
          isV2Note={true}
          ithenticateEdge={ithenticateEdge}
          accessToken={accessToken}
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
          reviewerAssignmentUrl={getManualAssignmentUrl(reviewerName)}
        />
      </td>
      {!noteContentField && areaChairsId && (
        <td>
          <ProgramChairConsolePaperAreaChairProgress
            rowData={rowData}
            referrerUrl={referrerUrl}
            areaChairAssignmentUrl={getManualAssignmentUrl(areaChairName)}
            metaReviewRecommendationName={metaReviewRecommendationName}
            additionalMetaReviewFields={additionalMetaReviewFields}
            preferredEmailInvitationId={preferredEmailInvitationId}
          />
        </td>
      )}
      {noteContentField && (
        <td>
          <ProgramChairConsolePaperAreaChairProgress
            rowData={rowData}
            referrerUrl={referrerUrl}
            areaChairAssignmentUrl={getManualAssignmentUrl(areaChairName)}
            metaReviewRecommendationName={metaReviewRecommendationName}
            additionalMetaReviewFields={additionalMetaReviewFields}
            preferredEmailInvitationId={preferredEmailInvitationId}
          />
        </td>
      )}
      {noteContentField ? (
        <td className="console-decision">
          <h4 className="title">
            {prettyField(rowData.note?.content[noteContentField.field].value.toString()) ??
              'N/A'}
          </h4>
          {reasonNotes.length > 0 && (
            <div>
              <Table
                className="console-table table-striped"
                headings={[
                  { id: 'invitation', content: 'Type', width: '30%' },
                  { id: 'summary', content: 'Summary', width: '70%' },
                ]}
              >
                {reasonNotes?.map((reasonNote) => (
                  <tr key={reasonNote.id}>
                    <td>
                      <a
                        href={`/forum?id=${rowData.note?.forum}&noteId=${reasonNote.id}&referrer=${referrerUrl}`}
                        target="_blank"
                      >
                        <strong>
                          {prettyField(
                            reasonNote.invitations
                              .find((invitation) => !invitation.endsWith('/Edit'))
                              .split('/')
                              .pop()
                          )}
                        </strong>
                      </a>
                    </td>
                    <td>
                      <NoteSummary
                        note={reasonNote}
                        referrerUrl={referrerUrl}
                        showReaders={false}
                        isV2Note={true}
                      />
                    </td>
                  </tr>
                ))}
              </Table>
              <hr />
            </div>
          )}
          {responseNotes.length > 0 && (
            <div>
              <Table
                className="console-table table-striped"
                headings={[
                  { id: 'invitation', content: 'Type', width: '30%' },
                  { id: 'summary', content: 'Summary', width: '70%' },
                ]}
              >
                {responseNotes?.map((responseNote) => (
                  <tr key={responseNote.id}>
                    <td>
                      <a
                        href={`/forum?id=${rowData.note?.forum}&noteId=${responseNote.id}&referrer=${referrerUrl}`}
                        target="_blank"
                      >
                        <strong>
                          {prettyField(
                            responseNote.invitations
                              .find((invitation) => !invitation.endsWith('/Edit'))
                              .split('/')
                              .pop()
                          )}
                        </strong>
                      </a>
                    </td>
                    <td>
                      <NoteSummary
                        note={responseNote}
                        referrerUrl={referrerUrl}
                        showReaders={false}
                        isV2Note={true}
                      />
                    </td>
                  </tr>
                ))}
              </Table>
              <hr />
            </div>
          )}
        </td>
      ) : (
        <td className="console-decision">
          <h4 className="title">{decision}</h4>
          {venue && <span>{venue}</span>}
        </td>
      )}
    </tr>
  )
}

const PaperStatus = ({ statusData, loadReviewMetaReviewData, noteContentField }) => {
  const [paperStatusTabData, setPaperStatusTabData] = useState({})
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const {
    venueId,
    areaChairsId,
    assignmentUrls,
    reviewRatingName,
    areaChairName = 'Area_Chairs',
    officialReviewName,
    officialMetaReviewName = 'Meta_Review',
    submissionName,
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(statusData?.notes?.length ?? 0)
  const { accessToken } = useUser()
  const pageSize = 25

  const getManualAssignmentUrl = (role) => {
    if (!assignmentUrls) return null
    const assignmentUrl = assignmentUrls[role]?.manualAssignmentUrl // same for auto and manual
    // auto
    const isAssignmentConfigDeployed = statusData.invitations?.some(
      (p) => p.id === `${venueId}/${role}/-/Assignment`
    )
    // manual
    const isMatchingSetup = isAssignmentConfigDeployed

    if (
      (assignmentUrls[role]?.automaticAssignment === false && isMatchingSetup) ||
      (assignmentUrls[role]?.automaticAssignment === true && isAssignmentConfigDeployed)
    )
      return assignmentUrl
    return null
  }

  useEffect(() => {
    if (!statusData.notes) return
    if (!statusData.noteNumberReviewMetaReviewMap) {
      setTimeout(() => {
        loadReviewMetaReviewData()
      }, 500)
    } else {
      const { notes, noteNumberReviewMetaReviewMap } = statusData
      if (!notes) return
      const actualNotes = noteContentField
        ? notes.filter((note) => note.content[noteContentField.field])
        : notes
      const actualNoteNumbers = actualNotes.map((note) => note.number)
      const actualNoteNumberReviewMetaReviewMap = noteContentField
        ? new Map(
            [...noteNumberReviewMetaReviewMap].filter(([noteNumber, dataMap]) =>
              actualNoteNumbers.includes(noteNumber)
            )
          )
        : noteNumberReviewMetaReviewMap

      const tableRows = Array.from(actualNoteNumberReviewMetaReviewMap.values())
      setPaperStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows], // could be filtered
      })

      setTotalCount(actualNotes?.length ?? 0)
    }
  }, [statusData.notes, statusData.noteNumberReviewMetaReviewMap])

  useEffect(() => {
    setPaperStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        // could be filtered and paginated
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    $('[data-toggle="tooltip"]').tooltip('enable')
  }, [pageNumber, statusData.notes, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  if (!paperStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (paperStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No papers have been submitted.Check back later or contact info@openreview.net if you
        believe this to be an error.
      </p>
    )
  if (paperStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <PaperStatusMenuBar
          tableRowsAll={paperStatusTabData.tableRowsAll}
          tableRows={paperStatusTabData.tableRows}
          selectedNoteIds={selectedNoteIds}
          setSelectedNoteIds={setSelectedNoteIds}
          setPaperStatusTabData={setPaperStatusTabData}
          reviewRatingName={reviewRatingName}
        />
        <p className="empty-message">No papers matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <PaperStatusMenuBar
        tableRowsAll={paperStatusTabData.tableRowsAll}
        tableRows={paperStatusTabData.tableRows}
        selectedNoteIds={selectedNoteIds}
        setSelectedNoteIds={setSelectedNoteIds}
        setPaperStatusTabData={setPaperStatusTabData}
        reviewRatingName={reviewRatingName}
        noteContentField={noteContentField}
      />
      <Table
        className="console-table table-striped pc-console-paper-status"
        headings={[
          {
            id: 'select-all',
            content: (
              <SelectAllCheckBox
                selectedNoteIds={selectedNoteIds}
                setSelectedNoteIds={setSelectedNoteIds}
                allNoteIds={paperStatusTabData.tableRows?.map((row) => row.note.id)}
              />
            ),
            width: '35px',
          },
          { id: 'number', content: '#', width: '55px' },
          { id: 'summary', content: `${submissionName} Summary`, width: '30%' },
          {
            id: 'reviewProgress',
            content: `${prettyField(officialReviewName)} Progress`,
            width: '30%',
          },
          ...(areaChairsId ? [{ id: 'status', content: 'Status' }] : []),
          {
            id: noteContentField?.field ?? 'decision',
            content: noteContentField ? prettyField(noteContentField.field) : 'Decision',
            width: noteContentField ? '30%' : undefined,
          },
        ]}
      >
        {paperStatusTabData.tableRowsDisplayed?.map((row) => (
          <PaperRow
            key={row.note.id}
            rowData={row}
            selectedNoteIds={selectedNoteIds}
            setSelectedNoteIds={setSelectedNoteIds}
            decision={row.decision}
            venue={row.venue}
            getManualAssignmentUrl={getManualAssignmentUrl}
            noteContentField={noteContentField}
            accessToken={accessToken}
          />
        ))}
      </Table>
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true, showCount: true }}
      />
    </div>
  )
}
// #endregion

const FlagStatus = () => {
  const {
    header,
    entity: group,
    venueId,
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    bidName,
    recommendationName, // to get ac recommendation edges
    metaReviewRecommendationName = 'recommendation', // recommendation field in meta review
    additionalMetaReviewFields = [],
    requestFormId,
    submissionId,
    submissionVenueId,
    withdrawnVenueId,
    deskRejectedVenueId,
    officialReviewName,
    commentName,
    officialMetaReviewName = 'Meta_Review',
    decisionName = 'Decision',
    anonReviewerName,
    anonAreaChairName,
    reviewerName = 'Reviewers',
    areaChairName = 'Area_Chairs',
    seniorAreaChairName = 'Senior_Area_Chairs',
    secondaryAreaChairName,
    secondaryAnonAreaChairName,
    scoresName,
    shortPhrase,
    enableQuerySearch,
    reviewRatingName,
    reviewConfidenceName,
    submissionName,
    recruitmentName,
    paperStatusExportColumns,
    areaChairStatusExportColumns,
    customStageInvitations,
    assignmentUrls,
    emailReplyTo,
    reviewerEmailFuncs,
    acEmailFuncs,
    sacEmailFuncs,
    submissionContentFields = [],
    sacDirectPaperAssignment,
    propertiesAllowed,
    sacStatuspropertiesAllowed,
    messageAreaChairsInvitationId,
    messageSeniorAreaChairsInvitationId,
    preferredEmailInvitationId,
    ithenticateInvitationId,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const [activeTabId, setActiveTabId] = useState(
    window.location.hash || '#venue-configuration'
  )
  const [flagStatusData, setFlagStatusData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)

  const loadData = async () => {
    if (isLoadingData) return

    setIsLoadingData(true)
    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${venueId}/-/.*`,
          expired: true,
          type: 'all',
          domain: venueId,
        },
        { accessToken }
      )
      const reviewerInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${reviewersId}/-/.*`,
          expired: true,
          type: 'all',
          domain: venueId,
        },
        { accessToken }
      )
      const acInvitationsP = areaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${areaChairsId}/-/.*`,
              expired: true,
              type: 'all',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${seniorAreaChairsId}/-/.*`,
              expired: true,
              type: 'all',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])

      const customStageInvitationsP = customStageInvitations
        ? api.getAll(
            '/invitations',
            {
              ids: customStageInvitations.map((p) => `${venueId}/-/${p.name}`),
              type: 'note',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])

      const invitationResultsP = Promise.all([
        conferenceInvitationsP,
        reviewerInvitationsP,
        acInvitationsP,
        sacInvitationsP,
        customStageInvitationsP,
      ])

      // #endregion

      // #region getSubmissions
      const notesP = api.getAll(
        '/notes',
        {
          invitation: submissionId,
          details: 'replies',
          select: 'id,number,forum,content,details,invitations,readers',
          sort: 'number:asc',
          domain: venueId,
        },
        { accessToken }
      )
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get(
        '/groups',
        {
          prefix: `${venueId}/${submissionName}.*`,
          stream: true,
          select: 'id,members',
          domain: venueId,
        },
        { accessToken }
      )
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
      const results = await Promise.all([
        invitationResultsP,
        notesP,
        perPaperGroupResultsP,
        ithenticateEdgesP,
      ])
      const invitationResults = results[0]
      const ithenticateEdges = results[3]
      const notes = results[1].flatMap((note) => {
        if ([withdrawnVenueId, deskRejectedVenueId].includes(note.content?.venueid?.value))
          return []
        return {
          ...note,
          ...(ithenticateInvitationId && {
            ithenticateWeight:
              ithenticateEdges.find((p) => p.head === note.id)?.weight ?? 'N/A',
          }),
        }
      })
      const perPaperGroupResults = results[2]

      // #region categorize result of per paper groups
      const reviewerGroups = []
      const anonReviewerGroups = {}
      const areaChairGroups = []
      const anonAreaChairGroups = {}
      const secondaryAreaChairGroups = []
      const secondaryAnonAreaChairGroups = {}
      const seniorAreaChairGroups = []
      let allGroupMembers = []
      perPaperGroupResults.groups?.forEach((p) => {
        const number = getNumberFromGroup(p.id, submissionName)
        const noteVenueId = notes.find((q) => q.number === number)?.content?.venueid?.value
        if (
          !noteVenueId ||
          noteVenueId === withdrawnVenueId ||
          noteVenueId === deskRejectedVenueId
        )
          return
        if (p.id.endsWith(`/${reviewerName}`)) {
          reviewerGroups.push({
            noteNumber: number,
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
            if (!(member in anonReviewerGroups[number]) && member.includes(anonReviewerName)) {
              anonReviewerGroups[number][member] = member
            }
          })
        } else if (p.id.includes(`/${anonReviewerName}`)) {
          if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
          if (p.members.length) anonReviewerGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(`/${areaChairName}`)) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
            if (
              !(member in anonAreaChairGroups[number]) &&
              member.includes(`/${anonAreaChairName}`)
            ) {
              anonAreaChairGroups[number][member] = member
            }
          })
        } else if (p.id.includes(`/${anonAreaChairName}`)) {
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (p.members.length) anonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(seniorAreaChairName)) {
          seniorAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (secondaryAreaChairName && p.id.endsWith(`/${secondaryAreaChairName}`)) {
          secondaryAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in secondaryAnonAreaChairGroups))
              secondaryAnonAreaChairGroups[number] = {}
            if (
              !(member in secondaryAnonAreaChairGroups[number]) &&
              member.includes(`/${secondaryAnonAreaChairName}`)
            ) {
              secondaryAnonAreaChairGroups[number][member] = member
            }
          })
        } else if (secondaryAreaChairName && p.id.includes(`/${secondaryAnonAreaChairName}`)) {
          if (!(number in secondaryAnonAreaChairGroups))
            secondaryAnonAreaChairGroups[number] = {}
          if (p.members.length) secondaryAnonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        }
      })
      // #endregion

      // #region get all profiles(with assignments)
      const allIds = [...new Set(allGroupMembers)]
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
      const allProfiles = (profileResults[0].profiles ?? [])
        .concat(profileResults[1].profiles ?? [])
        .map((profile) => ({
          ...profile,
          preferredName: getProfileName(profile),
          title: formatProfileContent(profile.content).title,
        }))
      // #endregion

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        usernames.concat(profile.email ?? []).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })

      const officialReviewsByPaperNumberMap = new Map()
      const metaReviewsByPaperNumberMap = new Map()
      const decisionByPaperNumberMap = new Map()
      const customStageReviewsByPaperNumberMap = new Map()
      notes.forEach((note) => {
        const replies = note.details.replies ?? []
        const officialReviews = replies
          .filter((p) => {
            const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officialReviewInvitationId)
          })
          .map((review) => {
            let anonymousGroupId
            if (review.signatures[0].startsWith('~')) {
              const idToAnonIdMap = Object.keys(anonReviewerGroups[note.number] ?? {}).reduce(
                (prev, curr) => ({ ...prev, [anonReviewerGroups[note.number][curr]]: curr }),
                {}
              )

              Object.entries(idToAnonIdMap).forEach(
                ([anonReviewerId, anonReviewerGroupId]) => {
                  const profile = allProfilesMap.get(anonReviewerId)
                  if (!profile) return
                  const usernames = profile.content.names.flatMap((p) => p.username ?? [])
                  usernames.concat(profile.email ?? []).forEach((key) => {
                    idToAnonIdMap[key] = anonReviewerGroupId
                  })
                }
              )
              anonymousGroupId = idToAnonIdMap?.[review.signatures[0]] ?? ''
            } else {
              anonymousGroupId = review.signatures[0]
            }

            return {
              ...review,
              anonId: getIndentifierFromGroup(anonymousGroupId, anonReviewerName),
            }
          })
        const metaReviews = replies
          .filter((p) => {
            const officialMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
            return p.invitations.includes(officialMetaReviewInvitationId)
          })
          .map((metaReview) => ({
            ...metaReview,
            anonId: getIndentifierFromGroup(metaReview.signatures[0], anonAreaChairName),
          }))

        const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`
        const decision = replies.find((p) => p.invitations.includes(decisionInvitationId))
        const customStageInvitationIds = customStageInvitations
          ? customStageInvitations.map((p) => `/-/${p.name}`)
          : []
        const customStageReviews = replies.filter((p) =>
          p.invitations.some((q) => customStageInvitationIds.some((r) => q.includes(r)))
        )
        officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        decisionByPaperNumberMap.set(note.number, decision)
        customStageReviewsByPaperNumberMap.set(note.number, customStageReviews)
      })

      setFlagStatusData({
        invitations: invitationResults.flat(),
        allProfilesMap,
        notes,
        officialReviewsByPaperNumberMap,
        metaReviewsByPaperNumberMap,
        decisionByPaperNumberMap,
        customStageReviewsByPaperNumberMap,

        paperGroups: {
          anonReviewerGroups,
          reviewerGroups: reviewerGroups.map((reviewerGroup) => {
            const paperAnonReviewerGroups = anonReviewerGroups[reviewerGroup.noteNumber] || {}
            return {
              ...reviewerGroup,
              members: reviewerGroup.members.flatMap((member) => {
                let deanonymizedGroup = paperAnonReviewerGroups[member]
                let anonymizedGroup = member
                if (!deanonymizedGroup) {
                  deanonymizedGroup = member
                  anonymizedGroup = Object.keys(paperAnonReviewerGroups).find(
                    (key) => paperAnonReviewerGroups[key] === member
                  )
                }
                if (!anonymizedGroup) return []
                return {
                  reviewerProfileId: deanonymizedGroup,
                  anonymizedGroup,
                  anonymousId: getIndentifierFromGroup(anonymizedGroup, anonReviewerName),
                }
              }),
            }
          }),
          anonAreaChairGroups,
          areaChairGroups: areaChairGroups.map((areaChairGroup) => {
            const paperAnonAreaChairGroups = anonAreaChairGroups[areaChairGroup.noteNumber]
            return {
              ...areaChairGroup,
              members: areaChairGroup.members.flatMap((member) => {
                let deanonymizedGroup = paperAnonAreaChairGroups?.[member]
                let anonymizedGroup = member
                if (!deanonymizedGroup) {
                  deanonymizedGroup = member
                  anonymizedGroup = Object.keys(paperAnonAreaChairGroups).find(
                    (key) => paperAnonAreaChairGroups[key] === member
                  )
                }
                if (!(isValidEmail(deanonymizedGroup) || deanonymizedGroup?.startsWith('~')))
                  return []
                return {
                  areaChairProfileId: deanonymizedGroup,
                  anonymizedGroup,
                  anonymousId: anonymizedGroup
                    ? getIndentifierFromGroup(anonymizedGroup, anonAreaChairName)
                    : null,
                }
              }),
              secondaries: areaChairGroup.members.flatMap((member) => {
                if (!secondaryAreaChairName || !member.endsWith(`/${secondaryAreaChairName}`))
                  return []

                const acGroupNoteNumber = areaChairGroup.noteNumber
                const secondaryAreaChairGroup = secondaryAreaChairGroups.find(
                  (p) => p.noteNumber === acGroupNoteNumber
                )
                if (!secondaryAreaChairGroup) return []

                return secondaryAreaChairGroup.members.map((secondaryMember) => ({
                  areaChairProfileId:
                    secondaryAnonAreaChairGroups[acGroupNoteNumber]?.[secondaryMember] ??
                    secondaryMember,
                  anonymizedGroup: secondaryMember,
                  anonymousId: getIndentifierFromGroup(
                    secondaryMember,
                    secondaryAnonAreaChairName
                  ),
                }))
              }),
            }
          }),
          seniorAreaChairGroups,
        },
        ithenticateEdges,
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
  }

  // eslint-disable-next-line consistent-return
  const calculateNotesReviewMetaReviewData = () => {
    if (!flagStatusData) return new Map()
    const noteNumberReviewMetaReviewMap = new Map()
    flagStatusData.notes.forEach((note) => {
      const assignedReviewers =
        flagStatusData.paperGroups.reviewerGroups?.find((p) => p.noteNumber === note.number)
          ?.members ?? []

      const assignedReviewerProfiles = assignedReviewers.map((reviewer) => ({
        id: reviewer.reviewerProfileId,
        profile: flagStatusData.allProfilesMap.get(reviewer.reviewerProfileId),
      }))

      const assignedAreaChairs =
        flagStatusData.paperGroups.areaChairGroups?.find((p) => p.noteNumber === note.number)
          ?.members ?? []

      const assignedAreaChairProfiles = assignedAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: flagStatusData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const secondaryAreaChairs =
        flagStatusData.paperGroups.areaChairGroups?.find((p) => p.noteNumber === note.number)
          ?.secondaries ?? []

      const secondaryAreaChairProfiles = secondaryAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: flagStatusData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const assignedSeniorAreaChairs =
        flagStatusData.paperGroups.seniorAreaChairGroups?.find(
          (p) => p.noteNumber === note.number
        )?.members ?? []

      const assignedSeniorAreaChairProfiles = assignedSeniorAreaChairs.map(
        (seniorAreaChairProfileId) => ({
          id: seniorAreaChairProfileId,
          profile: flagStatusData.allProfilesMap.get(seniorAreaChairProfileId),
        })
      )

      const officialReviews =
        flagStatusData.officialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const reviewValue = q.content.review?.value
          return {
            anonymousId: q.anonId,
            confidence: parseNumberField(q.content[reviewConfidenceName]?.value),
            ...Object.fromEntries(
              (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                (ratingName) => {
                  const displayRatingName =
                    typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                  const ratingValue =
                    typeof ratingName === 'object'
                      ? Object.values(ratingName)[0]
                          .map((r) => q.content[r]?.value)
                          .find((s) => s !== undefined)
                      : q.content[ratingName]?.value
                  return [[displayRatingName], parseNumberField(ratingValue)]
                }
              )
            ),
            reviewLength: reviewValue?.length,
            forum: q.forum,
            id: q.id,
          }
        }) ?? []
      const ratings = Object.fromEntries(
        (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
          (ratingName) => {
            const ratingDisplayName =
              typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
            const ratingValues = officialReviews.map((p) => p[ratingDisplayName])

            const validRatingValues = ratingValues.filter((p) => p !== null)
            const ratingAvg = validRatingValues.length
              ? (
                  validRatingValues.reduce((sum, curr) => sum + curr, 0) /
                  validRatingValues.length
                ).toFixed(2)
              : 'N/A'
            const ratingMin = validRatingValues.length ? Math.min(...validRatingValues) : 'N/A'
            const ratingMax = validRatingValues.length ? Math.max(...validRatingValues) : 'N/A'
            return [ratingDisplayName, { ratingAvg, ratingMin, ratingMax }]
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

      const customStageReviews =
        flagStatusData.customStageReviewsByPaperNumberMap?.get(note.number) ?? []

      const metaReviews = (
        flagStatusData.metaReviewsByPaperNumberMap?.get(note.number) ?? []
      ).map((metaReview) => {
        const metaReviewAgreement = customStageReviews.find(
          (p) => p.replyto === metaReview.id || p.forum === metaReview.forum
        )
        const metaReviewAgreementConfig = metaReviewAgreement
          ? customStageInvitations.find((p) =>
              metaReviewAgreement.invitations.some((q) => q.includes(`/-/${p.name}`))
            )
          : null
        const metaReviewAgreementValue =
          metaReviewAgreement?.content?.[metaReviewAgreementConfig?.displayField]?.value
        return {
          [metaReviewRecommendationName]:
            metaReview?.content[metaReviewRecommendationName]?.value,
          ...additionalMetaReviewFields?.reduce((prev, curr) => {
            const additionalMetaReviewFieldValue = metaReview?.content[curr]?.value
            return {
              ...prev,
              [curr]: {
                value: additionalMetaReviewFieldValue,
                searchValue: additionalMetaReviewFieldValue ?? 'N/A',
              },
            }
          }, {}),
          ...metaReview,
          metaReviewAgreement: metaReviewAgreement
            ? {
                searchValue: metaReviewAgreementValue,
                name: prettyId(metaReviewAgreementConfig.name),
                value: metaReviewAgreementValue,
                id: metaReviewAgreement.id,
                forum: metaReviewAgreement.forum,
              }
            : { searchValue: 'N/A' },
        }
      })

      let decision = 'No Decision'
      const decisionNote = flagStatusData.decisionByPaperNumberMap.get(note.number)
      if (decisionNote?.content?.decision) decision = decisionNote.content.decision?.value

      noteNumberReviewMetaReviewMap.set(note.number, {
        note,
        reviewers: assignedReviewers?.map((reviewer) => {
          const profile = assignedReviewerProfiles.find(
            (p) => p.id === reviewer.reviewerProfileId
          )?.profile
          return {
            ...reviewer,
            type: 'profile',
            profile,
            hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
            noteNumber: note.number,
            preferredId: reviewer.reviewerProfileId,
            preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
          }
        }),
        authors: note.content.authorids?.value?.map((authorId, index) => {
          const preferredName = note.content.authors?.value?.[index]
          return {
            preferredId: authorId,
            preferredName,
            noteNumber: note.number,
            anonymizedGroup: authorId,
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
          replyCount: note.details.replies?.length ?? 0,
        },
        metaReviewData: {
          numAreaChairsAssigned: assignedAreaChairs.length,
          areaChairs: assignedAreaChairs.map((areaChair) => {
            const profile = assignedAreaChairProfiles.find(
              (p) => p.id === areaChair.areaChairProfileId
            )?.profile
            return {
              ...areaChair,
              noteNumber: note.number,
              preferredId: profile ? profile.id : areaChair.areaChairProfileId,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              title: profile?.title,
            }
          }),
          secondaryAreaChairs: secondaryAreaChairs.map((areaChair) => {
            const profile = secondaryAreaChairProfiles.find(
              (p) => p.id === areaChair.areaChairProfileId
            )?.profile
            return {
              ...areaChair,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              title: profile?.title,
            }
          }),
          seniorAreaChairs: assignedSeniorAreaChairs.map((seniorAreaChairProfileId) => {
            const profile = assignedSeniorAreaChairProfiles.find(
              (p) => p.id === seniorAreaChairProfileId
            )?.profile
            return {
              type: 'profile',
              preferredId: seniorAreaChairProfileId,
              preferredName: profile ? getProfileName(profile) : seniorAreaChairProfileId,
              title: profile?.title,
            }
          }),
          numMetaReviewsDone: metaReviews.length,
          metaReviews,
          metaReviewsSearchValue: metaReviews?.length
            ? metaReviews.map((p) => p[metaReviewRecommendationName]).join(' ')
            : 'N/A',
          metaReviewAgreementSearchValue: metaReviews
            .map((p) => p.metaReviewAgreement.searchValue)
            .join(' '),
          ...additionalMetaReviewFields?.reduce((prev, curr) => {
            const additionalMetaReviewValues = metaReviews.map((p) => p[curr]?.searchValue)
            return {
              ...prev,
              [`${curr}SearchValue`]: additionalMetaReviewValues.join(' '),
            }
          }, {}),
        },

        decision,
        venue: note?.content?.venue?.value,
        messageSignature: programChairsId,
        ithenticateEdge: flagStatusData.ithenticateEdges.find((p) => p.head === note.id),
      })
    })

    // add profileRegistrationNote
    flagStatusData.allProfilesMap.forEach((profile, id) => {
      const usernames = profile.content.names.flatMap((p) => p.username ?? [])

      let userRegNotes = []
      usernames.forEach((username) => {
        if (flagStatusData.registrationNoteMap && flagStatusData.registrationNoteMap[username]) {
          userRegNotes = userRegNotes.concat(flagStatusData.registrationNoteMap[username])
        }
      })
      // eslint-disable-next-line no-param-reassign
      profile.registrationNotes = userRegNotes
    })

    setFlagStatusData((data) => ({ ...data, noteNumberReviewMetaReviewMap }))
  }

  /*
  1) Copy PaperStatus components into here
  2) Render PaperStatus components
  3) Find out what data is not needed and prune pcConsoleData
  4) Revert original PaperStatus component changes
  */

  useEffect(() => {
    if (userLoading || !user || !venueId || !reviewersId || !submissionId) return
    loadData()
  }, [user, userLoading])

  return (
    <>
      {submissionContentFields.length > 0 &&
        submissionContentFields.map((fieldAttrs) => (
          <PaperStatus
            id={fieldAttrs.field}
            key={fieldAttrs.field}
            statusData={flagStatusData}
            loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
            noteContentField={fieldAttrs}
          />
        ))}
    </>
  )
}

export default FlagStatus
