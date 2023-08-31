import { useState, useEffect } from 'react'
import intersection from 'lodash/intersection'
import NoteActivity, { NoteActivityV2 } from './NoteActivity'
import useUser from '../hooks/useUser'
import { prettyId } from '../lib/utils'

export default function BaseActivityList({
  notes,
  emptyMessage,
  showActionButtons,
  showGroup,
}) {
  const [formattedNotes, setFormattedNotes] = useState(null)
  const { user, userLoading } = useUser()

  useEffect(() => {
    if (!notes || userLoading) return

    const tempNotes = []

    notes.forEach((note) => {
      const { forum, id } = note.apiVersion === 2 ? note.note : note
      if (!forum) return

      const noteAuthors = note.tauthor ? [note.tauthor] : note.signatures
      const userIsSignatory =
        user &&
        intersection(noteAuthors, user.profile.emails.concat(user.profile.usernames, user.id))
          .length
      let formattedSignature
      if (userIsSignatory) {
        formattedSignature = 'You'
      } else {
        formattedSignature = prettyId(note.signatures[0])
        if (formattedSignature === '(anonymous)' || formattedSignature === '(guest)') {
          formattedSignature = 'Anonymous'
        } else if (formattedSignature === 'Super User') {
          formattedSignature = 'An Administrator'
        }
      }

      tempNotes.push({
        ...note,
        details: {
          ...note.details,
          group: note.invitation.split('/-/')[0],
          isDeleted: note.ddate && note.ddate < Date.now(),
          isUpdated: note.tmdate > note.tcdate,
          isForum: forum === id,
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
      {formattedNotes.length > 0 ? (
        formattedNotes.map((note) => (
          <li
            key={note.id}
            className={`note note-activity ${note.details.isDeleted ? 'trashed' : ''}`}
          >
            {note.apiVersion === 2 ? (
              <NoteActivityV2
                note={note}
                showActionButtons={showActionButtons}
                showGroup={showGroup}
              />
            ) : (
              <NoteActivity
                note={note}
                showActionButtons={showActionButtons}
                showGroup={showGroup}
              />
            )}
          </li>
        ))
      ) : (
        <li>
          <p className="empty-message">{emptyMessage}</p>
        </li>
      )}
    </ul>
  )
}
