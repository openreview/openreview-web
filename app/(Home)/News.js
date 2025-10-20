'use client'

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

export default function News({ news }) {
  if (!news?.length) return null
  return (
    <section id="news">
      <h1>News</h1>
      <hr className="small" />
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
      <button type="button" className="btn-link">
        <a
          href={`/group?id=${process.env.SUPER_USER}/News`}
          target="_blank"
          rel="nofollow noreferrer"
        >
          View all OpenReview news
        </a>
      </button>
    </section>
  )
}
