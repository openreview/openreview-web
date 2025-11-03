/* globals $: false */
import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'
import zip from 'lodash/zip'
import Link from 'next/link'
import ExpandableList from './ExpandableList'
import Icon from './Icon'
import { prettyId } from '../lib/utils'

const maxAuthorsToShow = 20

const NoteAuthors = ({ authors, authorIds, signatures, original }) => {
  // Use original note authors if available
  let displayAuthors
  let displayAuthorIds
  let showPrivateLabel
  if (original?.content?.authors && !isEqual(authors, original.content.authors)) {
    displayAuthors = original.content.authors
    displayAuthorIds = original.content.authorids || []
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

  const authorsLinks = authorsList.map(([author, authorId]) => {
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
        title={authorId}
        data-toggle="tooltip"
        data-placement="top"
      >
        {author}
      </Link>
    )
  })

  return (
    <ExpandableList
      items={authorsLinks}
      maxItems={maxAuthorsToShow}
      expandLabel={`et al. (${
        authorsLinks.length - maxAuthorsToShow
      } additional authors not shown)`}
      collapseLabel="(hide authors)"
    >
      {showPrivateLabel && (
        <span key="private-author-label" className="private-author-label">
          (privately revealed to you)
        </span>
      )}
    </ExpandableList>
  )
}

export const NoteAuthorsV2 = ({ authors, authorIds, signatures, noteReaders }) => {
  let showPrivateLabel = false
  const sortedReaders = noteReaders ? [...noteReaders].sort() : []
  if (Array.isArray(authorIds?.readers) && !isEqual(sortedReaders, authorIds.readers.sort())) {
    showPrivateLabel = !authorIds.readers.includes('everyone')
  }

  let authorsList
  if (!authorIds) {
    // object authors
    authorsList = authors.value?.map((p) => [p.fullname, p.username])
  } else if (authors?.value?.length > 0) {
    authorsList = zip(authors?.value, authorIds?.value || [])
  } else if (signatures?.length > 0) {
    authorsList = signatures.map((id) => [prettyId(id), id])
  } else {
    authorsList = []
  }

  // Make sure authors aren't repeated
  authorsList = uniqBy(authorsList, (authorInfo) => `${authorInfo[0]} ${authorInfo[1]}`)

  const authorsLinks = authorsList.map(([author, authorId]) => {
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
        title={authorId}
        data-toggle="tooltip"
        data-placement="top"
      >
        {author}
      </Link>
    )
  })

  return (
    <ExpandableList
      items={authorsLinks}
      maxItems={maxAuthorsToShow}
      expandLabel={`et al. (${
        authorsLinks.length - maxAuthorsToShow
      } additional authors not shown)`}
      collapseLabel="(hide authors)"
    >
      {showPrivateLabel && (
        <Icon
          key="private-label"
          name="eye-open"
          extraClasses="private-contents-icon"
          tooltip={`Identities privately revealed to ${authorIds?.readers
            ?.map((p) => prettyId(p))
            .join(', ')}`}
        />
      )}
    </ExpandableList>
  )
}

export default NoteAuthors
