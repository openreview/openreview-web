import zip from 'lodash/zip'
import { prettyId } from '../../lib/utils'
import ExpandableList from '../ExpandableList'

export default function NoteAuthors({ authors, authorIds, signatures, original, max }) {
  const showOriginalAuthors = original && original.content
  const authorNameIdPairs = showOriginalAuthors
    ? zip(original.content.authors, original.content.authorids)
    : zip(authors, authorIds)

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

  let authorsLinks = []
  if (authorNameIdPairs.length) {
    authorsLinks = authorNameIdPairs.map(buildAuthorLink)
  } else if (signatures?.length) {
    authorsLinks = signatures.map((p) => buildAuthorLink([prettyId(p)]))
  }

  return (
    <div className="note-authors">
      <ExpandableList
        items={authorsLinks}
        maxItems={max}
        expandLabel={`${authorsLinks.length - max} more`}
      >
        {showOriginalAuthors && (
          <span className="private-author-label">(privately revealed)</span>
        )}
      </ExpandableList>
    </div>
  )
}
