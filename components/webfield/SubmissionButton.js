import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import NoteEditor from '../NoteEditor'
import NoteEditorForm from '../NoteEditorForm'
import api from '../../lib/api-client'
import { formatDateTime, prettyId, prettyInvitationId } from '../../lib/utils'

dayjs.extend(relativeTime)

export default function SubmissionButton({
  invitationId,
  onNoteCreated,
  apiVersion,
  options,
  accessToken,
}) {
  const [invitation, setInvitation] = useState(null)
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const newNoteEditor = invitation?.domain

  const invitationPastDue = invitation?.duedate && invitation.duedate < Date.now()
  const invitationDeleted = invitation?.ddate
  const invitationNotAvailable =
    (invitationPastDue || invitationDeleted) && !invitation?.details.writable

  const loadInvitation = async () => {
    try {
      const { invitations } = await api.get(
        '/invitations',
        { id: invitationId },
        { accessToken, version: apiVersion }
      )
      if (invitations?.length > 0) {
        setInvitation(invitations[0])
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Invitation ${invitationId} could not be loaded:`, error.message)
    }
  }

  const toggleSubmissionForm = () => {
    setNoteEditorOpen(!noteEditorOpen)
  }

  const getTitle = () => {
    if (invitationDeleted)
      return `${prettyInvitationId(invitationId)} invitation is deleted. ddate: ${formatDateTime(invitation.ddate)}`
    if (invitationPastDue)
      return `${prettyInvitationId(invitationId)} expired ${dayjs(invitation.expdate).fromNow()}`
    return ''
  }

  useEffect(() => {
    loadInvitation()
  }, [invitationId])

  if (!invitation || invitationNotAvailable) return null

  return (
    <>
      <div className="panel">
        {options.largeLabel ? (
          <strong className="item hint">Add:</strong>
        ) : (
          <span className="item hint">Add:</span>
        )}
        <button
          className={`btn ${invitationPastDue || invitationDeleted ? 'expired' : ''}`}
          onClick={toggleSubmissionForm}
          data-toggle="tooltip"
          data-placement="top"
          data-trigger="hover"
          title={getTitle()}
        >
          {prettyId(invitationId)}
        </button>
        {options.showStartEndDate && (
          <span className=" hint">
            {invitation.cdate ? ` Submission start: ${formatDateTime(invitation.tcdate)}` : ''}
            {invitation.duedate ? `, Deadline: ${formatDateTime(invitation.duedate)}` : ''}
          </span>
        )}
      </div>

      {noteEditorOpen &&
        (newNoteEditor ? (
          <NoteEditor
            invitation={invitation}
            closeNoteEditor={toggleSubmissionForm}
            onNoteCreated={(newNote) => {
              onNoteCreated(newNote)
            }}
            className="panel"
          />
        ) : (
          <NoteEditorForm
            invitation={invitation}
            onNoteCreated={(newNote) => {
              toggleSubmissionForm()
              onNoteCreated(newNote)
            }}
            onNoteCancelled={toggleSubmissionForm}
            onError={(isLoadingError) => {
              if (isLoadingError) {
                toggleSubmissionForm()
              }
            }}
          />
        ))}
    </>
  )
}
