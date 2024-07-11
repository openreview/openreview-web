/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import { ProgramChairConsolePaperAreaChairProgress } from '../NoteMetaReviewStatus'
import { AcPcConsoleNoteReviewStatus } from '../NoteReviewStatus'
import NoteSummary from '../NoteSummary'
import PaperStatusMenuBar from './PaperStatusMenuBar'
import { prettyField } from '../../../lib/utils'
import useUser from '../../../hooks/useUser'

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
  } = useContext(WebFieldContext)
  const { note, metaReviewData, ithenticateEdge } = rowData
  const referrerUrl = encodeURIComponent(
    `[Program Chair Console](/group?id=${venueId}/Program_Chairs#paper-status)`
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
          />
        </td>
      )}
      {noteContentField && (
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
      )}
      {!noteContentField && (
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
  } = useContext(WebFieldContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.notes?.length ?? 0)
  const { accessToken } = useUser()
  const pageSize = 25

  const getManualAssignmentUrl = (role) => {
    if (!assignmentUrls) return null
    const assignmentUrl = assignmentUrls[role]?.manualAssignmentUrl // same for auto and manual
    // auto
    const isAssignmentConfigDeployed = pcConsoleData.invitations?.some(
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

export default PaperStatus
