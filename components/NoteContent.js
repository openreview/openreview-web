import isEmpty from 'lodash/isEmpty'
import { prettyField, prettyContentValue } from '../lib/utils'

const NoteContent = ({ content, exclude = [] }) => {
  const omittedFields = [
    'body', 'title', 'authors', 'author_emails', 'authorids', 'pdf',
    'verdict', 'paperhash', 'ee', 'html', 'year', 'venue', 'venueid',
  ]

  return (
    <ul className="list-unstyled note-content">
      {Object.keys(content).map((fieldName) => {
        if (omittedFields.includes(fieldName)
          || exclude.includes(fieldName)
          || fieldName.startsWith('_')
          || isEmpty(content[fieldName])) {
          return null
        }

        return (
          <li key={fieldName}>
            <strong className="note-content-field">
              {prettyField(fieldName)}
              :
            </strong>
            {' '}
            <span className="note-content-value">
              {prettyContentValue(content[fieldName])}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default NoteContent
