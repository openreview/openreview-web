/* eslint-disable jsx-a11y/anchor-is-valid */

import { useState } from 'react'
import zip from 'lodash/zip'

export default function NoteAuthors({ authors, authorIds, original, max }) {
  const showOriginalAuthors = original && original.content
  const authorNameIdPairs = showOriginalAuthors
    ? zip(original.content.authors, original.content.authorids)
    : zip(authors, authorIds)

  const [isExpanded, setIsExpanded] = useState(false)

  const buildAuthorLink = ([name, id]) => {
    if (!id) {
      return <span key={name}>{name}</span>
    }

    let profileUrl
    if (id.indexOf('~') === 0) {
      profileUrl = `/profile?id=${encodeURIComponent(id)}`
    } else if (id && id.indexOf('@') !== -1) {
      profileUrl = `/profile?email=${encodeURIComponent(id)}`
    }
    return (
      <a
        key={id}
        href={profileUrl}
        className="profile-link"
        target="_blank"
        rel="noreferrer"
        data-toggle="tooltip"
        data-placement="top"
        title={id}
      >
        {name}
      </a>
    )
  }

  const numAuthors = authorNameIdPairs.length
  const cutoff = max - 1
  let authorLinks = authorNameIdPairs.map(buildAuthorLink)
  let authorLinksOverflow
  if (numAuthors > max) {
    authorLinksOverflow = authorLinks.slice(cutoff)
    authorLinks = authorLinks.slice(0, cutoff)
    if (!isExpanded) {
      authorLinks.push(
        <a
          key="show-all-authors"
          href="#"
          className="show-all-authors"
          onClick={(e) => {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }}
        >
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}+{' '}
          {numAuthors - cutoff} More
        </a>
      )
    }
  }

  return (
    <div className="note-authors">
      {authorLinks.reduce((prev, curr) => [prev, ', ', curr], [])}

      {authorLinksOverflow && (
        <span style={{ display: isExpanded ? 'inline' : 'none' }}>
          {authorLinksOverflow.reduce((prev, curr) => [prev, ', ', curr], '')}
        </span>
      )}

      {showOriginalAuthors && (
        <span className="private-author-label">(privately revealed)</span>
      )}
    </div>
  )
}
