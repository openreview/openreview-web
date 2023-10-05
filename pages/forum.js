import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import truncate from 'lodash/truncate'
import pickBy from 'lodash/pickBy'
import LegacyForum from '../components/forum/LegacyForum'
import Forum from '../components/forum/Forum'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { getConferenceName, getJournalName, getIssn } from '../lib/utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

const ForumPage = ({ forumNote, query, appContext }) => {
  const { clientJsLoading, setBannerContent } = appContext

  let content
  let noteInvitation
  if (forumNote.version === 2) {
    content = Object.keys(forumNote.content).reduce((translatedContent, key) => {
      // eslint-disable-next-line no-param-reassign
      translatedContent[key] = forumNote.content[key].value
      return translatedContent
    }, {})
    noteInvitation = forumNote.invitations[0]
  } else {
    // eslint-disable-next-line prefer-destructuring
    content = forumNote.content
    noteInvitation = forumNote.invitation
  }

  const truncatedTitle = truncate(content.title, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(content['TL;DR'] || content.abstract, {
    length: 200,
    separator: /,? +/,
  })
  const authors =
    Array.isArray(content.authors) || typeof content.authors === 'string'
      ? [content.authors].flat()
      : []
  const onlineDate = new Date(
    forumNote.odate || forumNote.cdate || forumNote.tcdate || Date.now()
  )
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '/')
  const modificationDate = new Date(forumNote.tmdate || Date.now())
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '/')
  // eslint-disable-next-line no-underscore-dangle
  const conferenceName = getConferenceName(content._bibtex)
  // eslint-disable-next-line no-underscore-dangle
  const journalName = forumNote.version === 2 ? getJournalName(content._bibtex) : null
  // eslint-disable-next-line no-underscore-dangle
  const issn = getIssn(content._bibtex)

  // Set banner link
  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      // For now, v2 notes should always use the group from the first invitation, not venueid
      const groupId =
        forumNote.version === 2 || !content.venueid
          ? noteInvitation.split('/-/')[0]
          : content.venueid
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote, query])

  // Set correct body class for new forum
  useEffect(() => {
    if (forumNote.version === 2) {
      setTimeout(() => {
        document.getElementById('content').classList.remove('legacy-forum')
        document.getElementById('content').classList.add('forum')
      }, 100)
    }
  }, [forumNote.version])

  return (
    <>
      <Head>
        <title key="title">{`${content.title || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={content['TL;DR'] || content.abstract || ''} />

        <meta property="og:title" key="og:title" content={truncatedTitle} />
        <meta property="og:description" key="og:description" content={truncatedAbstract} />
        <meta property="og:type" key="og:type" content="article" />

        {/* For more information on required meta tags for Google Scholar see: */}
        {/* https://scholar.google.com/intl/en/scholar/inclusion.html#indexing */}
        {noteInvitation.startsWith(process.env.SUPER_USER) ||
        noteInvitation.startsWith('dblp.org') ? (
          <meta name="robots" content="noindex" />
        ) : (
          <>
            {content.title && <meta name="citation_title" content={content.title} />}
            {authors.map((author) => (
              <meta key={author} name="citation_author" content={author} />
            ))}
            <meta name="citation_publication_date" content={onlineDate} />
            <meta name="citation_online_date" content={modificationDate} />
            {content.pdf && (
              <meta
                name="citation_pdf_url"
                content={`https://openreview.net/pdf?id=${forumNote.id}`}
              />
            )}
            <meta name="citation_abstract" content={content.abstract || ''} />
            {conferenceName && (
              <meta name="citation_conference_title" content={conferenceName} />
            )}
            {journalName && <meta name="citation_journal_title" content={journalName} />}
            {issn && <meta name="citation_issn" content={issn} />}
          </>
        )}
      </Head>

      {forumNote.version === 2 ? (
        <Forum
          forumNote={forumNote}
          selectedNoteId={query.noteId}
          selectedInvitationId={query.invitationId}
          prefilledValues={pickBy(query, (_, key) => key.startsWith('edit.note.'))}
          clientJsLoading={clientJsLoading}
        />
      ) : (
        <LegacyForum
          forumNote={forumNote}
          selectedNoteId={query.noteId}
          selectedInvitationId={query.invitationId}
          clientJsLoading={clientJsLoading}
        />
      )}
    </>
  )
}

ForumPage.getInitialProps = async (ctx) => {
  const queryId = ctx.query.id || ctx.query.noteId
  if (!queryId) {
    return { statusCode: 400, message: 'Forum or note ID is required' }
  }

  const { token } = auth(ctx)
  const shouldRedirect = async (noteId) => {
    // if it is the original of a blind submission, do redirection
    const blindNotesResult = await api.get(
      '/notes',
      { original: noteId },
      { accessToken: token }
    )

    // if no blind submission found return the current forum
    if (blindNotesResult.notes?.length) {
      return blindNotesResult.notes[0]
    }

    return false
  }
  const redirectForum = (forumId) => {
    const noteIdParam = ctx.query.noteId
      ? `&noteId=${encodeURIComponent(ctx.query.noteId)}`
      : ''
    const referrerParam = ctx.query.referrer
      ? `&referrer=${encodeURIComponent(ctx.query.referrer)}`
      : ''
    const redirectUrl = `/forum?id=${encodeURIComponent(
      forumId
    )}${noteIdParam}${referrerParam}`
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: redirectUrl }).end()
    } else {
      Router.replace(redirectUrl)
    }
    return {}
  }

  try {
    const note = await api.getNoteById(queryId, token, {
      trash: true,
      details: 'original,replyCount,writable,signatures,invitation,presentation',
    })

    // Only super user can see deleted forums
    if (note?.ddate && !note?.details?.writable) {
      return { statusCode: 404, message: 'Not Found' }
    }

    // Allows the UI to link to forum pages just using a note ID, that may be a reply
    if (note && note.id !== note.forum) {
      return redirectForum(note.forum)
    }

    if (note?.version === 2) {
      return { forumNote: note, query: ctx.query }
    }

    // if blind submission return the forum
    if (note?.original) {
      return { forumNote: note, query: ctx.query }
    }

    const redirect = await shouldRedirect(queryId)
    if (redirect) {
      return redirectForum(redirect.id)
    }
    if (!note) {
      return { statusCode: 404, message: `The Note ${queryId} was not found` }
    }
    return { forumNote: note, query: ctx.query }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      const redirect = await shouldRedirect(queryId)
      if (redirect) {
        return redirectForum(redirect.id)
      }

      if (!token) {
        if (ctx.req) {
          ctx.res
            .writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` })
            .end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: "You don't have permission to read this forum" }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

ForumPage.bodyClass = 'legacy-forum'

export default withError(ForumPage)
