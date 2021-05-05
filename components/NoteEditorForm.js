/* globals $: false */
/* globals view: false */
/* globals promptError: false */
/* globals promptLogin: false */

import {
  useContext, useEffect, useRef, useState,
} from 'react'
import LoadingSpinner from './LoadingSpinner'
import UserContext from './UserContext'

export default function NoteEditorForm({
  invitation, note, forumId, replyToId,
  onNoteCreated, onNoteEdited, onNoteCancelled, onLoad, onValidate, onError,
}) {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const { user } = useContext(UserContext)

  const handleEditor = ($editor) => {
    setLoading(false)

    if (!$editor && typeof onError === 'function') {
      onError()
      return
    }

    $(containerRef.current).append($editor)

    if (typeof onLoad === 'function') {
      onLoad()
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
      onError()
    }
  }

  useEffect(() => {
    if (!invitation || (!note && !forumId) || typeof view === 'undefined') return

    if (!user) {
      promptLogin()
    }

    setLoading(true)

    if (note) {
      view.mkNoteEditor(note, invitation, user, {
        onNoteEdited,
        onNoteCancelled,
        onValidate,
        onCompleted: handleEditor,
        onError: handleError,
      })
    } else {
      view.mkNewNoteEditor(invitation, forumId, replyToId, user, {
        onNoteCreated,
        onNoteCancelled,
        onValidate,
        onCompleted: handleEditor,
        onError: handleError,
      })
    }
  }, [invitation, forumId, replyToId, containerRef])

  if (!invitation || !user) return null

  return (
    <div className="note-editor-container">
      {loading && (
        <LoadingSpinner inline />
      )}
      <div ref={containerRef} />
    </div>
  )
}
