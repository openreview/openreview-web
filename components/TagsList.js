/* globals promptError: false */

import { useEffect, useState } from 'react'
import { uniq } from 'lodash'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import LoadingSpinner from './LoadingSpinner'
import NoteList from './NoteList'
import { prettyInvitationId } from '../lib/utils'

const TagsList = () => {
  const { user, accessToken } = useUser()
  const [tagsMap, setTagsMap] = useState(null)

  const loadTags = async () => {
    try {
      const { tags } = await api.get(
        '/tags',
        {
          signature: user?.profile?.id,
        },
        { accessToken }
      )
      const tagInvitations = uniq(tags.map((tag) => tag.invitation))

      const forumIds = uniq(tags.map((tag) => tag.forum))
      if (!forumIds.length) {
        setTagsMap({})
        return
      }
      const { notes } = await api.get(
        '/notes',
        {
          ids: forumIds,
        },
        { accessToken }
      )

      const notesByTagMap = {}

      tagInvitations.forEach((tagInvitation) => {
        const tagsOfInvitation = tags.filter((tag) => tag.invitation === tagInvitation)
        const notesOfInvitation = notes.filter((note) =>
          tagsOfInvitation.some((tag) => tag.forum === note.id)
        )
        notesByTagMap[tagInvitation] = {
          label: tagsOfInvitation[0].label,
          notes: notesOfInvitation,
        }
      })

      setTagsMap(notesByTagMap)
    } catch (error) {
      promptError(error.message)
    }
  }
  useEffect(() => {
    if (!user?.profile?.id) return
    loadTags()
  }, [user])

  if (!tagsMap) return <LoadingSpinner />
  if (!Object.keys(tagsMap).length) return <p className="empty-message">No tags found</p>
  return (
    <>
      {Object.entries(tagsMap).map(([tagInvitationId, { notes, label }]) => (
        <div key={tagInvitationId}>
          <h4>
            {prettyInvitationId(tagInvitationId)} {label}
          </h4>
          <NoteList
            notes={notes}
            displayOptions={{ showContents: false, openNoteInNewWindow: true }}
          />
        </div>
      ))}
    </>
  )
}

export default TagsList
