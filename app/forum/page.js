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
import ArxivForum from './ArxivForum'

const fallbackMetadata = { title: 'Forum | OpenReview' }

// #region data fetching
const shouldRedirect = async (noteIdParam, accessToken, remoteIpAddress) => {
  try {
    // if it is the original of a blind submission, do redirection
    const blindNotesResult = await api.get(
      '/notes',
      { original: noteIdParam },
      { accessToken, version: 1, remoteIpAddress }
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

const redirectForum = (noteId, forumId, invitationId, referrer) => {
  const noteIdParam = noteId ? `&noteId=${encodeURIComponent(noteId)}` : ''
  const invIdParam = invitationId ? `&invitationId=${encodeURIComponent(invitationId)}` : ''
  const referrerParam = referrer ? `&referrer=${encodeURIComponent(referrer)}` : ''

  return `/forum?id=${encodeURIComponent(forumId)}${noteIdParam}${invIdParam}${referrerParam}`
}
const getForumNote = async (
  token,
  userAgent,
  queryId,
  invitationId,
  query,
  remoteIpAddress
) => {
  let redirectPath = null
  try {
    const note = await api.getNoteById(
      queryId,
      token,
      { trash: true, details: 'writable,presentation' },
      { trash: true, details: 'original,replyCount,writable' },
      remoteIpAddress
    )
    if (note?.ddate && !note?.details?.writable) {
      throw new Error('Not Found')
    }
    // Allows the UI to link to forum pages just using a note ID, that may be a reply
    if (note && (note.id !== note.forum || !query.id)) {
      redirectPath = redirectForum(query.noteId, note.forum, invitationId, query.referrer)
      return { redirectPath }
    }
    if (note?.version === 2) {
      return { forumNote: note, version: 2 }
    }
    // if blind submission return the forum
    if (note?.original) {
      return { forumNote: note, version: 1 }
    }

    const redirectNote = await shouldRedirect(queryId, token, remoteIpAddress)
    if (redirectNote) {
      redirectPath = redirectForum(query.noteId, redirectNote.id, invitationId, query.referrer)
      return { redirectPath }
    }
    if (!note) {
      throw new Error(`The Note ${queryId} was not found`)
    }
    return { forumNote: note, version: 1 }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      const redirectNote = await shouldRedirect(queryId, token, remoteIpAddress)
      if (redirectNote) {
        redirectPath = redirectForum(
          query.noteId,
          redirectNote.id,
          invitationId,
          query.referrer
        )
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
// #endregion

export async function generateMetadata({ searchParams }) {
  const query = await searchParams
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  const remoteIpAddress = headersList.get('x-forwarded-for')
  const { id, noteId, arxivid, invitationId } = query

  const queryId = id || noteId
  if (!queryId || arxivid) return fallbackMetadata

  const { token } = await serverAuth()

  try {
    const {
      forumNote,
      version,
      redirectPath: pathToRedirectTo,
      errorMessage,
    } = await getForumNote(token, userAgent, queryId, invitationId, query, remoteIpAddress)
    if (errorMessage) return fallbackMetadata
    if (pathToRedirectTo) return {}

    // #region Metadata
    const metaData = {}
    const content =
      version === 2
        ? Object.keys(forumNote.content ?? {}).reduce((translatedContent, key) => {
            translatedContent[key] = forumNote.content[key].value
            return translatedContent
          }, {})
        : forumNote.content
    const noteInvitation = version === 2 ? forumNote.invitations[0] : forumNote.invitation

    metaData.title = `${content.title || 'Forum'} | OpenReview`
    metaData.description = content['TL;DR'] || content.abstract || ''
    metaData.openGraph = {}
    metaData.openGraph.title = truncate(content.title, { length: 70, separator: /,? +/ })
    metaData.openGraph.description = truncate(content['TL;DR'] || content.abstract, {
      length: 200,
      separator: /,? +/,
    })
    metaData.openGraph.type = 'article'
    metaData.other = {}

    if (
      noteInvitation.startsWith(process.env.SUPER_USER) ||
      noteInvitation.startsWith('dblp.org') ||
      noteInvitation.startsWith('DBLP.org')
    ) {
      metaData.other.robots = 'noindex'
    } else {
      if (content.title) {
        metaData.other.citation_title = content.title
      }
      const authors =
        Array.isArray(content.authors) || typeof content.authors === 'string'
          ? [content.authors].flat()
          : []
      if (authors.length) {
        metaData.other.citation_author = []
        authors.forEach((author) => {
          metaData.other.citation_author.push(author)
        })
      }

      const onlineDate = forumNote.odate
        ? new Date(forumNote.odate).toISOString().slice(0, 10).replace(/-/g, '/')
        : null
      const publicationDate = new Date(
        forumNote.pdate || forumNote.cdate || forumNote.tcdate || Date.now()
      )
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '/')
      if (onlineDate) {
        metaData.other.citation_online_date = onlineDate
      } else {
        metaData.other.citation_publication_date = publicationDate
      }
      if (content.pdf) {
        metaData.other.citation_pdf_url = `https://openreview.net/pdf?id=${forumNote.id}`
      }
      metaData.other.citation_abstract = content.abstract || ''
      const conferenceName = getConferenceName(content._bibtex)
      if (conferenceName) {
        metaData.other.citation_conference_title = conferenceName
      }
      const journalName = version === 2 ? getJournalName(content._bibtex) : null
      if (journalName) {
        metaData.other.citation_journal_title = journalName
      }
      const issn = getIssn(content._bibtex)
      if (issn) {
        metaData.other.citation_issn = issn
      }
    }
    // #endregion

    return metaData
  } catch (error) {
    return fallbackMetadata
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const { id, noteId, arxivid, invitationId, referrer } = query
  const queryId = id || noteId
  if (!queryId && !arxivid) return <ErrorDisplay message="Forum or note ID is required" />

  if (arxivid) {
    if (!/^\d{4}\.\d{4,}(?:v\d+)?$/.test(arxivid))
      return <ErrorDisplay message={`The Note ${arxivid} was not found`} />
    return <ArxivForum id={arxivid} />
  }

  const { token, user } = await serverAuth()

  const {
    forumNote,
    version,
    redirectPath: pathToRedirectTo,
    errorMessage,
  } = await getForumNote(token, userAgent, queryId, invitationId, query, remoteIpAddress)
  if (errorMessage) return <ErrorDisplay message={errorMessage} />
  if (pathToRedirectTo) redirect(pathToRedirectTo)

  const content =
    version === 2
      ? Object.keys(forumNote.content ?? {}).reduce((translatedContent, key) => {
          translatedContent[key] = forumNote.content[key].value
          return translatedContent
        }, {})
      : forumNote.content
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
