/* eslint-disable no-underscore-dangle */
import { headers } from 'next/headers'
import { pickBy, truncate } from 'lodash'
import api from '../../../lib/api-client'
import serverAuth from '../../auth'
import { getConferenceName, getIssn, getJournalName } from '../../../lib/utils'
import Forum from '../../../components/forum/Forum'
import styles from '../Forum.module.scss'
import CommonLayout from '../../CommonLayout'
import { referrerLink, venueHomepageLink } from '../../../lib/banner-links'
import Banner from '../../../components/Banner'
import ErrorDisplay from '../../../components/ErrorDisplay'

const fallbackMetadata = { title: 'Forum | OpenReview' }

// #region data fetching
const getForumNote = async (token, paperhash, remoteIpAddress) => {
  try {
    const result = await api.get(
      '/notes',
      {
        paperhash,
        details: 'writable',
      },
      { accessToken: token, remoteIpAddress }
    )
    const note = result.notes?.[0]
    if (!note || (note.ddate && !note.details?.writable)) {
      throw new Error(`paperhash ${paperhash} is not found`)
    }

    return { forumNote: note }
  } catch (error) {
    return { errorMessage: error.message }
  }
}
// #endregion

export async function generateMetadata({ params }) {
  const { paperhash: rawPaperhash } = await params

  let paperhash = Array.isArray(rawPaperhash) ? rawPaperhash.join('/') : rawPaperhash
  try {
    paperhash = decodeURIComponent(paperhash)
  } catch {
    paperhash = rawPaperhash
  }
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const { token } = await serverAuth()

  try {
    const { forumNote, errorMessage } = await getForumNote(token, paperhash, remoteIpAddress)
    if (errorMessage) return fallbackMetadata

    // #region Metadata
    const metaData = {}
    const content = Object.keys(forumNote.content ?? {}).reduce((translatedContent, key) => {
      // eslint-disable-next-line no-param-reassign
      translatedContent[key] = forumNote.content[key].value
      return translatedContent
    }, {})
    const noteInvitation = forumNote.invitations[0]

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
      noteInvitation.startsWith('dblp.org')
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
      const journalName = getJournalName(content._bibtex)
      if (journalName) {
        metaData.other.citation_journal_title = journalName
      }
      const issn = getIssn(content._bibtex)
      if (issn) {
        metaData.other.citation_issn = issn
      }
      const doiExternalId = forumNote.externalIds?.find((id) => id.startsWith('doi:'))
      if (doiExternalId) {
        metaData.other.citation_doi = doiExternalId.slice(4)
      }
    }
    // #endregion
    return metaData
  } catch (error) {
    return fallbackMetadata
  }
}

export default async function page({ params, searchParams }) {
  const { paperhash: rawPaperhash } = await params

  let paperhash = Array.isArray(rawPaperhash) ? rawPaperhash.join('/') : rawPaperhash
  try {
    paperhash = decodeURIComponent(paperhash)
  } catch {
    paperhash = rawPaperhash
  }

  const query = await searchParams
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const { token } = await serverAuth()
  const { referrer } = query

  const { forumNote, errorMessage } = await getForumNote(token, paperhash, remoteIpAddress)
  if (errorMessage) return <ErrorDisplay message={errorMessage} />

  const content = Object.keys(forumNote.content ?? {}).reduce((translatedContent, key) => {
    // eslint-disable-next-line no-param-reassign
    translatedContent[key] = forumNote.content[key].value
    return translatedContent
  }, {})
  const noteInvitation = forumNote.invitations[0]

  let banner
  if (referrer) {
    banner = referrerLink(referrer)
  } else {
    const groupId = noteInvitation.split('/-/')[0]
    banner = venueHomepageLink(groupId)
  }

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
