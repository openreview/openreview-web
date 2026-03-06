'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { pickBy } from 'lodash'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import Forum from '../../components/forum/Forum'
import styles from './Forum.module.scss'
import CommonLayout from '../CommonLayout'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import Banner from '../../components/Banner'
import legacyStyles from './LegacyForum.module.scss'
import LegacyForum from '../../components/forum/LegacyForum'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'

const shouldRedirect = async (noteIdParam) => {
  try {
    // if it is the original of a blind submission, do redirection
    const blindNotesResult = await api.get('/notes', { original: noteIdParam }, { version: 1 })
    if (blindNotesResult.notes?.length) {
      return blindNotesResult.notes[0]
    }
  } catch (error) {
    return false
  }

  return false
}

const redirectForum = (noteId, forumId, invitationId, referrer) => {
  const noteIdParam = noteId ? `&noteId=${encodeURIComponent(noteId)}` : ''
  const invIdParam = invitationId ? `&invitationId=${encodeURIComponent(invitationId)}` : ''
  const referrerParam = referrer ? `&referrer=${encodeURIComponent(referrer)}` : ''

  return `/forum?id=${encodeURIComponent(forumId)}${noteIdParam}${invIdParam}${referrerParam}`
}

const getForumNote = async (queryId, invitationId, query, user) => {
  try {
    const note = await api.getNoteById(
      queryId,
      null,
      { trash: true, details: 'writable,presentation' },
      { trash: true, details: 'original,replyCount,writable' }
    )
    if (note?.ddate && !note?.details?.writable) {
      throw new Error('Not Found')
    }

    // Allows the UI to link to forum pages just using a note ID, that may be a reply
    if (note && (note.id !== note.forum || !query.id)) {
      const redirectPath = redirectForum(
        query.noteId,
        note.forum,
        invitationId,
        query.referrer
      )
      return { redirectPath }
    }

    if (note?.version === 2) {
      return { forumNote: note, version: 2 }
    }

    // if blind submission return the forum
    if (note?.original) {
      return { forumNote: note, version: 1 }
    }

    const redirectNote = await shouldRedirect(queryId)
    if (redirectNote) {
      const redirectPath = redirectForum(
        query.noteId,
        redirectNote.id,
        invitationId,
        query.referrer
      )
      return { redirectPath }
    }

    if (!note) {
      throw new Error(`The Note ${queryId} was not found`)
    }

    return { forumNote: note, version: 1 }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      const redirectNote = await shouldRedirect(queryId)
      if (redirectNote) {
        const redirectPath = redirectForum(
          query.noteId,
          redirectNote.id,
          invitationId,
          query.referrer
        )
        return { redirectPath }
      }

      // Redirect to login
      if (!user) {
        return {
          redirectPath: `/login?redirect=/forum?${encodeURIComponent(stringify(query))}`,
        }
      }

      return { errorMessage: "You don't have permission to read this forum" }
    }

    return { errorMessage: error.message }
  }
}

export default function ClientForum({ queryId, query }) {
  const router = useRouter()
  const { user, isRefreshing } = useUser()
  const { invitationId, referrer } = query
  const [forumState, setForumState] = useState(null)
  const content =
    forumState?.version === 2
      ? Object.keys(forumState?.forumNote?.content ?? {}).reduce((translatedContent, key) => {
          // eslint-disable-next-line no-param-reassign
          translatedContent[key] = forumState.forumNote.content[key].value
          return translatedContent
        }, {})
      : forumState?.forumNote?.content

  useEffect(() => {
    if (isRefreshing) return

    const loadForum = async () => {
      const result = await getForumNote(queryId, invitationId, query, user)

      if (result.redirectPath) {
        router.replace(result.redirectPath)
        return
      }
      setForumState(result)
    }

    loadForum()
  }, [invitationId, isRefreshing, query, queryId, router, user])

  if (!forumState) return <LoadingSpinner />
  if (forumState.errorMessage) return <ErrorDisplay message={forumState.errorMessage} />
  console.log('forumState', forumState)

  const { forumNote, version } = forumState
  const noteInvitation = version === 2 ? forumNote.invitations[0] : forumNote.invitation

  let banner
  if (referrer) {
    banner = referrerLink(referrer)
  } else {
    const groupId =
      version === 2 || !content.venueid ? noteInvitation.split('/-/')[0] : content.venueid
    banner = venueHomepageLink(groupId)
  }

  if (version === 2) {
    return (
      <CommonLayout banner={<Banner>{banner}</Banner>}>
        <div className={styles.forum}>
          <Forum
            forumNote={forumNote}
            selectedNoteId={query.noteId}
            selectedInvitationId={query.invitationId}
            prefilledValues={pickBy(query, (_, key) => key.startsWith('edit.note.'))}
            query={query}
          />
        </div>
      </CommonLayout>
    )
  }

  return (
    <CommonLayout banner={<Banner>{banner}</Banner>}>
      <div className={`legacy-forum ${legacyStyles.legacyForum}`}>
        <LegacyForum
          forumNote={forumNote}
          selectedNoteId={query.noteId}
          selectedInvitationId={query.invitationId}
        />
      </div>
    </CommonLayout>
  )
}
