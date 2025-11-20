/* globals $: false */
/* globals view: false */
/* globals view2: false */
/* globals promptError: false */
/* globals promptLogin: false */

import { useEffect, useRef, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import useUser from '../hooks/useUser'

export default function NoteEditorForm({
  invitation,
  note,
  forumId,
  replyToId,
  loadingIndicator,
  onNoteCreated,
  onNoteEdited,
  onNoteCancelled,
  onLoad,
  onValidate,
  onError,
}) {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const { user, isRefreshing } = useUser()

  const handleEditor = ($editor) => {
    setLoading(false)

    if (!$editor && typeof onError === 'function') {
      onError(true)
      return
    }

    $(containerRef.current).append($editor)

    if (typeof onLoad === 'function') {
      onLoad()
    }
  }

  const handleCreated = (newNote) => {
    if (typeof onNoteCreated === 'function') {
      onNoteCreated(newNote)
    }
  }

  const handleEdited = (updatedNote) => {
    if (typeof onNoteEdited === 'function') {
      onNoteEdited(updatedNote)
    }
  }

  const handleError = (errors) => {
    setLoading(false)

    const err = errors?.[0]
    if (err === 'You do not have permission to create a note' || !user) {
      promptLogin(user)
    } else if (err) {
      promptError(err)
    } else {
      promptError('An unknown error occurred. Please refresh the page and try again.')
    }

    if (typeof onError === 'function') {
      const isLoadingError = [
        'Can not create note, readers must match parent note',
        'Default reader is not in the list of readers',
        'no_results',
      ].includes(err)
      onError(isLoadingError)
    }
  }

  useEffect(() => {
    if (!invitation || isRefreshing || typeof view === 'undefined') return

    if (!user) {
      promptLogin()
    }

    setLoading(true)

    if (note) {
      const noteEditorFn = invitation.edit ? view2.mkNoteEditor : view.mkNoteEditor
      noteEditorFn(note, invitation, user, {
        onNoteEdited: handleEdited,
        onNoteCancelled,
        onValidate,
        onCompleted: handleEditor,
        onError: handleError,
      })
    } else {
      const newNoteEditorFn = invitation.edit ? view2.mkNewNoteEditor : view.mkNewNoteEditor
      newNoteEditorFn(invitation, forumId, replyToId, user, {
        onNoteCreated: handleCreated,
        onNoteCancelled,
        onValidate,
        onCompleted: handleEditor,
        onError: handleError,
      })
    }
  }, [invitation, forumId, replyToId, containerRef, isRefreshing])

  if (!invitation || !user) return null

  return (
    <div className="note-editor-container">
      {loading &&
        (typeof loadingIndicator === 'object' ? loadingIndicator : <LoadingSpinner inline />)}

      <div ref={containerRef} />
    </div>
  )
}
