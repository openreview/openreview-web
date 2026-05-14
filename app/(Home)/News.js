'use client'

/* globals promptMessage:false */

import { Button, Divider } from 'antd'
import Cookies from 'universal-cookie'
import { useEffect, useState } from 'react'
import NoteList from '../../components/NoteList'
import { buildNoteUrl, formatDateTime } from '../../lib/utils'
import styles from './Home.module.scss'

const customMetaInfo = (_) => null
const customAuthor = (_) => null
const customTitle = (note) => (
  <div className={styles.newsTitle}>
    <h4>
      <a
        href={buildNoteUrl(null, null, note.content, { usePaperHashUrl: true })}
        target="_blank"
        rel="nofollow noreferrer"
      >
        {note.content.title.value}
      </a>
    </h4>
    <span className={styles.newsDate}>
      {formatDateTime(note.cdate, { hour: undefined, minute: undefined, second: undefined })}
    </span>
  </div>
)

export default function News({ news, showNews: serverShowNews }) {
  const [clientShowNews, setClientShowNews] = useState(serverShowNews)

  const hideNews = () => {
    promptMessage('News section will hidden until there is a new article.')
    const currentTimeStamp = Date.now()
    const cookie = new Cookies(document.cookie)
    cookie.set('hideNewsBeforeTimeStamp', currentTimeStamp, {
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
      sameSite: 'lax',
    })
    setClientShowNews(false)
  }

  useEffect(() => {
    if (!serverShowNews) return

    const cookie = new Cookies(document.cookie)
    cookie.remove('hideNewsBeforeTimeStamp', { path: '/' })
  }, [serverShowNews])

  if (!news?.length || !clientShowNews) return null
  return (
    <section id="news">
      <h1>News</h1>
      <button
        type="button"
        className={styles.closeNewsBtn}
        aria-label="Hide news"
        onClick={hideNews}
      >
        ×
      </button>
      <Divider style={{ marginTop: 0, minWidth: 0 }} />
      <NoteList
        notes={news.map((p) => ({ ...p, version: 2 }))}
        displayOptions={{
          clientRenderingOnly: true,
          openNoteInNewWindow: true,
          replyCount: false,
          customMetaInfo,
          customTitle,
          customAuthor,
        }}
      />
      <Button type="link" style={{ padding: 0, marginTop: 8 }} href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`} target="_blank" rel="nofollow noreferrer">
        View all OpenReview news →
      </Button>
    </section>
  )
}
