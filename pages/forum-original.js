import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import truncate from 'lodash/truncate'
import withError from '../components/withError'
import LegacyForumV2 from '../components/forum/LegacyForumV2'
import useQuery from '../hooks/useQuery'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { getConferenceName } from '../lib/utils'
import { getNoteContentValues } from '../lib/forum-utils'
import { referrerLink, venueHomepageLink } from '../lib/banner-links'

const ForumPage = ({ forumNote, appContext }) => {
  const query = useQuery()
  const { setBannerContent, clientJsLoading } = appContext
  const { id, invitations, domain, content, cdate, tcdate, tmdate, pdate } = forumNote
  const convertedContent = getNoteContentValues(content)
  const truncatedTitle = truncate(convertedContent.title, { length: 70, separator: /,? +/ })
  const truncatedAbstract = truncate(convertedContent['TL;DR'] || convertedContent.abstract, {
    length: 200,
    separator: /,? +/,
  })
  const authors =
    Array.isArray(convertedContent.authors) || typeof convertedContent.authors === 'string'
      ? [convertedContent.authors].flat()
      : []
  const creationDate = new Date(cdate || tcdate || Date.now())
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '/')
  const modificationDate = new Date(pdate || tmdate || Date.now())
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '/')
  // eslint-disable-next-line no-underscore-dangle
  const conferenceName = getConferenceName(convertedContent._bibtex)

  // Set banner link
  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      const groupId = domain || invitations[0].split('/-/')[0]
      setBannerContent(venueHomepageLink(groupId))
    }
  }, [forumNote, query])

  // Set correct body class for legacy forum
  useEffect(() => {
    if (forumNote) {
      setTimeout(() => {
        document.getElementById('content').classList.remove('forum')
        document.getElementById('content').classList.add('legacy-forum')
      }, 100)
    }
  }, [forumNote])

  return (
    <>
      <Head>
        <title key="title">{`${convertedContent.title || 'Forum'} | OpenReview`}</title>
        <meta
          name="description"
          content={convertedContent['TL;DR'] || convertedContent.abstract || ''}
        />

        <meta property="og:title" key="og:title" content={truncatedTitle} />
        <meta property="og:description" key="og:description" content={truncatedAbstract} />
        <meta property="og:type" key="og:type" content="article" />

        {/* For more information on required meta tags for Google Scholar see: */}
        {/* https://scholar.google.com/intl/en/scholar/inclusion.html#indexing */}
        {invitations[0].startsWith(`${process.env.SUPER_USER}`) ? (
          <meta name="robots" content="noindex" />
        ) : (
          <>
            {convertedContent.title && (
              <meta name="citation_title" content={convertedContent.title} />
            )}
            {authors.map((author) => (
              <meta key={author} name="citation_author" content={author} />
            ))}
            <meta name="citation_publication_date" content={modificationDate} />
            <meta name="citation_online_date" content={creationDate} />
            {convertedContent.pdf && (
              <meta name="citation_pdf_url" content={`https://openreview.net/pdf?id=${id}`} />
            )}
            {conferenceName && (
              <meta name="citation_conference_title" content={conferenceName} />
            )}
          </>
        )}
      </Head>

      <LegacyForumV2
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
    const { notes } = await api.get(
      '/notes',
      {
        id: ctx.query.id,
        trash: true,
        details: 'replyCount,writable,signatures,invitation,presentation',
      },
      { accessToken: token, version: 2 }
    )

    const note = notes?.length > 0 ? notes[0] : null

    // Only super user can see deleted forums
    if (!note || (note.ddate && !note.details.writable)) {
      return { statusCode: 404, message: 'Not Found' }
    }

    const redirect = await shouldRedirect(note.id)
    if (redirect) {
      return redirectForum(redirect.id)
    }
    return { forumNote: note }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      const redirect = await shouldRedirect(ctx.query.id)
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
