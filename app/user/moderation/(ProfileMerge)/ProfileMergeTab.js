/* globals promptError,view2,$: false */
import { useEffect, useState } from 'react'
import Table from '../../../../components/Table'
import { formatDateTime, prettyId } from '../../../../lib/utils'
import Icon from '../../../../components/Icon'
import PaginationLinks from '../../../../components/PaginationLinks'
import RequestRejectionModal from '../RequestRejectionModal'
import FullTextModal from '../FullTextModal'
import Markdown from '../../../../components/EditorComponents/Markdown'
import api from '../../../../lib/api-client'
import LoadingSpinner from '../../../../components/LoadingSpinner'

const pageSize = 25
const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`
const profileMergeDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge_Decision`

const getStatusLabelClass = (note) => {
  switch (note.content.status.value) {
    case 'Accepted':
      return 'label label-success'
    case 'Rejected':
      return 'label label-danger'
    default:
      return 'label label-default'
  }
}

const getProcessLogStatusLabelClass = (note) => {
  switch (note.processLogStatus) {
    case 'ok':
      return 'label label-success'
    case 'error':
      return 'label label-danger'
    case 'running':
      return 'label label-default'
    default:
      return ''
  }
}

export default function ProfileMergeTab() {
  const [profileMergeNotes, setProfileMergeNotes] = useState(null)
  const [profileMergeNotesToShow, setProfileMergeNotesToShow] = useState(null)
  const [noteToReject, setNoteToReject] = useState(null)
  const [textToView, setTextToView] = useState(null)
  const [idsLoading, setIdsLoading] = useState([])
  const [lastComparedNote, setLastComparedNote] = useState(null)
  const [page, setPage] = useState(1)
  const fullTextModalId = 'merge-fulltext-modal'

  const updateRequestStatus = async (noteId) => {
    try {
      const profileMergeNotesP = api.get('/notes', { id: noteId })
      const decisionResultsP = api.getAll(
        '/notes/edits',
        { 'note.id': noteId },
        { resultsKey: 'edits' }
      )
      const [profileMergeNotesResults, decisionResults] = await Promise.all([
        profileMergeNotesP,
        decisionResultsP,
      ])
      setProfileMergeNotes((notes) => [
        ...notes.filter((p) => p.content.status.value === 'Pending' && p.id !== noteId),
        {
          ...profileMergeNotesResults.notes[0],
          processLogStatus: 'running',
          processLogUrl: `${process.env.API_V2_URL}/logs/process?id=${decisionResults[0].id}`,
        },
        ...notes.filter((p) => p.content.status.value !== 'Pending'),
      ])
    } catch (error) {
      promptError(error.message)
    }
  }

  const acceptRejectProfileMergeNote = async (profileMergeNote, response, supportComment) => {
    try {
      setIdsLoading((p) => [...p, profileMergeNote.id])
      const profileMergeDecisionInvitation = await api.getInvitationById(
        `${process.env.SUPER_USER}/Support/-/Profile_Merge_Decision`
      )
      const editToPost = view2.constructEdit({
        formData: {
          id: profileMergeNote.id,
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },
        invitationObj: profileMergeDecisionInvitation,
      })
      const result = await api.post('/notes/edits', editToPost)
      $('#name-delete-reject').modal('hide')
      updateRequestStatus(profileMergeNote.id)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== profileMergeNote.id))
    }
  }

  const loadProfileMergeRequests = async (noteId) => {
    try {
      let profileMergeNotesP
      let decisionResultsP
      let processLogsP

      if (noteId) {
        profileMergeNotesP = api.get('/notes', { id: noteId })
        decisionResultsP = api.getAll(
          '/notes/edits',
          { 'note.id': noteId },
          { resultsKey: 'edits' }
        )
        processLogsP = Promise.resolve(null)
      } else {
        profileMergeNotesP = api.get('/notes', {
          invitation: profileMergeInvitationId,
        })
        decisionResultsP = api.getAll(
          '/notes/edits',
          {
            invitation: profileMergeDecisionInvitationId,
          },
          { resultsKey: 'edits' }
        )
        processLogsP = api.getAll(
          '/logs/process',
          { invitation: profileMergeDecisionInvitationId },
          { resultsKey: 'logs' }
        )
      }

      const [profileMergeNotesResults, decisionResults, processLogs] = await Promise.all([
        profileMergeNotesP,
        decisionResultsP,
        processLogsP,
      ])

      const sortedResult = noteId
        ? [
            ...profileMergeNotes.filter(
              (p) => p.content.status.value === 'Pending' && p.id !== noteId
            ),
            {
              ...profileMergeNotesResults.notes[0],
              processLogStatus: 'running',
              processLogUrl: `${process.env.API_V2_URL}/logs/process?id=${decisionResults[0].id}`,
            },
            ...profileMergeNotes.filter((p) => p.content.status.value !== 'Pending'),
          ]
        : [
            ...profileMergeNotesResults.notes.filter(
              (p) => p.content.status.value === 'Pending'
            ),
            ...profileMergeNotesResults.notes.filter(
              (p) => p.content.status.value !== 'Pending'
            ),
          ].map((p) => {
            const decisionEdit = decisionResults.find((q) => q.note.id === p.id)
            let processLogStatus = 'N/A'
            if (p.content.status.value !== 'Pending')
              processLogStatus =
                processLogs.find((q) => q.id === decisionEdit.id)?.status ?? 'running'
            return {
              ...p,
              processLogStatus,
              processLogUrl: decisionEdit
                ? `${process.env.API_V2_URL}/logs/process?id=${decisionEdit.id}`
                : null,
            }
          })
      setProfileMergeNotes(sortedResult)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!profileMergeNotes) return
    setProfileMergeNotesToShow(profileMergeNotes.slice((page - 1) * pageSize, page * pageSize))
  }, [profileMergeNotes, page])

  useEffect(() => {
    if (noteToReject) $('#name-delete-reject').modal('show')
  }, [noteToReject])

  useEffect(() => {
    if (textToView) $(`#${fullTextModalId}`).modal('show')
  }, [textToView])

  useEffect(() => {
    loadProfileMergeRequests()
  }, [])

  if (!profileMergeNotesToShow) return <LoadingSpinner />

  return (
    <>
      <div className="profile-merge-list">
        <>
          <Table
            headings={[
              { content: 'Status', width: '12%' },
              { content: 'Signature/Email', width: '15%' },
              { content: 'Compare', width: '20%' },
              { content: 'Comment' },
            ]}
          />
          {profileMergeNotesToShow.map((note) => (
            <div className="profile-merge-row" key={note.id}>
              <span className="col-status">
                <span
                  className={getStatusLabelClass(note)}
                  onClick={() => {
                    if (note.content.support_comment.value) {
                      setTextToView(<Markdown text={note.content.support_comment.value} />)
                    }
                  }}
                >
                  {note.content.status.value}
                </span>
              </span>
              <span className="col-status">
                <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                  <span className={getProcessLogStatusLabelClass(note)}>
                    {note.processLogStatus}
                  </span>
                </a>
              </span>
              <span className="signature">
                {note.signatures[0] === '(guest)' ? (
                  <span
                    onClick={() => setTextToView(<Markdown text={note.content.email.value} />)}
                  >
                    {note.content.email.value}
                  </span>
                ) : (
                  <a
                    href={`/profile?id=${note.signatures[0]}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {prettyId(note.signatures[0])}
                  </a>
                )}
              </span>
              <span
                className={`compare${note.id === lastComparedNote ? ' last-previewed' : ''}`}
              >
                <a
                  href={`/profile/compare?left=${note.content.left.value}&right=${note.content.right.value}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setLastComparedNote(note.id)}
                >
                  {`${note.content.left.value},${note.content.right.value}`}
                </a>
              </span>
              <div className="comment">
                <span
                  onClick={() => setTextToView(<Markdown text={note.content.comment.value} />)}
                >
                  {note.content.comment.value}
                </span>
              </div>
              <span className="col-created">{formatDateTime(note.tcdate)}</span>
              <span className="col-actions">
                {note.content.status.value === 'Pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-xs"
                      disabled={idsLoading.includes(note.id)}
                      onClick={() => {
                        acceptRejectProfileMergeNote(note, 'Accepted')
                      }}
                    >
                      <Icon name="ok-circle" /> Done
                    </button>{' '}
                    <button
                      type="button"
                      className="btn btn-xs"
                      disabled={idsLoading.includes(note.id)}
                      onClick={() => {
                        setNoteToReject(note)
                      }}
                    >
                      <Icon name="remove-circle" /> Reject
                    </button>{' '}
                    <button
                      type="button"
                      className="btn btn-xs"
                      disabled={idsLoading.includes(note.id)}
                      onClick={() => {
                        acceptRejectProfileMergeNote(note, 'Ignored')
                      }}
                    >
                      Ignore
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
          {profileMergeNotes.length === 0 ? (
            <p className="empty-message">No profile merge requests.</p>
          ) : (
            <PaginationLinks
              currentPage={page}
              itemsPerPage={pageSize}
              totalCount={profileMergeNotes.length}
              options={{ useShallowRouting: true }}
              setCurrentPage={setPage}
            />
          )}
        </>
      </div>
      <RequestRejectionModal
        noteToReject={noteToReject}
        acceptRejectNote={acceptRejectProfileMergeNote}
        setNoteToReject={setNoteToReject}
      />
      <FullTextModal
        id={fullTextModalId}
        textToView={textToView}
        setTextToView={setTextToView}
      />
    </>
  )
}
