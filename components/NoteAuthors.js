import zip from 'lodash/zip'
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
      <a
        href={`/profiles?${param}=${encodeURIComponent(authorId)}`}
        data-toggle="tooltip"
        data-placement="top"
        title={authorId}
        key={authorId}
      >
        {author}
      </a>
    )
  }).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)
}

export default NoteAuthors
