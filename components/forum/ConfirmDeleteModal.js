/* globals promptError: false, view2 */

import { useState } from 'react'
import BasicModal from '../BasicModal'
import { NewReplyEditNoteReaders } from '../NoteEditorReaders'
import Signatures from '../Signatures'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

export default function ConfirmDeleteModal({
  note,
  invitation,
  accessToken,
  updateNote,
  onClose,
}) {
  const readersFieldName = 'editReaders'
  const signaturesFieldName = 'editSignatures'
  const noteTitle = note?.content?.title?.value ?? note?.generatedTitle ?? 'Untitled'
  const isDeleted = note && note.ddate && note.ddate < Date.now()
  const actionText = isDeleted ? 'Restore' : 'Delete'

  const [noteEditorData, setNoteEditorData] = useState({
    [readersFieldName]: { value: note.readers },
  })
  const [errors, setErrors] = useState([])

  const postUpdatedNote = () => {
    const ddate = isDeleted ? { delete: true } : Date.now()
    const editSignatureValues = noteEditorData[signaturesFieldName]?.value
    const editReaderValues = noteEditorData[readersFieldName]?.value
    if (!editSignatureValues || !editReaderValues?.length) {
      return
    }

    const editToPost = view2.constructEdit({
      formData: { editSignatureInputValues: editSignatureValues, editReaderValues },
      noteObj: { ...note, ddate },
      invitationObj: invitation,
    })
    api
      .post('/notes/edits', editToPost, { accessToken, version: 2 })
      .then(() =>
        // the return of the post is an edit not the full note, so get the updated note again
        api.get('/notes', { id: note.id, trash: !isDeleted }, { accessToken, version: 2 })
      )
      .then((result) => {
        if (result.notes?.length > 0) {
          updateNote({ ...result.notes[0], details: note.details })
          if (typeof onClose === 'function') onClose()
        }
      })
      .catch((error) => {
        promptError(error.message)
        if (typeof onClose === 'function') onClose()
      })
  }

  if (!note) return null

  return (
    <BasicModal
      id="confirm-delete-modal"
      title={note ? `${actionText} Note` : null}
      primaryButtonText={actionText}
      primaryButtonDisabled={
        !noteEditorData[readersFieldName]?.value || !noteEditorData[signaturesFieldName]?.value
      }
      onPrimaryButtonClick={postUpdatedNote}
      onClose={() => {
        if (typeof onClose === 'function') onClose()
      }}
    >
      <p className="mb-4">
        Are you sure you want to {actionText.toLowerCase()} the note &quot;{noteTitle}
        &quot; by {prettyId(note.signatures[0])}? The {actionText.toLowerCase()}d note will be
        updated with the signature you choose below.
      </p>

      <NewReplyEditNoteReaders
        replyToNote={note}
        fieldDescription={invitation.edit.readers}
        closeNoteEditor={() => {}}
        value={noteEditorData[readersFieldName]}
        onChange={(value) => {
          if (value) {
            setNoteEditorData({ ...noteEditorData, [readersFieldName]: { value } })
          } else {
            setNoteEditorData({ ...noteEditorData, [readersFieldName]: undefined })
          }
        }}
        setLoading={() => {}}
        placeholder="Select edit readers"
        error={errors.find((e) => e.fieldName === readersFieldName)}
        onError={(errorMessage) => {
          setErrors((existingErrors) => [
            ...existingErrors,
            { fieldName: readersFieldName, message: errorMessage },
          ])
        }}
        clearError={() =>
          setErrors((existingErrors) =>
            existingErrors.filter((p) => p.fieldName !== readersFieldName)
          )
        }
        className="note-editor mb-2"
      />

      <EditorComponentHeader
        fieldNameOverwrite="Signatures"
        inline={true}
        error={errors.find((e) => e.fieldName === signaturesFieldName)}
        className="note-editor mb-2"
      >
        <Signatures
          fieldDescription={invitation.edit.signatures}
          onChange={(value) => {
            if (value.value) {
              setNoteEditorData({ ...noteEditorData, [signaturesFieldName]: value })
            } else {
              setNoteEditorData({ ...noteEditorData, [signaturesFieldName]: undefined })
            }
          }}
          currentValue={noteEditorData[signaturesFieldName]}
          onError={(errorMessage) => {
            setErrors((existingErrors) => [
              ...existingErrors,
              { fieldName: signaturesFieldName, message: errorMessage },
            ])
          }}
          clearError={() =>
            setErrors((existingErrors) =>
              existingErrors.filter((p) => p.fieldName !== signaturesFieldName)
            )
          }
        />
      </EditorComponentHeader>
    </BasicModal>
  )
}
