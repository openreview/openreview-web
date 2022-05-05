/* globals $: false */
import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'
import zip from 'lodash/zip'
import Link from 'next/link'
import { prettyId } from '../lib/utils'
import Icon from './Icon'

const NoteAuthors = ({ authors, authorIds, signatures, original }) => {
  // Use original note authors if available
  let displayAuthors
  let displayAuthorIds
  let showPrivateLabel
  if (original?.content?.authors && !isEqual(authors, original.content.authors)) {
    displayAuthors = original.content.authors
    displayAuthorIds = original.content.authorIds || []
    showPrivateLabel = true
  } else {
    displayAuthors = authors
    displayAuthorIds = authorIds || []
    showPrivateLabel = false
  }

  let authorsList
  if (displayAuthors?.length > 0) {
    authorsList = zip(displayAuthors, displayAuthorIds)
  } else if (signatures?.length > 0) {
    authorsList = signatures.map((id) => [prettyId(id), id])
  } else {
    authorsList = []
  }

  // Make sure authors aren't repeated
  authorsList = uniqBy(authorsList, (authorInfo) => `${authorInfo[0]} ${authorInfo[1]}`)

  const authorsLinks = authorsList
    .map(([author, authorId]) => {
      if (!author) return null
      if (!authorId) {
        return <span key={author}>{author}</span>
      }

      let param
      if (authorId.indexOf('~') === 0) {
        param = 'id'
      } else if (authorId.includes('@')) {
        param = 'email'
      } else if (authorId.startsWith('https://dblp.org')) {
        return (
          <a
            key={`${author} ${authorId}`}
            href={authorId}
            title={authorId}
            data-toggle="tooltip"
            data-placement="top"
            target="_blank"
            rel="noopener noreferrer"
          >
            {author}
          </a>
        )
      } else {
        return <span key={author}>{author}</span>
      }

      return (
        <Link
          key={`${author} ${authorId}`}
          href={`/profile?${param}=${encodeURIComponent(authorId)}`}
        >
          <a
            href={`/profile?${param}=${encodeURIComponent(authorId)}`}
            title={authorId}
            data-toggle="tooltip"
            data-placement="top"
            onClick={() => {
              $('[data-toggle="tooltip"]').tooltip('destroy')
              $('[data-toggle="tooltip"]').tooltip('disable')
            }}
          >
            {author}
          </a>
        </Link>
      )
    })
    .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)

  const privateLabel = (
    <span key="private-author-label" className="private-author-label">
      (privately revealed to you)
    </span>
  )
  return showPrivateLabel ? authorsLinks.concat([' ', privateLabel]) : authorsLinks
}

export const NoteAuthorsV2 = ({ authors, authorIds, signatures, noteReaders }) => {
  let showPrivateLabel = false
  if (authorIds?.readers && !isEqual(noteReaders?.sort(), authorIds?.readers?.sort())) {
    showPrivateLabel = true
  }

  let authorsList
  if (authors?.value?.length > 0) {
    authorsList = zip(authors?.value, authorIds?.value || [])
  } else if (signatures?.length > 0) {
    authorsList = signatures.map((id) => [prettyId(id), id])
  } else {
    authorsList = []
  }

  // Make sure authors aren't repeated
  authorsList = uniqBy(authorsList, (authorInfo) => `${authorInfo[0]} ${authorInfo[1]}`)

  const authorsLinks = authorsList
    .map(([author, authorId]) => {
      if (!author) return null
      if (!authorId) {
        return <span key={author}>{author}</span>
      }

      let param
      if (authorId.indexOf('~') === 0) {
        param = 'id'
      } else if (authorId.includes('@')) {
        param = 'email'
      } else if (authorId.startsWith('https://dblp.org')) {
        return (
          <a
            key={`${author} ${authorId}`}
            href={authorId}
            title={authorId}
            data-toggle="tooltip"
            data-placement="top"
            target="_blank"
            rel="noopener noreferrer"
          >
            {author}
          </a>
        )
      } else {
        return <span key={author}>{author}</span>
      }

      return (
        <Link
          key={`${author} ${authorId}`}
          href={`/profile?${param}=${encodeURIComponent(authorId)}`}
        >
          <a title={authorId} data-toggle="tooltip" data-placement="top">
            {author}
          </a>
        </Link>
      )
    })
    .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)

  const privateLabel = (
    <Icon
      key="private-label"
      name="eye-open"
      extraClasses="private-contents-icon"
      tooltip={`privately revealed to ${authorIds?.readers
        ?.map((p) => prettyId(p))
        .join(', ')}`}
    />
  )
  return showPrivateLabel ? authorsLinks.concat([' ', privateLabel]) : authorsLinks
}

export default NoteAuthors
