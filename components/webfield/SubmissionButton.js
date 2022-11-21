import { useEffect, useState } from 'react'
import NoteEditorForm from '../NoteEditorForm'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

export default function SubmissionButton({
  invitationId,
  onNoteCreated,
  apiVersion,
  options,
}) {
  const [invitation, setInvitation] = useState(null)
  const [noteEditorOpen, setNoteEditorOpen] = useState(false)
  const { accessToken, userLoading } = useUser()

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
  }, [userLoading])

  if (!invitation) return null

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
  )
}
