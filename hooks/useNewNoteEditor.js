import { useState } from 'react'

export default function useNewNoteEditor(invitation) {
  const [noteEditorVenues, setNoteEditorVenues] = useState(
    process.env.NEW_NOTE_EDITOR_VENUES
      ? JSON.parse(process.env.NEW_NOTE_EDITOR_VENUES)
      : undefined
  )

  return { newNoteEditor: noteEditorVenues?.some((p) => invitation?.id?.startsWith(p)) }
}
