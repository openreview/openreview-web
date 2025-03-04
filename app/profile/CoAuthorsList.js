'use client'

import Link from 'next/link'
import { useState } from 'react'

const authorLink = ({ name, id, email }) => {
  if (id) return <Link href={`/profile?id=${id}`}>{name}</Link>
  if (email) {
    return email.startsWith('https://dblp.org') ? (
      <a href={email} target="_blank" rel="noopener noreferrer">
        {name}
      </a>
    ) : (
      <Link href={`/profile?email=${email}`}>{name}</Link>
    )
  }
  return <span>{name}</span>
}

export default function CoAuthorsList({ coAuthors }) {
  const [visibleCoAuthors, setVisibleCoAuthors] = useState(coAuthors.slice(0, 25))

  const handleViewAllClick = (e) => {
    e.preventDefault()
    setVisibleCoAuthors(coAuthors)
  }

  return visibleCoAuthors.length > 0 ? (
    <>
      <ul className="list-unstyled">
        {visibleCoAuthors.map((author) => (
          <li key={`${author.name}${author.id || author.email}`}>{authorLink(author)}</li>
        ))}
      </ul>

      {coAuthors.length > visibleCoAuthors.length && (
        <a href="#" onClick={handleViewAllClick} role="button">
          View all {coAuthors.length} co-authors
        </a>
      )}
    </>
  ) : (
    <p className="empty-message">No co-authors</p>
  )
}
