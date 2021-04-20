/* globals $: false */
/* globals view: false */

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
  const user = useContext(UserContext)

  useEffect(() => {
    if (!user || !containerRef || typeof view === 'undefined') return

    view.mkNewNoteEditor(invitation, forumId, replyToId, user, {
      onNoteCreated: () => {
        if (typeof onLoad === 'function') {
          onNoteCreated()
        }
      },
      onNoteCancelled: () => {
        if (typeof onLoad === 'function') {
          onNoteCancelled()
        }
      },
      onCompleted: ($editor) => {
        setLoading(false)
        $(containerRef.current).append($editor)

        if (typeof onLoad === 'function') {
          onLoad()
        }
      },
      onValidate,
      onError: () => {
        setLoading(false)
        if (typeof onError === 'function') {
          onError()
        }
      },
    })
  }, [invitation, forumId, replyToId, user, containerRef])

  return (
    <div className="note-editor-container">
      {loading && (
        <LoadingSpinner inline />
      )}
      <div ref={containerRef} />
    </div>
  )
}
