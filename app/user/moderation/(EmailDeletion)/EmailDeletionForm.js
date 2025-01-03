'use client'

/* globals promptMessage,promptError,view2: false */
import { useRef } from 'react'
import api from '../../../../lib/api-client'

export default function EmailDeletionForm({
  emailRemovalInvitationId,
  accessToken,
  setEmailDeletionNotes,
}) {
  const emailDeletionFormRef = useRef(null)

  const handleEmailDeletionRequest = async (e) => {
    e.preventDefault()

    const formData = new FormData(emailDeletionFormRef.current)
    const formContent = {}
    formData.forEach((value, name) => {
      const cleanValue = value.trim()
      formContent[name] = cleanValue?.length ? cleanValue : undefined
    })
    try {
      const emailRemovalInvitation = await api.getInvitationById(
        emailRemovalInvitationId,
        accessToken
      )

      const editToPost = view2.constructEdit({
        formData: formContent,
        invitationObj: emailRemovalInvitation,
      })

      const editResult = await api.post('/notes/edits', editToPost, {
        accessToken,
        version: 2,
      })
      const noteResult = await api.getNoteById(editResult.note.id, accessToken)

      setEmailDeletionNotes((emailDeletionNotes) => [
        { ...noteResult, processLogStatus: 'running' },
        ...emailDeletionNotes,
      ])
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <form
      className="well mt-3"
      ref={emailDeletionFormRef}
      onSubmit={handleEmailDeletionRequest}
    >
      <input
        type="text"
        name="email"
        className="form-control input-sm"
        placeholder="Email to delete"
      />
      <input
        type="text"
        name="profile_id"
        className="form-control input-sm"
        placeholder="Profile ID the email is associated with"
      />
      <input
        type="text"
        name="comment"
        className="form-control input-sm comment"
        placeholder="Moderator comment"
      />

      <button type="submit" className="btn btn-xs">
        Submit
      </button>
    </form>
  )
}
