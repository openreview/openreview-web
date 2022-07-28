import { useState } from 'react'
import { prettyField, prettyContentValue } from '../../lib/utils'

export default function NoteContent({ id, content, collapse }) {
  const omittedContentFields = [
    'body',
    'title',
    'authors',
    'author_emails',
    'authorids',
    'pdf',
    'verdict',
    'paperhash',
    'ee',
    'html',
    'year',
    'venue',
    'venueid',
  ]
  const collapseId = `${id}-details-${Math.floor(Math.random() * 1000)}`

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="note-content">
      <a
        href={`#${collapseId}`}
        className="note-contents-toggle"
        role="button"
        data-toggle="collapse"
        aria-expanded="false"
        onClick={(e) => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide' : 'Show'} details
      </a>

      <div id={collapseId} className="collapse">
        <ul className="list-unstyled note-content-list">
          {Object.keys(content).map((fieldName) => {
            if (
              omittedContentFields.includes(fieldName) ||
              fieldName.startsWith('_') ||
              !content[fieldName]
            ) {
              return null
            }

            return (
              <li key={fieldName}>
                <strong className="note-content-field">{`${prettyField(fieldName)}:`}</strong>{' '}
                <span className="note-content-value">
                  {prettyContentValue(content[fieldName])}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
