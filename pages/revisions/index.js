/* eslint-disable no-param-reassign */
/* globals $: false */
/* globals view: false */
/* globals Handlebars: false */
/* globals promptLogin: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useEffect, useContext, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useQuery from '../../hooks/useQuery'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import api from '../../lib/api-client'
import { forumLink } from '../../lib/banner-links'

import '../../styles/pages/revisions.less'

const RevisionsList = ({
  revisions, user, selectedIndexes, setSelectedIndexes,
}) => {
  const toggleSelected = (idx, checked) => {
    if (checked) {
      setSelectedIndexes([...selectedIndexes, idx].sort((a, b) => a - b))
    } else {
      setSelectedIndexes(selectedIndexes.filter(existingIdx => existingIdx !== idx))
    }
  }

  const showEditorModal = (note, invitation, editorOptions) => {
    if (invitation.expdate && invitation.expdate < Date.now()) {
      promptError('Cannot edit the note. Invitation has expired.')
      return
    }

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

    view.mkNoteEditor(note, invitation, user, {
      onNoteEdited: (newNote) => {
        $('#note-editor-modal').modal('hide')
        promptMessage('Note updated successfully')
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
        $('.references-list').find(`#note-${note.id}`).hide()
        promptMessage('Revision deleted')
      },
    }).removeClass('panel')
  }

  useEffect(() => {
    if (!revisions) return

    $('.references-list .note-container').each(function appendNotePanel(index) {
      const [reference, invitation] = revisions[index]
      $(this).append(buildNotePanel(reference, invitation))
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
                checked={selectedIndexes && selectedIndexes.includes(index)}
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
    router.push(`/revisions/compare?id=${parentNoteId}&left=${leftId}&right=${rightId}`)
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
        const { notes } = await api.get('/notes', { id: noteId }, { accessToken })
        if (notes?.length > 0) {
          setBannerContent(forumLink(notes[0]))
        } else {
          setBannerHidden(true)
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
      const { invitations } = await api.get('/invitations', { ids: invitationIds })

      setRevisions(references.map((reference) => {
        const invId = (reference.details && reference.details.original)
          ? reference.details.original.invitation
          : reference.invitation
        const referenceInvitation = invitations.find(invitation => invitation.id === invId)
        return [reference, referenceInvitation]
      }))
    }
    loadRevisions()
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
        />
      )}
    </>
  )
}

Revisions.bodyClass = 'revisions'

export default Revisions
