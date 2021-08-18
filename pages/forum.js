import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import truncate from 'lodash/truncate'
import LegacyForum from '../components/forum/LegacyForum'
import LegacyForumV2 from '../components/forum/LegacyForumV2'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { getConferenceName } from '../lib/utils'
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

  const isV2Note = forumNote.version === 2
  const noteTitle = isV2Note ? content.title?.value : content.title
  const noteTLDR = isV2Note ? content['TL;DR']?.value : content['TL;DR']
  const noteAbstract = isV2Note ? content.abstract?.value : content.abstract
  const noteAuthors = isV2Note ? content.authors?.value : content.authors
  // eslint-disable-next-line no-underscore-dangle
  const noteBibtex = isV2Note ? content._bibtex?.value : content._bibtex
  const noteVenueid = isV2Note ? content.venueid?.value : content.venueid
  const noteInvitation = isV2Note ? forumNote.invitations[0] : forumNote.invitation
  const notePdf = isV2Note ? content.pdf?.value : content.pdf

  const truncatedTitle = truncate(noteTitle, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(noteTLDR || noteAbstract, { length: 200, separator: /,? +/ })
  const authors = (Array.isArray(noteAuthors) || typeof noteAuthors === 'string')
    ? [noteAuthors].flat()
    : []
  const creationDate = new Date(forumNote.cdate || forumNote.tcdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  const modificationDate = new Date(forumNote.tmdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  // eslint-disable-next-line no-underscore-dangle
  const conferenceName = getConferenceName(noteBibtex)

  // Set banner link
  useEffect(() => {
    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      const groupId = content.venueid || noteInvitation.split('/-/')[0]
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote, query])

  return (
    <>
      <Head>
        <title key="title">{`${noteTitle || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={noteTLDR || noteAbstract || ''} />

        <meta property="og:title" key="og:title" content={truncatedTitle} />
        <meta property="og:description" key="og:description" content={truncatedAbstract} />
        <meta property="og:type" key="og:type" content="article" />

        {/* For more information on required meta tags for Google Scholar see: */}
        {/* https://scholar.google.com/intl/en/scholar/inclusion.html#indexing */}
        {noteInvitation.startsWith(`${process.env.SUPER_USER}`) ? (
          <meta name="robots" content="noindex" />
        ) : (
          <>
            {noteTitle && (
              <meta name="citation_title" content={noteTitle} />
            )}
            {/*
            {authors.map(author => (
              <meta key={author} name="citation_author" content={author} />
            ))}
            */}
            {/* temporary hack to get google scholar to work, revert to above when next.js unique issue is solved */}
            <meta name="citation_authors" content={authors.join('; ')} />
            <meta name="citation_publication_date" content={creationDate} />
            <meta name="citation_online_date" content={modificationDate} />
            {content.pdf && (
              <meta name="citation_pdf_url" content={`https://openreview.net/pdf?id=${forumNote.id}`} />
            )}
            {conferenceName && (
              <meta name="citation_conference_title" content={conferenceName} />
            )}
          </>
        )}
      </Head>

      {forumNote.version === 2 ? (
        <LegacyForumV2
          forumNote={forumNote}
          selectedNoteId={query.noteId}
          selectedInvitationId={query.invitationId}
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
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Forum ID is required' }
  }

  const { token } = auth(ctx)
  const shouldRedirect = async (noteId) => {
    // if it is the original of a blind submission, do redirection
    const blindNotesResult = await api.get('/notes', { original: noteId }, { accessToken: token })

    // if no blind submission found return the current forum
    if (blindNotesResult.notes?.length) {
      return blindNotesResult.notes[0]
    }

    return false
  }
  const redirectForum = (forumId) => {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: `/forum?id=${encodeURIComponent(forumId)}` }).end()
    } else {
      Router.replace(`/forum?id=${forumId}`)
    }
    return {}
  }

  try {
    const note = await api.getNoteById(ctx.query.id, token, {
      trash: true, details: 'original,invitation,replyCount,writable,presentation',
    })

    if (note?.version === 2) {
      return { forumNote: note, query: ctx.query }
    }

    // Only super user can see deleted forums
    if (note?.ddate && !note?.details?.writable) {
      return { statusCode: 404, message: 'Not Found' }
    }

    // if blind submission return the forum
    if (note?.original) {
      return { forumNote: note, query: ctx.query }
    }

    const redirect = await shouldRedirect(ctx.query.id)
    if (redirect) {
      return redirectForum(redirect.id)
    }
    if (!note) {
      return { statusCode: 404, message: 'Not Found' }
    }
    return { forumNote: note, query: ctx.query }
  } catch (error) {
    if (error.name === 'forbidden' || error.name === 'ForbiddenError') {
      const redirect = await shouldRedirect(ctx.query.id)
      if (redirect) {
        return redirectForum(redirect.id)
      }

      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to read this forum' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

ForumPage.bodyClass = 'legacy-forum'

export default withError(ForumPage)
