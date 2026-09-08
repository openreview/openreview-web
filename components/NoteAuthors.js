import { Tooltip } from 'antd'
import isEqual from 'lodash/isEqual'
import uniqBy from 'lodash/uniqBy'
import zip from 'lodash/zip'
import Link from 'next/link'
import { getUniqueInstitutions } from '../lib/forum-utils'
import { prettyId } from '../lib/utils'
import ExpandableList from './ExpandableList'
import Icon from './Icon'

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

export const NoteAuthorsV2 = ({
  authors: authorsProp,
  authorIds: authorIdsProp,
  signatures,
  noteReaders,
  showAuthorInstitutions,
  officialInstitutions,
}) => {
  if (showAuthorInstitutions && authorsProp?.value && !authorIdsProp?.value) {
    return (
      <NoteAuthorsWithInstitutions
        authors={authorsProp}
        noteReaders={noteReaders}
        officialInstitutions={officialInstitutions}
      />
    )
  }

  // forum note pass raw authors (for NoteAuthorsWithInstitutions)
  // note list pass string array
  const authors = authorsProp?.value ?? authorsProp
  const authorIds = authorIdsProp?.value ?? authorIdsProp

  let showPrivateLabel = false
  const sortedReaders = noteReaders ? [...noteReaders].sort() : []
  if (
    Array.isArray(authorIdsProp?.readers) &&
    !isEqual(sortedReaders, authorIdsProp.readers.sort())
  ) {
    showPrivateLabel = !authorIdsProp.readers.includes('everyone')
  }

  let authorsList
  if (authors?.length > 0) {
    authorsList = zip(authors, authorIds || [])
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
          tooltip={`Identities privately revealed to ${authorIdsProp?.readers
            ?.map((p) => prettyId(p))
            .join(', ')}`}
        />
      )}
    </ExpandableList>
  )
}

export function consolidateInstitutions(authorInstitutions, officialInstitutions) {
  if (!officialInstitutions?.length) return authorInstitutions

  return uniqBy(
    authorInstitutions.map((authorInstitution) => {
      const official = officialInstitutions.find(
        (p) =>
          p.id === authorInstitution.domain || p.domains?.includes(authorInstitution.domain)
      )
      return official
        ? {
            ...authorInstitution,
            name: official.fullname ?? authorInstitution.name,
            domain: official.id,
            domains: official.domains,
          }
        : authorInstitution
    }),
    (p) => p.domain
  )
}

export const NoteAuthorsWithInstitutions = ({
  authors,
  noteReaders,
  officialInstitutions,
}) => {
  let showPrivateLabel = false
  const sortedReaders = noteReaders ? [...noteReaders].sort() : []
  if (Array.isArray(authors?.readers) && !isEqual(sortedReaders, authors.readers.sort())) {
    showPrivateLabel = !authors.readers.includes('everyone')
  }

  if (!authors?.value) return null

  const uniqueInstitutions = consolidateInstitutions(
    getUniqueInstitutions(authors.value),
    officialInstitutions
  )

  const institutionIndexMap = new Map(
    uniqueInstitutions.flatMap((institution, index) =>
      (institution.domains ?? [institution.domain]).map((domain) => [domain, index + 1])
    )
  )

  const authorsLinks = authors.value.map((author) => {
    if (!author) return null
    if (!author.username) return <span key={author.fullname}>{author.fullname}</span>
    if (author.username.startsWith('https://dblp.org')) {
      return (
        <Tooltip key={`${author.fullname} ${author.username}`} title={author.username}>
          <a href={author.username} target="_blank" rel="noopener noreferrer">
            {author.fullname}
          </a>
        </Tooltip>
      )
    }

    const institutionNumbers = [
      ...new Set(
        (author.institutions || [])
          .map((institution) => institutionIndexMap.get(institution?.domain))
          .filter(Boolean)
      ),
    ]

    return (
      <span
        key={`${author.fullname} ${author.username}`}
        className="note-author-with-institutions"
      >
        <Tooltip title={author.username}>
          {author.username.includes('@') ? (
            <span>{author.fullname}</span>
          ) : (
            <Link href={`/profile?id=${encodeURIComponent(author.username)}`}>
              {author.fullname}
            </Link>
          )}
        </Tooltip>
        {institutionNumbers.length > 0 && <sup>{institutionNumbers.join(',')}</sup>}
      </span>
    )
  })

  return (
    <>
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
            tooltip={`Identities privately revealed to ${authors?.readers
              ?.map((p) => prettyId(p))
              .join(', ')}`}
          />
        )}
      </ExpandableList>
      {uniqueInstitutions.length > 0 && (
        <div className="note-authors-institutions">
          {uniqueInstitutions.map((institution) => {
            const institutionIndex = institutionIndexMap.get(institution.domain)
            return (
              <div key={institution.domain}>
                <sup>{institutionIndex}</sup> {institution.name} ({institution.domain})
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default NoteAuthors
