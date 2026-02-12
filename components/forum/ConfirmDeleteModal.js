/* globals promptError: false, view2 */

import { useState } from 'react'
import BasicModal from '../BasicModal'
import { NewReplyEditNoteReaders } from '../NoteEditorReaders'
import Signatures from '../Signatures'
import EditorComponentHeader from '../EditorComponents/EditorComponentHeader'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { getNoteContentValues } from '../../lib/forum-utils'

export default function ConfirmDeleteModal({ note, invitation, updateNote, onClose, isEdit }) {
  const [editReaders, setEditReaders] = useState({ value: note?.readers })
  const [editSignatures, setEditSignatures] = useState(null)
  const [readersError, setReadersError] = useState(null)
  const [signaturesError, setSignaturesError] = useState(null)

  const noteTitle = note?.content?.title?.value ?? note?.generatedTitle ?? 'Untitled'
  const isDeleted = note && note.ddate && note.ddate < Date.now()
  const hasConstReaders =
    Array.isArray(invitation.edit.readers) || invitation.edit.readers.param?.const
  const actionText = isDeleted ? 'Restore' : 'Delete'
  const actionTextLower = actionText.toLowerCase()

  const postUpdatedNote = () => {
    // eslint-disable-next-line no-nested-ternary
    const ddate = isDeleted ? (isEdit ? undefined : { delete: true }) : Date.now()
    const editSignatureValues = editSignatures?.value
    const editReaderValues = editReaders?.value
    if (!editSignatureValues || !editReaderValues?.length) {
      return
    }

    let editToPost
    if (isEdit) {
      editToPost = view2.constructUpdatedEdit({ ...note, ddate }, invitation, {
        ...getNoteContentValues(note.note.content),
        editSignatureInputValues: editSignatureValues,
        editReaderValues,
      })
    } else {
      editToPost = view2.constructEdit({
        formData: { editSignatureInputValues: editSignatureValues, editReaderValues },
        noteObj: { ...note, ddate },
        invitationObj: invitation,
      })
    }
    api
      .post('/notes/edits', editToPost)
      .then((res) =>
        // the return of the post is an edit not the full note, so get the updated note again
        api.get('/notes', { id: res.note.id, trash: !isDeleted })
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
      title={note ? `${actionText} ${isEdit ? 'Edit' : 'Note'}` : null}
      primaryButtonText={actionText}
      primaryButtonDisabled={!editReaders?.value || !editSignatures?.value}
      onPrimaryButtonClick={postUpdatedNote}
      onClose={() => {
        if (typeof onClose === 'function') onClose()
      }}
    >
      <p className="mb-4">
        Are you sure you want to {actionTextLower}{' '}
        {isEdit ? 'this edit' : `the note "${noteTitle}" by ${prettyId(note.signatures[0])}`}?
        The {isEdit ? 'edit' : `${actionTextLower}d note`} will be updated with the signature
        you choose below.
      </p>

      {!hasConstReaders && (
        <NewReplyEditNoteReaders
          fieldDescription={invitation.edit.readers}
          closeNoteEditor={() => {}}
          value={editReaders}
          onChange={(value) => {
            setEditReaders(value ? { value } : null)
          }}
          setLoading={() => {}}
          placeholder="Select edit readers"
          error={readersError}
          onError={(errorMessage) => {
            setReadersError({ fieldName: 'editReaders', message: errorMessage })
          }}
          clearError={() => {
            setReadersError(null)
          }}
          className="note-editor mb-2"
        />
      )}

      <EditorComponentHeader
        fieldNameOverwrite="Signatures"
        inline={true}
        error={signaturesError}
        className="note-editor mb-2"
      >
        <Signatures
          fieldDescription={invitation.edit.signatures}
          onChange={(value) => {
            // Ignore loading messages from the signatures component
            if (typeof value.value !== 'undefined') {
              setEditSignatures(value)
            }
          }}
          currentValue={editSignatures}
          onError={(errorMessage) => {
            setSignaturesError({ fieldName: 'editSignatures', message: errorMessage })
          }}
          clearError={() => {
            setSignaturesError(null)
          }}
        />
      </EditorComponentHeader>
    </BasicModal>
  )
}
