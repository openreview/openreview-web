/* globals $,view,view2,Handlebars,promptLogin,promptError,promptMessage: false */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import Edit from '../../components/Edit/Edit'
import BasicModal from '../../components/BasicModal'
import ErrorAlert from '../../components/ErrorAlert'
import NoteEditor from '../../components/NoteEditor'
import { EditButton, RestoreButton, TrashButton } from '../../components/IconButton'
import ConfirmDeleteModal from '../../components/forum/ConfirmDeleteModal'

const UpdateModal = ({ editInfo, setEditToChange, loadEdits }) => {
  const [errorMessage, setErrorMessage] = useState(null)
  const { edit, invitation } = editInfo ?? {}

  if (!edit) return null

  return (
    <BasicModal id="update-modal" options={{ hideFooter: true, extraClasses: 'modal-lg' }}>
      {errorMessage && <ErrorAlert error={{ message: errorMessage }} />}

      <NoteEditor
        edit={edit}
        note={edit?.note}
        invitation={invitation}
        closeNoteEditor={() => {
          $('body').removeClass('modal-open')
          $('.modal-backdrop').remove()
          setEditToChange(null)
        }}
        onNoteCreated={() => {
          setEditToChange(null)
          promptMessage('Note updated successfully')
          loadEdits()
        }}
        setErrorAlertMessage={(msg) => {
          setErrorMessage(msg)
          $('#update-modal').animate({ scrollTop: 0 }, 400)
        }}
      />
    </BasicModal>
  )
}

export function V1RevisionsList({ revisions, user, selectedIndexes, setSelectedIndexes }) {
  const router = useRouter()

  const toggleSelected = (idx, checked) => {
    if (checked) {
      setSelectedIndexes([...selectedIndexes, idx].sort((a, b) => a - b))
    } else {
      setSelectedIndexes(selectedIndexes.filter((existingIdx) => existingIdx !== idx))
    }
  }

  const showEditorModal = (note, invitation, editorOptions) => {
    $('#note-editor-modal').remove()
    $('body').append(
      Handlebars.templates.genericModal({
        id: 'note-editor-modal',
        extraClasses: 'modal-lg',
        showHeader: false,
        showFooter: false,
      })
    )
    $('#note-editor-modal').modal('show')

    // Tell the note editor to submit both the referent and the note id so that
    // the API doesn't create a new reference
    note.updateId = note.id

    view.mkNoteEditor(note, invitation, user, {
      onNoteEdited: (newNote) => {
        $('#note-editor-modal').modal('hide')
        promptMessage('Note updated successfully')
        router.refresh()
        return true
      },
      onError: (errors) => {
        $('#note-editor-modal .modal-body .alert-danger').remove()

        $('#note-editor-modal .modal-body').prepend(
          '<div class="alert alert-danger"><strong>Error:</strong> </div>'
        )
        let errorText = 'Could not save note'
        if (errors && errors.length) {
          errorText = window.translateErrorMessage(errors[0])
        }
        $('#note-editor-modal .modal-body .alert-danger').append(errorText)
        $('#note-editor-modal').animate({ scrollTop: 0 }, 400)
      },
      onNoteCancelled: () => {
        $('#note-editor-modal').modal('hide')
      },
      onCompleted: (editor) => {
        $('#note-editor-modal .modal-body').empty().addClass('legacy-styles').append(editor)
        $('#note-editor-modal').on('hidden.bs.modal', () => {
          $('#note-editor-modal').find('div.note_editor.panel').remove()
        })
      },
      isReference: true,
    })
  }

  const buildNotePanel = (note, revisionInvitation) => {
    if (!revisionInvitation && note.details) {
      note.details.originalWritable = false
    }
    if (
      note.details &&
      typeof note.details.writable === 'undefined' &&
      note.details.originalWritable
    ) {
      note.details.writable = true
    }

    return view
      .mkNotePanel(note, {
        invitation: revisionInvitation,
        withContent: true,
        withReplyCount: false,
        withRevisionsLink: false,
        isReference: true,
        withModificationDate: true,
        withDateTime: true,
        withBibtexLink: false,
        user,
        onEditRequested: (inv, options) => {
          const noteToShow = options.original ? note.details.original : note
          const editorOptions = options.original ? { fullNote: note } : {}
          showEditorModal(noteToShow, revisionInvitation, editorOptions)
        },
        onTrashedOrRestored: () => {
          $(`#note_${note.id}`).closest('.row').remove()
          promptMessage('Revision deleted')
        },
      })
      .removeClass('panel')
  }

  useEffect(() => {
    if (!revisions || revisions[0]?.note) return

    $('.references-list .note-container').each(function appendNotePanel(index) {
      const [reference, invitation] = revisions[index]
      $(this).append(buildNotePanel(reference, invitation))
    })

    $('[data-toggle="tooltip"]').tooltip({ placement: 'bottom' })
  }, [revisions])

  if (!revisions) return <LoadingSpinner />

  return (
    <div
      className={`references-list submissions-list ${selectedIndexes ? '' : 'hide-sidebar'}`}
    >
      {selectedIndexes && (
        <div className="alert alert-warning">
          To view a full comparison, select two revisions by checking the corresponding
          checkboxes, then click the View Differences button.
        </div>
      )}

      {revisions.map(([reference, invitation], index) => (
        <div key={reference.id} className="row">
          <div className="checkbox col-sm-1">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              <input
                type="checkbox"
                checked={(selectedIndexes && selectedIndexes.includes(index)) || false}
                onChange={(e) => toggleSelected(index, e.target.checked)}
              />
            </label>
          </div>
          <div className="col-sm-11 note-container" />
        </div>
      ))}

      {revisions.length === 0 && (
        <div className="alert alert-danger">No revisions to display.</div>
      )}
    </div>
  )
}

