/* eslint-disable no-underscore-dangle */
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { stringify } from 'query-string'
import { pickBy, truncate } from 'lodash'
import api from '../../lib/api-client'
import serverAuth from '../auth'
import { getConferenceName, getIssn, getJournalName } from '../../lib/utils'
import Forum from '../../components/forum/Forum'
import styles from './Forum.module.scss'
import CommonLayout from '../CommonLayout'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import Banner from '../../components/Banner'
import legacyStyles from './LegacyForum.module.scss'
import LegacyForum from '../../components/forum/LegacyForum'
import ErrorDisplay from '../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export const metadata = {}

export default async function page({ searchParams }) {
  const query = await searchParams
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')

  const { id, noteId, invitationId, referrer } = query
  const queryId = id || noteId
  if (!queryId) return <ErrorDisplay message="Forum or note ID is required" />

  const { token } = await serverAuth()

  const shouldRedirect = async (noteIdParam) => {
    try {
      // if it is the original of a blind submission, do redirection
      const blindNotesResult = await api.get(
        '/notes',
        { original: noteIdParam },
        { accessToken: token, version: 1 }
      )

      // if no blind submission found return the current forum
      if (blindNotesResult.notes?.length) {
        return blindNotesResult.notes[0]
      }
    } catch (error) {
      return false
    }

    return false
  }

  const redirectForum = (forumId) => {
    const noteIdParam = noteId ? `&noteId=${encodeURIComponent(noteId)}` : ''
    const invIdParam = invitationId ? `&invitationId=${encodeURIComponent(invitationId)}` : ''
    const referrerParam = referrer ? `&referrer=${encodeURIComponent(referrer)}` : ''

    return `/forum?id=${encodeURIComponent(
      forumId
    )}${noteIdParam}${invIdParam}${referrerParam}`
  }

  let redirectPath = null
  const getForumNote = async () => {
    try {
      const note = await api.getNoteById(
        queryId,
        token,
        { trash: true, details: 'writable,presentation' },
        { trash: true, details: 'original,replyCount,writable' }
      )
      if (note?.ddate && !note?.details?.writable) {
        throw new Error('Not Found')
      }
      // Allows the UI to link to forum pages just using a note ID, that may be a reply
      if (note && (note.id !== note.forum || !id)) {
        redirectPath = redirectForum(note.forum)
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
        redirectPath = redirectForum(redirectNote.id)
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
          redirectPath = redirectForum(redirectNote.id)
          return { redirectPath }
        }

        // Redirect to login, unless request is from a Google crawler
        if (!token && !userAgent.includes('Googlebot')) {
          redirectPath = `/login?redirect=/forum?${encodeURIComponent(stringify(query))}`
          return { redirectPath }
        }
        return { errorMessage: "You don't have permission to read this forum" }
      }
      return { errorMessage: error.message }
    }
  }

  const {
    forumNote,
    version,
    redirectPath: pathToRedirectTo,
    errorMessage,
  } = await getForumNote()
  if (errorMessage) return <ErrorDisplay message={errorMessage} />
  if (pathToRedirectTo) redirect(pathToRedirectTo)

  // #region Metadata
  const content =
    version === 2
      ? Object.keys(forumNote.content ?? {}).reduce((translatedContent, key) => {
          // eslint-disable-next-line no-param-reassign
          translatedContent[key] = forumNote.content[key].value
          return translatedContent
        }, {})
      : forumNote.content
  const noteInvitation = version === 2 ? forumNote.invitations[0] : forumNote.invitation
  console.log('content', content)

  metadata.title = `${content.title || 'Forum'} | OpenReview`
  metadata.description = content['TL;DR'] || content.abstract || ''
  metadata.openGraph = {}
  metadata.openGraph.title = truncate(content.title, { length: 70, separator: /,? +/ })
  metadata.openGraph.description = truncate(content['TL;DR'] || content.abstract, {
    length: 200,
    separator: /,? +/,
  })
  metadata.openGraph.type = 'article'
  metadata.other = {}

  if (
    noteInvitation.startsWith(process.env.SUPER_USER) ||
    noteInvitation.startsWith('dblp.org')
  ) {
    metadata.other.robots = 'noindex'
  } else {
    if (content.title) {
      metadata.other.citation_title = content.title
    }
    const authors =
      Array.isArray(content.authors) || typeof content.authors === 'string'
        ? [content.authors].flat()
        : []
    authors.forEach((author) => {
      metadata.other.citation_author = author
    })

    const onlineDate = forumNote.odate
      ? new Date(forumNote.odate).toISOString().slice(0, 10).replace(/-/g, '/')
      : null
    const publicationDate = new Date(
      forumNote.pdate || forumNote.cdate || forumNote.tcdate || Date.now()
    )
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '/')
    metadata.other.citation_online_date = onlineDate ?? publicationDate
    if (content.pdf) {
      metadata.other.citation_pdf_url = `https://openreview.net/pdf?id=${forumNote.id}`
    }
    metadata.other.citation_abstract = content.abstract || ''
    const conferenceName = getConferenceName(content._bibtex)
    if (conferenceName) {
      metadata.other.citation_conference_title = conferenceName
    }
    const journalName = version === 2 ? getJournalName(content._bibtex) : null
    if (journalName) {
      metadata.other.citation_journal_title = journalName
    }
    const issn = getIssn(content._bibtex)
    if (issn) {
      metadata.other.citation_issn = issn
    }
  }
  // #endregion
  console.log('metadata', metadata)

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
      <div className={legacyStyles.legacyForum}>
        <LegacyForum
          forumNote={forumNote}
          selectedNoteId={query.noteId}
          selectedInvitationId={query.invitationId}
        />
      </div>
    </CommonLayout>
  )
}
