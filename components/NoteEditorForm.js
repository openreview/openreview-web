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
  invitation, forumId, replyToId, onNoteCreated, onNoteCancelled, onLoad, onValidate, onError,
}) {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const { user } = useContext(UserContext)

  useEffect(() => {
    if (!invitation || !forumId || typeof view === 'undefined') return

    if (!user) {
      promptLogin()
    }

    setLoading(true)

    view.mkNewNoteEditor(invitation, forumId, replyToId, user, {
      onNoteCreated,
      onNoteCancelled,
      onValidate,
      onCompleted: ($editor) => {
        setLoading(false)
        $(containerRef.current).append($editor)

        if (typeof onLoad === 'function') {
          onLoad()
        }
      },
      onError: (errors) => {
        setLoading(false)

        const err = errors?.[0]
        if (!err) {
          promptError('An unknown error occurred. Please refresh the page and try again.')
          return
        }

        if (!user || err === 'You do not have permission to create a note') {
          promptLogin(user)
        } else {
          promptError(err)
        }

        if (typeof onError === 'function') {
          onError()
        }
      },
    })
  }, [invitation, forumId, replyToId, user, containerRef])

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
