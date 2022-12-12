import { useState, useEffect } from 'react'
import intersection from 'lodash/intersection'
import NoteActivity, { NoteActivityV2 } from './NoteActivity'
import useUser from '../hooks/useUser'
import { prettyId } from '../lib/utils'

export default function BaseActivityList({ notes, emptyMessage, showActionButtons, showGroup }) {
  const [formattedNotes, setFormattedNotes] = useState(null)
  const { user, userLoading } = useUser()

  useEffect(() => {
    if (!notes || userLoading) return

    const tempNotes = []

    notes.forEach((note) => {
      const invitationArr = note.invitation.split('/-/')
      if (invitationArr[1].toLowerCase().includes('assignment')) {
        return
      }

      const noteAuthors = note.tauthor ? [note.tauthor] : note.signatures
      const userIsSignatory =
        user && intersection(noteAuthors, user.profile.emails.concat(user.profile.usernames, user.id)).length
      let formattedSignature
      if (userIsSignatory) {
        formattedSignature = 'You'
      } else {
        let prettySig = prettyId(note.signatures[0])
        if (prettySig === '(anonymous)' || prettySig === '(guest)') {
          prettySig = 'Anonymous'
        } else if (prettySig === 'Super User') {
          prettySig = 'An Administrator'
        }
        formattedSignature = prettySig
      }
      let isForum
      if (note.apiVersion === 2) {
        const { forum, id } = note.note
        isForum = forum && id && forum === id
      } else {
        isForum = note.forum === note.id
      }

      tempNotes.push({
        ...note,
        details: {
          ...note.details,
          group: invitationArr[0],
          isDeleted: note.ddate && note.ddate < Date.now(),
          isUpdated: note.tmdate > note.tcdate,
          isForum,
          userIsSignatory,
          formattedSignature,
        },
      })
    })

    // Filter out any notes that should not be displayed
    setFormattedNotes(tempNotes)
  }, [notes])

  if (!formattedNotes) return null

  return (
    <ul className="list-unstyled submissions-list activity-list">
      {formattedNotes.length > 0 ? formattedNotes.map((note) => (
        <li
          key={note.id}
          className={`note note-activity ${note.details.isDeleted ? 'trashed' : ''}`}
        >
          {note.apiVersion === 2 ? (
            <NoteActivityV2 note={note} showActionButtons={showActionButtons} showGroup={showGroup} />
          ) : (
            <NoteActivity note={note} showActionButtons={showActionButtons} showGroup={showGroup} />
          )}
        </li>
      )) : (
        <li><p className="empty-message">{emptyMessage}</p></li>
      )}
    </ul>
  )
}