export default function RevisionsList({
  revisions,
  selectedIndexes,
  setSelectedIndexes,
  accessToken,
  loadEdits,
  isNoteWritable,
}) {
  const [editToChange, setEditToChange] = useState(null)
  const [confirmDeleteModalData, setConfirmDeleteModalData] = useState(null)

  const toggleSelected = (idx, checked) => {
    if (checked) {
      setSelectedIndexes([...selectedIndexes, idx].sort((a, b) => a - b))
    } else {
      setSelectedIndexes(selectedIndexes.filter((existingIdx) => existingIdx !== idx))
    }
  }

  const deleteOrRestoreNote = (edit, invitation) => {
    flushSync(() => {
      setConfirmDeleteModalData({ edit, invitation })
    })
    $('#confirm-delete-modal').modal('show')
  }

  useEffect(() => {
    if (editToChange) {
      $('#update-modal').modal({ backdrop: 'static' })
    } else {
      $('#update-modal').modal('hide')
      $('.modal-backdrop').remove()
    }
  }, [editToChange])

  if (!revisions) return <LoadingSpinner />

  return (
    <div
      className={`references-list submissions-list ${selectedIndexes ? '' : 'hide-sidebar'}`}
    >
      {selectedIndexes && (
        <div className="alert alert-warning">
          To view a full comparison, select two revisions by checking the corresponding
          checkboxes, then click the View Differences button.
        </div>
      )}

      {revisions.map(([reference, invitation], index) => (
        <div key={reference.id} className="row">
          <div className="checkbox col-sm-1">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label>
              <input
                type="checkbox"
                checked={(selectedIndexes && selectedIndexes.includes(index)) || false}
                onChange={(e) => toggleSelected(index, e.target.checked)}
              />
            </label>
          </div>
          <>
            <div className="col-sm-9">
              <Edit
                edit={reference}
                type="note"
                className={reference.ddate ? 'edit-trashed' : ''}
                showContents
              />
            </div>

            {reference.details?.writable && invitation && (
              <div className="meta_actions">
                {reference.ddate ? (
                  <RestoreButton
                    onClick={() => deleteOrRestoreNote(reference, invitation)}
                    disableButton={!isNoteWritable}
                    disableReason={
                      !isNoteWritable
                        ? 'You are writer of the edit but not writer of the note'
                        : null
                    }
                  />
                ) : (
                  invitation.edit !== true && (
                    <>
                      <EditButton
                        onClick={() => setEditToChange({ edit: reference, invitation })}
                        disableButton={!isNoteWritable}
                        disableReason={
                          !isNoteWritable
                            ? 'You are writer of the edit but not writer of the note'
                            : null
                        }
                      />
                      {invitation.edit.ddate && (
                        <TrashButton
                          onClick={() => deleteOrRestoreNote(reference, invitation)}
                          disableButton={!isNoteWritable}
                          disableReason={
                            !isNoteWritable
                              ? 'You are writer of the edit but not writer of the note'
                              : null
                          }
                        />
                      )}
                    </>
                  )
                )}
              </div>
            )}
          </>
        </div>
      ))}

      {confirmDeleteModalData && (
        <ConfirmDeleteModal
          note={confirmDeleteModalData.edit}
          invitation={confirmDeleteModalData.invitation}
          updateNote={() => {
            loadEdits()
          }}
          accessToken={accessToken}
          onClose={() => {
            $('#confirm-delete-modal').modal('hide')
            setConfirmDeleteModalData(null)
          }}
          isEdit={true}
        />
      )}

      <UpdateModal
        editInfo={editToChange}
        setEditToChange={setEditToChange}
        loadEdits={loadEdits}
      />

      {revisions.length === 0 && (
        <div className="alert alert-danger">No revisions to display.</div>
      )}
    </div>
  )
}
