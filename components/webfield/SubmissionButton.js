import { useEffect, useState } from 'react'
import NoteEditorForm from '../NoteEditorForm'
import useUser from '../../hooks/useUser'
import useNewNoteEditor from '../../hooks/useNewNoteEditor'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import NoteEditor from '../NoteEditor'

export default function SubmissionButton({
  invitationId,
  onNoteCreated,
  apiVersion,
  options,
}) {
  const [invitation, setInvitation] = useState(null)
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const { accessToken, userLoading } = useUser()
  const { newNoteEditor } = useNewNoteEditor(invitation)

  const invitationPastDue =
    invitation?.duedate && invitation.duedate < Date.now() && !invitation?.details.writable

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

  if (!invitation || invitationPastDue) return null

  return (
    <>
      <div className="panel">
        {options.largeLabel ? (
          <strong className="item hint">Add:</strong>
        ) : (
          <span className="item hint">Add:</span>
        )}
        <button className="btn" onClick={toggleSubmissionForm}>
          {prettyId(invitationId)}
        </button>
      </div>

      {noteEditorOpen && (
        <>
          {newNoteEditor ? (
            <NoteEditor
              invitation={invitation}
              closeNoteEditor={toggleSubmissionForm}
              onNoteCreated={(newNote) => {
                onNoteCreated(newNote)
              }}
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
          )}
        </>
      )}
    </>
  )
}
