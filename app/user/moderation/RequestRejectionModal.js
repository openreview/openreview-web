import { useState } from 'react'
import BasicModal from '../../../components/BasicModal'

export default function RequestRejectionModal({
  noteToReject,
  acceptRejectNote,
  setNoteToReject,
}) {
  const [supportComment, setSupportComment] = useState('')
  if (!noteToReject) return null
  return (
    <BasicModal
      id="name-delete-reject"
      primaryButtonDisabled={!supportComment}
      onPrimaryButtonClick={() => {
        acceptRejectNote(noteToReject, 'Rejected', supportComment)
      }}
      onClose={() => {
        setNoteToReject(null)
        setSupportComment('')
      }}
    >
      <>
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="form-group form-rejection">
            <label htmlFor="message" className="mb-1">
              Reason for rejecting {noteToReject.content.name?.value}:
            </label>
            <textarea
              name="message"
              className="form-control mt-2"
              rows="5"
              value={supportComment}
              onChange={(e) => {
                setSupportComment(e.target.value)
              }}
            />
          </div>
        </form>
      </>
    </BasicModal>
  )
}
