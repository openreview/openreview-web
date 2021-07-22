/* eslint-disable no-param-reassign */
/* globals $: false */
/* globals view: false */
/* globals Handlebars: false */
/* globals promptLogin: false */
/* globals promptError: false */
/* globals promptMessage: false */

import {
  useEffect, useContext, useState, useRef,
} from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useQuery from '../../hooks/useQuery'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'

import '../../styles/pages/revisions.less'
import view from '../../client/view'

const RevisionsList = ({
  revisions, user, selectedIndexes, setSelectedIndexes,
}) => {
  const router = useRouter()

  const toggleSelected = (idx, checked) => {
    if (checked) {
      setSelectedIndexes([...selectedIndexes, idx].sort((a, b) => a - b))
    } else {
      setSelectedIndexes(selectedIndexes.filter(existingIdx => existingIdx !== idx))
    }
  }

  const showEditorModal = (note, invitation, editorOptions) => {
    $('#note-editor-modal').remove()
    $('body').append(Handlebars.templates.genericModal({
      id: 'note-editor-modal',
      extraClasses: 'modal-lg',
      showHeader: false,
      showFooter: false,
    }))
    $('#note-editor-modal').modal('show')

    // Tell the note editor to submit both the referent and the note id so that
    // the API doesn't create a new reference
    note.updateId = note.id

    const mkEditorFunc = editorOptions.isEdit ? view.mkNoteEditorV2 : view.mkNoteEditor
    mkEditorFunc(note, invitation, user, {
      onNoteEdited: (newNote) => {
        $('#note-editor-modal').modal('hide')
        promptMessage('Note updated successfully')
        router.reload()
        return true
      },
      onError: (errors) => {
        $('#note-editor-modal .modal-body .alert-danger').remove()

        $('#note-editor-modal .modal-body').prepend('<div class="alert alert-danger"><strong>Error:</strong> </div>')
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
      },
    })
  }

  const buildNotePanel = (note, revisionInvitation) => {
    if (!revisionInvitation && note.details) {
      note.details.originalWritable = false
    }
    if (note.details && typeof note.details.writable === 'undefined' && note.details.originalWritable) {
      note.details.writable = true
    }

    return view.mkNotePanel(note, {
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
    }).removeClass('panel')
  }

  // eslint-disable-next-line arrow-body-style
  const buildEditPanelV2 = (reference, revisionInvitation) => {
    const edit = {
      ...reference,
      content: reference.note.content, // to avoid changing note.cotent to note.note.content in view.mkNotePanelV2
    }
    return view.mkNotePanelV2(edit, {
      isEdit: true,
      invitation: revisionInvitation,
      withContent: true,
      withReplyCount: false,
      withRevisionsLink: false,
      isReference: true,
      withModificationDate: true,
      withDateTime: true,
      withBibtexLink: false,
      user,
      onEditRequested: () => {
        const editorOptions = { isEdit: true }
        showEditorModal(edit, revisionInvitation, editorOptions)
      },
      onTrashedOrRestored: () => {
        $(`#note_${edit.id}`).closest('.row').remove()
        promptMessage('Revision deleted')
      },
    }).removeClass('panel')
  }

  useEffect(() => {
    if (!revisions) return

    $('.references-list .note-container').each(function appendNotePanel(index) {
      const [reference, invitation] = revisions[index]
      if (reference.note) {
        // this is an edit
        $(this).append(buildEditPanelV2(reference, invitation))
      } else {
        $(this).append(buildNotePanel(reference, invitation))
      }
    })

    // eslint-disable-next-line consistent-return
    return () => {
      $('#note-editor-modal').remove()
    }
  }, [revisions])

  if (!revisions) return <LoadingSpinner />

  return (
    <div className={`references-list submissions-list ${selectedIndexes ? '' : 'hide-sidebar'}`}>
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
                onChange={e => toggleSelected(index, e.target.checked)}
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

const Revisions = ({ appContext }) => {
  const [parentNoteId, setParentNoteId] = useState('')
  const [revisions, setRevisions] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIndexes, setSelectedIndexes] = useState(null)
  const { user, accessToken, userLoading } = useContext(UserContext)
  const router = useRouter()
  const query = useQuery()
  const isV2Note = useRef(false)
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
    const hasPdf = revisions[selectedIndexes[0]][0].content.pdf && revisions[selectedIndexes[1]][0].content.pdf
    router.push(`/revisions/compare?id=${parentNoteId}&left=${leftId}&right=${rightId}${hasPdf ? '&pdf=true' : ''}`)
  }

  const compareRevisionsV2 = () => {
    // selectedIndexes is always stored in ascending order, so the first element
    // in the array represents the index of the most recent revision and the second
    // element represents the older revision, which should go on the left
    const leftEditId = revisions[selectedIndexes[1]][0].id
    const rightEditId = revisions[selectedIndexes[0]][0].id
    // eslint-disable-next-line max-len
    const hasPdf = revisions[selectedIndexes[0]][0].note.content.pdf?.value && revisions[selectedIndexes[1]][0].note.content.pdf?.value
    router.push(`/revisions/compare?id=${parentNoteId}&left=${leftEditId}&right=${rightEditId}${hasPdf ? '&pdf=true' : ''}${isV2Note.current ? '&v2=true' : ''}`)
  }

  useEffect(() => {
    if (userLoading || !query) return

    const noteId = query.id
    if (!noteId) {
      setError({ message: 'Missing required parameter id' })
      return
    }
    setParentNoteId(noteId)

    const setBanner = async () => {
      try {
        try {
          const { notes: v1Notes } = await api.get('/notes', { id: noteId }, { accessToken })
          if (v1Notes.length > 0) {
            setBannerContent(forumLink(v1Notes[0]))
            // eslint-disable-next-line no-use-before-define
            loadRevisions()
          } else {
            setBannerHidden(true)
          }
        } catch (v1ApiRrror) {
          if (v1ApiRrror.status === 404) {
            const { notes: v2Notes } = await api.getV2('/notes', { id: noteId }, { accessToken })
            if (v2Notes.length > 0) {
              setBannerContent(forumLink(v2Notes[0], true))
              isV2Note.current = true
              // eslint-disable-next-line no-use-before-define
              loadRevisionsV2()
            } else {
              setBannerHidden(true)
            }
          } else {
            throw v1ApiRrror
          }
        }
      } catch (apiError) {
        setBannerHidden(true)
      }
    }
    setBanner()

    const loadRevisions = async () => {
      let apiRes
      try {
        apiRes = await api.get('/references', {
          referent: noteId, original: true, trash: true,
        }, { accessToken })
      } catch (apiError) {
        setError(apiError)
        return
      }

      const references = apiRes.references || []
      const invitationIds = Array.from(new Set(references.map(reference => (
        reference.details?.original?.invitation || reference.invitation
      ))))

      try {
        const { invitations } = await api.get('/invitations', { ids: invitationIds, expired: true })

        if (invitations?.length > 0) {
          setRevisions(references.map((reference) => {
            const invId = (reference.details && reference.details.original)
              ? reference.details.original.invitation
              : reference.invitation
            const referenceInvitation = invitations.find(invitation => invitation.id === invId)
            return [reference, referenceInvitation]
          }))
        } else {
          setRevisions([])
        }
      } catch (apiError) {
        setError(apiError)
      }
    }
    const loadRevisionsV2 = async () => {
      let apiRes
      try {
        apiRes = await api.getV2('/notes/edits', {
          'note.id': noteId, details: 'writable',
        }, { accessToken })
      } catch (apiError) {
        setError(apiError)
        return
      }

      const edits = apiRes.edits || []
      const invitationIds = Array.from(new Set(edits.map(edit => edit.invitations)))

      try {
        const { invitations } = await api.getV2('/invitations', { ids: invitationIds.flatMap(p => p), expired: true })

        if (invitations?.length > 0) {
          setRevisions(edits.map((edit) => {
            const editInvitation = invitations.find(invitation => edit.invitations.includes(invitation.id))
            return [edit, editInvitation]
          }))
        } else {
          setRevisions([])
        }
      } catch (apiError) {
        setError(apiError)
      }
    }
  }, [userLoading, query, accessToken])

  return (
    <>
      <Head>
        <title key="title">Revisions | OpenReview</title>
      </Head>

      <header>
        <h1>Revision History</h1>
        <div className="button-container">
          {selectedIndexes ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedIndexes.length !== 2}
                onClick={isV2Note.current ? compareRevisionsV2 : compareRevisions}
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
        />
      )}
    </>
  )
}

Revisions.bodyClass = 'revisions'

export default Revisions
