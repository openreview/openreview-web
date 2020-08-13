import union from 'lodash/union'
import { prettyField, prettyContentValue, orderReplyFields } from '../lib/utils'
import Icon from './Icon'

function NoteContent({
  id, content, invitation, omit = [], isReference = false,
}) {
  const contentKeys = Object.keys(content)
  const contentOrder = invitation
    ? union(orderReplyFields(invitation?.reply?.content || {}, invitation.id), contentKeys)
    : contentKeys

  const omittedFields = [
    'title', 'authors', 'author_emails', 'authorids', 'pdf',
    'verdict', 'paperhash', 'ee', 'html', 'year', 'venue', 'venueid',
  ].concat(omit)

  return (
    <ul className="list-unstyled note-content">
      {contentOrder.map((fieldName) => {
        if (omittedFields.includes(fieldName) || fieldName.startsWith('_')) return null

        const fieldValue = prettyContentValue(content[fieldName])
        if (!fieldValue) return null

        return (
          <li key={fieldName}>
            <NoteContentField name={fieldName} />
            {' '}
            <span className="note-content-value">
              {fieldValue.startsWith('/attachment/') ? (
                <DownloadLink noteId={id} fieldName={fieldName} fieldValue={fieldValue} isReference={isReference} />
              ) : (
                fieldValue
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function NoteContentField({ name }) {
  return (
    <strong className="note-content-field">
      {prettyField(name)}
      :
    </strong>
  )
}

function DownloadLink({
  noteId, fieldName, fieldValue, isReference,
}) {
  const fileExtension = fieldValue.split('.').pop()
  const urlPath = isReference ? '/references/attachment' : '/attachment'
  const href = `${urlPath}?id=${noteId}&name=${fieldName}`

  return (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a href={href} className="attachment-download-link" title={`Download ${prettyField(fieldName)}`} target="_blank">
      <Icon name="download-alt" />
      {' '}
      {fileExtension}
    </a>
  )
}

export default NoteContent
