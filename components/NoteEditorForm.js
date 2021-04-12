/* globals $: false */
/* globals view: false */

import {
  useContext, useEffect, useRef, useState,
} from 'react'
import LoadingSpinner from './LoadingSpinner'
import UserContext from './UserContext'

export default function NoteEditorForm({
  invitation, forumId, parentId, onNoteCreated, onNoteCancelled, onLoad, onValidate, onError,
}) {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const user = useContext(UserContext)

  useEffect(() => {
    if (typeof view === 'undefined') return

    view.mkNewNoteEditor(invitation, forumId, parentId, user, {
      onNoteCreated,
      onNoteCancelled,
      onCompleted: ($editor) => {
        setLoading(false)
        $(containerRef.current).append($editor)

        onLoad()
      },
      onValidate,
      onError,
    })
  }, [])

  return (
    <div ref={containerRef}>
      {loading && (
        <LoadingSpinner inline />
      )}
    </div>
  )
}
