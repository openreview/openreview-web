/* globals DOMPurify: false */
/* globals marked: false */

import { useState, useEffect } from 'react'
import union from 'lodash/union'
import { prettyField, prettyContentValue, orderReplyFields } from '../lib/utils'
import Icon from './Icon'

function NoteContent({
  id, content, invitation, omit = [], isReference = false,
}) {
  const contentKeys = Object.keys(content)
  const contentOrder = invitation
    ? union(orderReplyFields(invitation.reply.content || {}, invitation.id), contentKeys)
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

        const invitationField = invitation?.reply.content[fieldName] ?? {}

        return (
          <li key={fieldName}>
            <NoteContentField name={fieldName} />
            {' '}
            {fieldValue.startsWith('/attachment/') ? (
              <span className="note-content-value">
                <DownloadLink noteId={id} fieldName={fieldName} fieldValue={fieldValue} isReference={isReference} />
              </span>
            ) : (
              <NoteContentValue content={fieldValue} enableMarkdown={invitationField.markdown} />
            )}
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

function NoteContentValue({ content = '', enableMarkdown }) {
  const [sanitizedHtml, setSanitizedHtml] = useState(null)

  useEffect(() => {
    if (enableMarkdown) {
      setSanitizedHtml(DOMPurify.sanitize(marked(content)))
    }
  }, [])

  return (enableMarkdown && sanitizedHtml) ? (
    // eslint-disable-next-line react/no-danger
    <div className="note-content-value markdown-rendered" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  ) : (
    <span className="note-content-value">
      {content}
    </span>
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

export const NoteContentV2 = ({
  id, content, invitation, omit = [], isReference = false,
}) => {
  return 'todo'
}

export default NoteContent
