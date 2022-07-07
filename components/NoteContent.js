/* globals DOMPurify: false */
/* globals marked: false */

import { useState, useEffect } from 'react'
import union from 'lodash/union'
import { prettyField, prettyContentValue, orderReplyFields, prettyId } from '../lib/utils'
import Icon from './Icon'

function NoteContent({
  id,
  content,
  invitation,
  omit = [],
  include = [],
  isReference = false,
}) {
  const contentKeys = Object.keys(content)
  const contentOrder = invitation
    ? union(orderReplyFields(invitation?.reply?.content || {}, invitation.id), contentKeys)
    : contentKeys

  const omittedFields = [
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
    .concat(omit)
    .filter((field) => !include.includes(field))

  return (
    <ul className="list-unstyled note-content">
      {contentOrder.map((fieldName) => {
        if (omittedFields.includes(fieldName) || fieldName.startsWith('_')) return null

        const fieldValue = prettyContentValue(content[fieldName])
        if (!fieldValue) return null

        const invitationField = invitation?.reply?.content?.[fieldName] ?? {}

        return (
          <li key={fieldName}>
            <NoteContentField name={fieldName} />{' '}
            {fieldValue.startsWith('/attachment/') ? (
              <span className="note-content-value">
                <DownloadLink
                  noteId={id}
                  fieldName={fieldName}
                  fieldValue={fieldValue}
                  isReference={isReference}
                />
              </span>
            ) : (
              <NoteContentValue
                content={fieldValue}
                enableMarkdown={invitationField.markdown}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function NoteContentField({ name }) {
  return <strong className="note-content-field">{prettyField(name)}:</strong>
}

export function NoteContentValue({ content = '', enableMarkdown }) {
  const [sanitizedHtml, setSanitizedHtml] = useState(null)

  useEffect(() => {
    if (enableMarkdown) {
      setSanitizedHtml(DOMPurify.sanitize(marked(content)))
    }
  }, [])

  return enableMarkdown && sanitizedHtml ? (
    // eslint-disable-next-line react/no-danger
    <div
      className="note-content-value markdown-rendered"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  ) : (
    <span className="note-content-value">{content}</span>
  )
}

export function DownloadLink({ noteId, fieldName, fieldValue, isReference, isV2 = false }) {
  const fileExtension = fieldValue.split('.').pop()
  const urlPath = isReference
    ? `${isV2 ? '/notes/edits/attachment' : '/references/attachment'}`
    : '/attachment'
  const href = `${urlPath}?id=${noteId}&name=${fieldName}`

  return (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a
      href={href}
      className="attachment-download-link"
      title={`Download ${prettyField(fieldName)}`}
      target="_blank"
    >
      <Icon name="download-alt" /> {fileExtension}
    </a>
  )
}

export const NoteContentV2 = ({
  id,
  content,
  omit = [],
  include = [],
  isEdit = false,
  presentation,
  noteReaders,
}) => {
  const contentKeys = Object.keys(content)
  const contentOrder = presentation
    ? Object.values(presentation)
        .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999))
        .map((p) => p.name)
    : contentKeys

  const omittedFields = [
    'title',
    'authors',
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
    .concat(omit)
    .filter((field) => !include.includes(field))

  return (
    <ul className="list-unstyled note-content">
      {contentOrder.map((fieldName) => {
        if (omittedFields.includes(fieldName) || fieldName.startsWith('_')) return null

        const fieldValue = prettyContentValue(content[fieldName]?.value)
        if (!fieldValue) return null
        const enableMarkdown = presentation?.find((p) => p.name === fieldName)?.markdown
        const fieldReaders = content[fieldName]?.readers?.sort()
        const showPrivateIcon =
          fieldReaders && noteReaders && !fieldReaders.every((p, i) => p === noteReaders[i])

        return (
          <li key={fieldName}>
            <NoteContentField name={fieldName} />{' '}
            {showPrivateIcon && (
              <Icon
                name="eye-open"
                extraClasses="private-contents-icon"
                tooltip={`privately revealed to ${fieldReaders
                  .map((p) => prettyId(p))
                  .join(', ')}`}
              />
            )}
            {fieldValue.startsWith('/attachment/') ? (
              <span className="note-content-value">
                {/* eslint-disable-next-line max-len */}
                <DownloadLink
                  noteId={id}
                  fieldName={fieldName}
                  fieldValue={fieldValue}
                  isReference={isEdit}
                  isV2
                />
              </span>
            ) : (
              <NoteContentValue content={fieldValue} enableMarkdown={enableMarkdown} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default NoteContent
