/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import { ProgramChairConsolePaperAreaChairProgress } from '../NoteMetaReviewStatus'
import { AcPcConsoleNoteReviewStatus, LatestReplies } from '../NoteReviewStatus'
import NoteSummary from '../NoteSummary'
import PaperStatusMenuBar from './PaperStatusMenuBar'
import { prettyField } from '../../../lib/utils'
import useUser from '../../../hooks/useUser'
import SelectAllCheckBox from '../SelectAllCheckbox'

const PaperRow = ({
  rowData,
  selectedNoteIds,
  setSelectedNoteIds,
  decision,
  venue,
  getManualAssignmentUrl,
  noteContentField,
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
    displayReplyInvitations,
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
          preferredEmailInvitationId={preferredEmailInvitationId}
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
      {displayReplyInvitations?.length && (
        <td>
          <LatestReplies rowData={rowData} referrerUrl={referrerUrl} />
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

const PaperStatus = ({ pcConsoleData, loadReviewMetaReviewData, noteContentField }) => {
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
    displayReplyInvitations,
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.notes?.length ?? 0)
  const pageSize = 25

  const getManualAssignmentUrl = (role) => {
    if (!assignmentUrls) return null
    const assignmentUrl = assignmentUrls[role]?.manualAssignmentUrl // same for auto and manual
    // auto - deployed and not expired
    const isAssignmentConfigDeployed = pcConsoleData.invitations?.some(
      (p) =>
        p.id === `${venueId}/${role}/-/Assignment` && (!p.expdate || p.expdate > Date.now())
    )
    // manual - there's no undeploy
    const isMatchingSetup = pcConsoleData.invitations?.some(
      (p) => p.id === `${venueId}/${role}/-/Assignment`
    )

    if (
      (assignmentUrls[role]?.automaticAssignment === false && isMatchingSetup) ||
      (assignmentUrls[role]?.automaticAssignment === true && isAssignmentConfigDeployed)
    )
      return assignmentUrl
    return null
  }

  useEffect(() => {
    if (!pcConsoleData.notes) return
    if (!pcConsoleData.noteNumberReviewMetaReviewMap) {
      setTimeout(() => {
        loadReviewMetaReviewData()
      }, 500)
    } else {
      const { notes, noteNumberReviewMetaReviewMap } = pcConsoleData
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
  }, [pcConsoleData.notes, pcConsoleData.noteNumberReviewMetaReviewMap])

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
  }, [pageNumber, pcConsoleData.notes, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  if (!paperStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (paperStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No papers have been submitted.Check back later or{' '}
        <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
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
                selectedIds={selectedNoteIds}
                setSelectedIds={setSelectedNoteIds}
                allIds={paperStatusTabData.tableRows?.map((row) => row.note.id)}
              />
            ),
            width: '35px',
          },
          { id: 'number', content: '#', width: '55px' },
          {
            id: 'summary',
            content: `${submissionName} Summary`,
            width: displayReplyInvitations?.length ? '20%' : '30%',
          },
          {
            id: 'reviewProgress',
            content: `${prettyField(officialReviewName)} Progress`,
            width: displayReplyInvitations?.length ? '15%' : '30%',
          },
          ...(areaChairsId ? [{ id: 'status', content: 'Status' }] : []),
          ...(displayReplyInvitations?.length
            ? [
                {
                  id: 'latestReplies',
                  content: 'Latest Replies',
                  width: '45%',
                },
              ]
            : []),
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

export default PaperStatus
