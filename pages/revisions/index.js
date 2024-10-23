/* globals $,view,view2,Handlebars,promptLogin,promptError,promptMessage: false */

import { useEffect, useContext, useState } from 'react'
import { flushSync } from 'react-dom'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { truncate } from 'lodash'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import NoteEditor from '../../components/NoteEditor'
import ErrorAlert from '../../components/ErrorAlert'
import Edit from '../../components/Edit/Edit'
import { EditButton, RestoreButton, TrashButton } from '../../components/IconButton'
import BasicModal from '../../components/BasicModal'
import ConfirmDeleteModal from '../../components/forum/ConfirmDeleteModal'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'

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

const RevisionsList = ({
  revisions,
  user,
  selectedIndexes,
  setSelectedIndexes,
  accessToken,
  loadEdits,
  isNoteWritable,
}) => {
  const router = useRouter()
  const [editToChange, setEditToChange] = useState(null)
  const [confirmDeleteModalData, setConfirmDeleteModalData] = useState(null)
  const newNoteEditor = revisions?.some((p) => p?.[0]?.domain)

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
    // eslint-disable-next-line no-param-reassign
    note.updateId = note.id

    view.mkNoteEditor(note, invitation, user, {
      onNoteEdited: (newNote) => {
        $('#note-editor-modal').modal('hide')
        promptMessage('Note updated successfully')
        router.reload()
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
      // eslint-disable-next-line no-param-reassign
      note.details.originalWritable = false
    }
    if (
      note.details &&
      typeof note.details.writable === 'undefined' &&
      note.details.originalWritable
    ) {
      // eslint-disable-next-line no-param-reassign
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

  const deleteOrRestoreNote = (edit, invitation) => {
    flushSync(() => {
      setConfirmDeleteModalData({ edit, invitation })
    })
    $('#confirm-delete-modal').modal('show')
  }

  const editEdit = (edit, invitation) => {
    $('#edit-edit-modal').remove()
    $('body').append(
      Handlebars.templates.genericModal({
        id: 'edit-edit-modal',
        extraClasses: 'modal-lg',
        showHeader: false,
        showFooter: false,
      })
    )
    $('#edit-edit-modal').modal('show')
    view2.mkNoteEditor(edit.note, invitation, user, {
      isEdit: true,
      editToUpdate: edit,
      onNoteEdited: () => {
        $('#edit-edit-modal').modal('hide')
        promptMessage('Edit updated successfully')
        loadEdits()
        return true
      },
      onNoteCancelled: () => {
        $('#edit-edit-modal').modal('hide')
      },
      onError: (errors) => {
        $('#edit-edit-modal .modal-body .alert-danger').remove()

        $('#edit-edit-modal .modal-body').prepend(
          '<div class="alert alert-danger"><strong>Error:</strong> </div>'
        )
        $('#edit-edit-modal .modal-body .alert-danger').append(
          errors.length ? errors[0] : 'Could not save edit'
        )
        $('#edit-edit-modal').animate({ scrollTop: 0 }, 400)
      },
      onCompleted: (editor) => {
        $('#edit-edit-modal .modal-body').empty().addClass('legacy-styles').append(editor)
        $('#edit-edit-modal').on('hidden.bs.modal', () => {
          $('#edit-edit-modal').find('div.note_editor.panel').remove()
        })
      },
    })
  }

  useEffect(() => {
    if (!revisions || revisions[0]?.note) return

    $('.references-list .note-container').each(function appendNotePanel(index) {
      const [reference, invitation] = revisions[index]
      $(this).append(buildNotePanel(reference, invitation))
    })

    $('[data-toggle="tooltip"]').tooltip({ placement: 'bottom' })
  }, [revisions])

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
          {reference.note ? (
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
                          onClick={() =>
                            newNoteEditor
                              ? setEditToChange({ edit: reference, invitation })
                              : editEdit(reference, invitation)
                          }
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
          ) : (
            <div className="col-sm-11 note-container" />
          )}
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

const Revisions = ({ appContext }) => {
  const [parentNoteId, setParentNoteId] = useState('')
  const [revisions, setRevisions] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIndexes, setSelectedIndexes] = useState(null)
  const [referencesToLoad, setReferencesToLoad] = useState(null)
  const [isNoteWritable, setIsNoteWritable] = useState(false)
  const { user, accessToken, userLoading } = useContext(UserContext)
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent, setBannerHidden } = appContext

  const enterSelectMode = () => {
    if (!accessToken) {
      promptLogin()
      return
    }
    setSelectedIndexes([])
  }

  const compareRevisions = () => {
    // selectedIndexes is always stored in ascending order, so the first element
    // in the array represents the index of the most recent revision and the second
    // element represents the older revision, which should go on the left
    const leftId = revisions[selectedIndexes[1]][0].id
    const rightId = revisions[selectedIndexes[0]][0].id
    if (referencesToLoad === 'edits') {
      const hasPdf =
        revisions[selectedIndexes[0]][0].note.content?.pdf?.value &&
        revisions[selectedIndexes[1]][0].note.content?.pdf?.value
      router.push(
        `/revisions/compare?id=${parentNoteId}&left=${leftId}&right=${rightId}${
          hasPdf ? '&pdf=true' : ''
        }&version=2`
      )
      return
    }
    const hasPdf =
      revisions[selectedIndexes[0]][0].content?.pdf &&
      revisions[selectedIndexes[1]][0].content?.pdf
    router.push(
      `/revisions/compare?id=${parentNoteId}&left=${leftId}&right=${rightId}${
        hasPdf ? '&pdf=true' : ''
      }`
    )
  }

  const loadRevisions = async () => {
    let apiRes
    try {
      apiRes = await api.get(
        '/references',
        {
          referent: query.id,
          original: true,
          trash: true,
        },
        { accessToken, version: 1 }
      )
    } catch (apiError) {
      setError(apiError)
      return
    }

    const references = apiRes.references || []
    const invitationIds = Array.from(
      new Set(
        references.map(
          (reference) => reference.details?.original?.invitation || reference.invitation
        )
      )
    )

    try {
      const { invitations } = await api.get(
        '/invitations',
        {
          ids: invitationIds,
          expired: true,
        },
        { accessToken, version: 1 }
      )

      if (invitations?.length > 0) {
        setRevisions(
          references
            .map((reference) => {
              const invId = reference.details?.original
                ? reference.details.original.invitation
                : reference.invitation
              const referenceInvitation = invitations.find(
                (invitation) => invitation.id === invId
              )
              return [reference, referenceInvitation]
            })
            .sort((p) => p[0].tcdate)
        )
      } else {
        setRevisions([])
      }
    } catch (apiError) {
      setError(apiError)
    }
  }

  const loadEdits = async () => {
    try {
      const { edits } = await api.get(
        '/notes/edits',
        {
          'note.id': query.id,
          sort: 'tcdate',
          details: 'writable,presentation,invitation',
          trash: true,
        },
        { accessToken }
      )
      setRevisions((edits ?? []).map((edit) => [edit, edit.details.invitation]))
    } catch (apiError) {
      setError(apiError)
    }
  }

  const getPageTitle = () => {
    if (!revisions?.length) return 'Revision History'

    let latestNoteTitle =
      referencesToLoad === 'revisions'
        ? revisions.find((q) => q[0]?.content?.title)?.[0]?.content?.title
        : revisions.find((q) => q[0].note?.content?.title)?.[0]?.note?.content?.title?.value
    latestNoteTitle = truncate(latestNoteTitle, {
      length: 40,
      omission: '...',
      separator: ' ',
    })
    return `Revision History${latestNoteTitle ? ` for ${latestNoteTitle}` : ''}`
  }

  useEffect(() => {
    if (userLoading || !query) return

    const noteId = query.id
    if (!noteId) {
      setError({ message: 'Missing required parameter id' })
      return
    }
    setParentNoteId(noteId)

    const loadNote = async () => {
      let note
      try {
        note = await api.getNoteById(noteId, accessToken, {
          details: 'writable,forumContent',
          trash: true,
        })
      } catch (apiError) {
        setBannerHidden(true)
        setError(apiError)
        return
      }

      if (note) {
        setBannerContent(forumLink(note))
        if (note.version === 2) {
          setReferencesToLoad('edits')
          if (note.details.writable) {
            setIsNoteWritable(true)
          }
        } else {
          setReferencesToLoad('revisions')
        }
      } else {
        setBannerHidden(true)
        setError({ message: `The note ${noteId} could not be found` })
      }
    }

    loadNote()
  }, [userLoading, query, accessToken])

  useEffect(() => {
    if (referencesToLoad === 'edits') {
      loadEdits()
    } else if (referencesToLoad === 'revisions') {
      loadRevisions()
    }
  }, [referencesToLoad])

  return (
    <>
      <Head>
        <title key="title">Revisions | OpenReview</title>
      </Head>

      <header>
        <h1>{getPageTitle()}</h1>

        <div className="button-container">
          {selectedIndexes ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedIndexes.length !== 2}
                onClick={compareRevisions}
              >
                View Differences
              </button>
              <button
                type="button"
                className="btn btn-default"
                onClick={() => setSelectedIndexes(null)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!revisions || revisions.length === 0}
              onClick={() => enterSelectMode()}
            >
              Compare Revisions
            </button>
          )}
        </div>
      </header>

      {error ? (
        <ErrorAlert error={error} />
      ) : (
        <RevisionsList
          revisions={revisions}
          user={user}
          selectedIndexes={selectedIndexes}
          setSelectedIndexes={setSelectedIndexes}
          accessToken={accessToken}
          loadEdits={loadEdits}
          isNoteWritable={isNoteWritable}
        />
      )}
    </>
  )
}

Revisions.bodyClass = 'revisions'

export default Revisions
