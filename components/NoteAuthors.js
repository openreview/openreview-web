import uniqBy from 'lodash/uniqBy'
import zip from 'lodash/zip'
import Link from 'next/link'
import { prettyId } from '../lib/utils'

const NoteAuthors = ({
  authors, authorIds, signatures, original,
}) => {
  let authorsList
  if (authors && authors.length) {
    // TODO: use original authors if available
    authorsList = zip(authors, authorIds || [])
  } else if (signatures && signatures.length) {
    authorsList = signatures.map(id => ([prettyId(id), id]))
  } else {
    authorsList = []
  }
  // Make sure authors aren't repeated
  authorsList = uniqBy(authorsList, authorInfo => `${authorInfo[0]} ${authorInfo[1]}`)

  return authorsList.map(([author, authorId]) => {
    if (!author) return null
    if (!authorId) return author

    let param
    if (authorId.indexOf('~') === 0) {
      param = 'id'
    } else if (authorId.includes('@')) {
      param = 'email'
    }
    if (!param) return author

    return (
      <Link key={`${author} ${authorId}`} href={`/profile?${param}=${encodeURIComponent(authorId)}`}>
        <a title={authorId} data-toggle="tooltip" data-placement="top">
          {author}
        </a>
      </Link>
    )
  }).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)
}

export default NoteAuthors
