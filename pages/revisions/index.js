/* globals $,view,view2,Handlebars,promptLogin,promptError,promptMessage: false */
/* eslint-disable no-param-reassign */

import { useEffect, useContext, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { truncate } from 'lodash'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import Dropdown from '../../components/Dropdown'
import Edit from '../../components/Edit/Edit'
import { EditButton, RestoreButton, TrashButton } from '../../components/IconButton'
import BasicModal from '../../components/BasicModal'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { buildNoteTitle, prettyId } from '../../lib/utils'
import { forumLink } from '../../lib/banner-links'

const ConfirmDeleteRestoreModal = ({ editInfo, user, accessToken, deleteRestoreEdit }) => {
  const [signature, setSignature] = useState(null)
  const [signatureDropdownOptions, setSignatureDropdownOptions] = useState([])
  const { edit, invitation } = editInfo ?? {}
  const isSignatureRequired = !invitation?.edit?.signatures?.['values-regex']?.value?.optional
  const showSignatureDropdown = signatureDropdownOptions.length > 0

  useEffect(() => {
    if (!edit || !invitation) return

    const getAllSignatures = async () => {
      const result = await api.get(
        '/groups',
        { regex: invitation.edit.signatures['values-regex'], signatory: user.id },
        { accessToken }
      )
      setSignatureDropdownOptions(
        result.groups.flatMap((p, i) => {
          if (result.groups.findIndex((q) => q.id === p.id) === i) {
            return {
              value: p.id,
              label: prettyId(p.id),
            }
          }
          return []
        })
      )
    }

    if (invitation.edit?.signatures?.['values-regex']) {
      if (invitation.edit.signatures['values-regex'] === '.~') {
        setSignature(user.profile.preferredId ?? user.profile.id)
        setSignatureDropdownOptions([])
      } else {
        setSignature(null)
        getAllSignatures()
      }
    } else {
      setSignature(null)
      setSignatureDropdownOptions([])
    }
  }, [editInfo])

  if (!edit || !invitation) {
    return null
  }

  return (
    <BasicModal
      id="confirm-delete-restore-modal"
      title={`${edit.ddate ? 'Restore' : 'Delete'} Edit`}
      primaryButtonText={`${edit.ddate ? 'Restore' : 'Delete'}`}
      primaryButtonDisabled={showSignatureDropdown && !signature}
      onPrimaryButtonClick={() => {
        deleteRestoreEdit(edit, invitation, signature)
      }}
    >
      <p className="mb-4">
        {/* eslint-disable-next-line react/destructuring-assignment */}
        {`Are you sure you want to ${edit.ddate ? 'restore' : 'delete'} "${
          edit.note.content.title?.value || buildNoteTitle(invitation.id, edit.signatures)
        }" by ${prettyId(edit.signatures[0])}?
        ${
          showSignatureDropdown
            ? 'The deleted edit will be updated with the signature you choose below.'
            : ''
        }`}
      </p>
      {showSignatureDropdown && (
        <div className="row">
          <div className="col-sm-2">
            <span className="signature-dropdown-label">{`${
              isSignatureRequired ? '* ' : ''
            }Signature`}</span>
          </div>
          <div className="col-sm-10">
            <Dropdown
              options={signatureDropdownOptions}
              placeholder="Signature"
              value={signature ? { value: signature, label: prettyId(signature) } : null}
              onChange={(e) => {
                setSignature(e.value)
              }}
            />
          </div>
        </div>
      )}
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
  const [editToDeleteRestore, setEditToDeleteRestore] = useState(null)

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

  const deleteRestoreEdit = async (edit, invitation, signature) => {
    if (!invitation.edit) {
      promptError('invitation is invalid')
      return
    }
    const editToPost = {}
    Object.keys(invitation.edit).forEach((p) => {
      editToPost[p] = edit[p]
    })
    editToPost.id = edit.id
    editToPost.ddate = edit.ddate ? null : Date.now()
    editToPost.invitation = edit.invitation
    if (signature) editToPost.signatures = [signature]
    const editNote = {}
    Object.keys(invitation.edit.note).forEach((p) => {
      editNote[p] = edit.note[p]
    })
    editToPost.note = editNote
    await api.post('/notes/edits', editToPost, { accessToken, version: 2 })
    setEditToDeleteRestore(null)
    loadEdits()
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
    if (editToDeleteRestore) {
      $('#confirm-delete-restore-modal').modal({ backdrop: 'static' })
    } else {
      $('#confirm-delete-restore-modal').modal('hide')
      $('.modal-backdrop').remove()
    }
  }, [editToDeleteRestore])

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

              {reference.details?.writable && (
                <div className="meta_actions">
                  {reference.ddate ? (
                    <RestoreButton
                      onClick={() => setEditToDeleteRestore({ edit: reference, invitation })}
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
                          onClick={() => editEdit(reference, invitation)}
                          disableButton={!isNoteWritable}
                          disableReason={
                            !isNoteWritable
                              ? 'You are writer of the edit but not writer of the note'
                              : null
                          }
                        />
                        {invitation.edit.ddate && (
                          <TrashButton
                            onClick={() =>
                              setEditToDeleteRestore({ edit: reference, invitation })
                            }
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

      <ConfirmDeleteRestoreModal
        editInfo={editToDeleteRestore}
        user={user}
        accessToken={accessToken}
        deleteRestoreEdit={deleteRestoreEdit}
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
        { accessToken }
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
      const { invitations } = await api.get('/invitations', {
        ids: invitationIds,
        expired: true,
      })

      if (invitations?.length > 0) {
        setRevisions(
          references.map((reference) => {
            const invId =
              reference.details && reference.details.original
                ? reference.details.original.invitation
                : reference.invitation
            const referenceInvitation = invitations.find(
              (invitation) => invitation.id === invId
            )
            return [reference, referenceInvitation]
          })
        )
      } else {
        setRevisions([])
      }
    } catch (apiError) {
      setError(apiError)
    }
  }
  const loadEdits = async () => {
    let apiRes
    try {
      apiRes = await api.get(
        '/notes/edits',
        {
          'note.id': query.id,
          sort: 'tcdate',
          details: 'writable,presentation',
          trash: true,
        },
        { accessToken, version: 2 }
      )
    } catch (apiError) {
      setError(apiError)
      return
    }
    // for reusing mkNotePanel
    const edits =
      apiRes.edits.map((edit) => ({ ...edit, invitations: [edit.invitation] })) || []
    const invitationIds = Array.from(new Set(edits.map((edit) => edit.invitation)))

    try {
      const { invitations } = await api.get(
        '/invitations',
        { ids: invitationIds, expired: true },
        { accessToken, version: 2 }
      )

      if (invitations?.length > 0) {
        setRevisions(
          edits.map((edit) => {
            const invId = edit.invitation
            const editInvitation = invitations.find((invitation) => invitation.id === invId)
            return [edit, editInvitation]
          })
        )
      } else {
        setRevisions([])
      }
    } catch (apiError) {
      setError(apiError)
    }
  }

  const getPageTitle = () => {
    if (!revisions?.length) return 'Revision History'
    let latestNoteTitle =
      referencesToLoad === 'revisions'
        ? revisions.sort((p) => p[0].tcdate).find((q) => q[0]?.content?.title)?.[0]?.content
            ?.title
        : revisions.sort((p) => p[0].tcdate).find((q) => q[0].note?.content?.title)?.[0]?.note
            ?.content?.title?.value
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
        note = await api.getNoteById(
          noteId,
          accessToken,
          { details: 'writable,forumContent' },
          true
        )
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
