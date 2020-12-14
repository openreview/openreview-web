import { useEffect, useState } from 'react'
import Head from 'next/head'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'

export default function EmbeddedForum({ appContext, userContext }) {
  const [forumNote, setForumNote] = useState(null)
  const [replyNotes, setReplyNotes] = useState(null)
  const query = useQuery()
  const { user, accessToken } = userContext

  const loadNotes = async (forumId) => {
    const { notes } = await api.get('/notes', {
      forum: forumId, trash: true, details: 'replyCount,writable,revisions,original,overwriting,invitation,tags',
    }, { accessToken })

    if (notes?.length > 0) {
      setReplyNotes(notes.filter(note => note.id !== note.forum))
    } else {
      setReplyNotes([])
    }
  }

  useEffect(() => {
    if (!user || !query) return

    loadNotes(query.id)
  }, [query])

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title key="title">{`${forumNote?.content.title || 'Forum'} | OpenReview`}</title>
        <meta name="description" content={forumNote?.content['TL;DR'] || forumNote?.content.abstract || ''} />

        <meta property="og:title" key="og:title" content={forumNote?.content.truncatedTitle} />
        <meta property="og:description" key="og:description" content={forumNote?.content.truncatedAbstract} />
        <meta property="og:image" key="og:image" content="https://openreview.net/images/openreview_logo_512.png" />
        <meta property="og:type" key="og:type" content="article" />
        <meta property="og:site_name" key="og:site_name" content="OpenReview" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@openreviewnet" />
      </Head>

      <div className="container-fluid">
        <div className="row">
          <div className="col-xs-12">
            <main id="content" className="embed">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
