import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import truncate from 'lodash/truncate'
import withError from '../components/withError'
import Forum from '../components/forum/Forum'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { getConferenceName } from '../lib/utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

const ForumPage = ({ forumNote, appContext }) => {
  const query = useQuery()
  const { setBannerContent, clientJsLoading } = appContext
  const {
    id, invitation, content, cdate, tcdate, tmdate,
  } = forumNote

  const truncatedTitle = truncate(content.title, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(content['TL;DR'] || content.abstract, { length: 200, separator: /,? +/ })
  const authors = (Array.isArray(content.authors) || typeof content.authors === 'string')
    ? [content.authors].flat()
    : []
  const creationDate = new Date(cdate || tcdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  const modificationDate = new Date(tmdate || Date.now()).toISOString().slice(0, 10).replace(/-/g, '/')
  // eslint-disable-next-line no-underscore-dangle
  const conferenceName = getConferenceName(content._bibtex)

  // Set banner link
  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      const groupId = content.venueid
        ? content.venueid
        : forumNote.invitation.split('/-/')[0]
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote, query])

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
        {invitation.startsWith(`${process.env.SUPER_USER}`) ? (
          <meta name="robots" content="noindex" />
        ) : (
          <>
            {content.title && (
              <meta name="citation_title" content={content.title} />
            )}
            {authors.map(author => (
              <meta key={author} name="citation_author" content={author} />
            ))}
            <meta name="citation_publication_date" content={creationDate} />
            <meta name="citation_online_date" content={modificationDate} />
            {content.pdf && (
              <meta name="citation_pdf_url" content={`https://openreview.net/pdf?id=${id}`} />
            )}
            {conferenceName && (
              <meta name="citation_conference_title" content={conferenceName} />
            )}
          </>
        )}
      </Head>

      <Forum
        forumNote={forumNote}
        selectedNoteId={query.noteId}
        selectedInvitationId={query.invitationId}
        clientJsLoading={clientJsLoading}
      />
    </>
  )
}

ForumPage.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Forum ID is required' }
  }

  const { token } = auth(ctx)

  const shouldRedirect = async (noteId) => {
    // Check if user is accessing the original of a blind submission and if so return blind note
    const { notes } = await api.get('/notes', { original: noteId }, { accessToken: token })

    if (notes?.length > 0) {
      return notes[0]
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
    const { notes } = await api.get('/notes', {
      id: ctx.query.id, trash: true, details: 'original,replyCount,writable',
    }, { accessToken: token })

    const note = notes?.length > 0 ? notes[0] : null

    // Only super user can see deleted forums
    if (!note || (note.ddate && !note.details.writable)) {
      return { statusCode: 404, message: 'Not Found' }
    }

    // if blind submission return the forum
    if (note.original) {
      return { forumNote: note }
    }

    const redirect = await shouldRedirect(note.id)
    if (redirect) {
      return redirectForum(redirect.id)
    }
    return { forumNote: note }
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

ForumPage.bodyClass = 'forum'

export default withError(ForumPage)
