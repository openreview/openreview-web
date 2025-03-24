'use client'

/* globals promptMessage,promptError,view2,$: false */
import { use, useEffect, useState } from 'react'
import Table from '../../../../components/Table'
import { formatDateTime, prettyId } from '../../../../lib/utils'
import Icon from '../../../../components/Icon'
import PaginationLinks from '../../../../components/PaginationLinks'
import api from '../../../../lib/api-client'
import Markdown from '../../../../components/EditorComponents/Markdown'
import RequestRejectionModal from '../RequestRejectionModal'
import FullTextModal from '../FullTextModal'

const pageSize = 25

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

export default function NameDeletionList({
  nameDeletionNotesP,
  accessToken,
  nameDeletionDecisionInvitationId,
}) {
  const initialNameDeletionNotes = use(nameDeletionNotesP)
  const [nameDeletionNotes, setNameDeletionNotes] = useState(initialNameDeletionNotes)
  const [nameDeletionNotesToShow, setNameDeletionNotesToShow] = useState(
    nameDeletionNotes.slice(0, pageSize)
  )
  const [page, setPage] = useState(1)
  const [commentToView, setCommentToView] = useState(null)
  const [idsLoading, setIdsLoading] = useState([])
  const [noteToReject, setNoteToReject] = useState(null)
  const fullTextModalId = 'deletion-fulltext-modal'

  const updateRequestStatus = async (noteId) => {
    const nameRemovalNotesP = api.get('/notes', { id: noteId }, { accessToken })
    const decisionResultsP = api.getAll(
      '/notes/edits',
      { 'note.id': noteId, invitation: nameDeletionDecisionInvitationId },
      { accessToken, resultsKey: 'edits' }
    )
    const [nameRemovalNotes, decisionResults] = await Promise.all([
      nameRemovalNotesP,
      decisionResultsP,
    ])

    setNameDeletionNotes((notes) => [
      ...notes.filter((p) => p.content.status.value === 'Pending' && p.id !== noteId),
      {
        ...nameRemovalNotes.notes[0],
        processLogStatus: 'running',
        processLogUrl: `${process.env.API_V2_URL}/logs/process?id=${decisionResults[0].id}`,
      },
      ...notes.filter((p) => p.content.status.value !== 'Pending'),
    ])
  }

  const acceptRejectNameDeletionNote = async (nameDeletionNote, response, supportComment) => {
    try {
      setIdsLoading((p) => [...p, nameDeletionNote.id])
      const nameDeletionDecisionInvitation = await api.getInvitationById(
        nameDeletionDecisionInvitationId,
        accessToken
      )

      const editToPost = view2.constructEdit({
        formData: {
          id: nameDeletionNote.id,
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },

        invitationObj: nameDeletionDecisionInvitation,
      })
      const result = await api.post('/notes/edits', editToPost, { accessToken })
      $('#name-delete-reject').modal('hide')
      updateRequestStatus(nameDeletionNote.id)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== nameDeletionNote.id))
    }
  }

  useEffect(() => {
    setNameDeletionNotesToShow(nameDeletionNotes.slice((page - 1) * pageSize, page * pageSize))
  }, [nameDeletionNotes, page])

  useEffect(() => {
    if (commentToView) $(`#${fullTextModalId}`).modal('show')
  }, [commentToView])

  useEffect(() => {
    if (noteToReject) $('#name-delete-reject').modal('show')
  }, [noteToReject])

  return (
    <>
      <div className="name-deletion-list">
        <Table
          headings={[
            { content: 'Status', width: '12%' },
            { content: 'Requester', width: '15%' },
            { content: 'Name to delete', width: '15%' },
            { content: 'Reason', width: '20%' },
            { content: 'Date' },
          ]}
        />
        {nameDeletionNotesToShow.map((note) => (
          <div className="name-deletion-row" key={note.id}>
            <span className="col-status">
              <span className={getStatusLabelClass(note)}>{note.content.status.value}</span>
            </span>
            <span className="col-status">
              <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                <span className={getProcessLogStatusLabelClass(note)}>
                  {note.processLogStatus}
                </span>
              </a>
            </span>
            <span className="name">
              <a href={`/profile?id=${note.signatures[0]}`} target="_blank" rel="noreferrer">
                {prettyId(note.signatures[0])}
              </a>
            </span>
            <span
              className="usernames"
              onClick={() =>
                setCommentToView(
                  <ul>
                    {note.content.usernames.value.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )
              }
            >
              {note.content.usernames.value.join(',')}
            </span>
            <div className="comment">
              <span
                onClick={() =>
                  setCommentToView(<Markdown text={note.content.comment.value} />)
                }
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
                      acceptRejectNameDeletionNote(note, 'Accepted')
                    }}
                  >
                    <Icon name="ok-circle" /> Accept
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
                </>
              )}
            </span>
          </div>
        ))}
        {nameDeletionNotes.length === 0 ? (
          <p className="empty-message">No name deletion requests.</p>
        ) : (
          <PaginationLinks
            currentPage={page}
            itemsPerPage={pageSize}
            totalCount={nameDeletionNotes.length}
            options={{ useShallowRouting: true }}
            setCurrentPage={setPage}
          />
        )}
      </div>
      <RequestRejectionModal
        noteToReject={noteToReject}
        acceptRejectNote={acceptRejectNameDeletionNote}
        setNoteToReject={setNoteToReject}
      />
      <FullTextModal
        id={fullTextModalId}
        textToView={commentToView}
        setTextToView={setCommentToView}
      />
    </>
  )
}
