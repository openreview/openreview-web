import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import NoteEditor from '../NoteEditor'
import NoteEditorForm from '../NoteEditorForm'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId, prettyInvitationId } from '../../lib/utils'

dayjs.extend(relativeTime)

export default function SubmissionButton({
  invitationId,
  onNoteCreated,
  apiVersion,
  options,
}) {
  const [invitation, setInvitation] = useState(null)
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const { accessToken, userLoading } = useUser()
  const newNoteEditor = invitation?.domain

  const invitationPastDue = invitation?.duedate && invitation.duedate < Date.now()
  const invitationNotAvailable = invitationPastDue && !invitation?.details.writable

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

  useEffect(() => {
    if (userLoading) return

    loadInvitation()
  }, [userLoading, invitationId])

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
          className={`btn ${invitationPastDue ? 'expired' : ''}`}
          onClick={toggleSubmissionForm}
          data-toggle="tooltip"
          data-placement="top"
          data-trigger="hover"
          title={
            invitationPastDue
              ? `${prettyInvitationId(invitationId)} expired ${dayjs(invitation.expdate).fromNow()}`
              : ''
          }
        >
          {prettyId(invitationId)}
        </button>
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
