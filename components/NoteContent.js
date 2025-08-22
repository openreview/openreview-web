'use client'

/* globals DOMPurify,marked: false */

import { useState, useEffect } from 'react'
import union from 'lodash/union'
import {
  prettyField,
  prettyContentValue,
  orderReplyFields,
  prettyId,
  classNames,
} from '../lib/utils'
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
    <div className="note-content">
      {contentOrder.map((fieldName) => {
        if (omittedFields.includes(fieldName) || fieldName.startsWith('_')) return null

        const fieldValue = prettyContentValue(content[fieldName])
        if (!fieldValue) return null

        const invitationField = invitation?.reply?.content?.[fieldName] ?? {}

        return (
          <div key={fieldName}>
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
          </div>
        )
      })}
    </div>
  )
}

function NoteContentField({ name, customFieldName }) {
  return (
    <strong className="note-content-field disable-tex-rendering">
      {customFieldName ?? prettyField(name)}:
    </strong>
  )
}

export function NoteContentValue({ content = '', enableMarkdown, className }) {
  const [sanitizedHtml, setSanitizedHtml] = useState(null)

  const autoLinkContent = (value) => {
    // Regex based on https://gist.github.com/dperini/729294 modified to not accept FTP urls
    const urlRegex =
      /(?:(?:https?):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*[^.,()"'\s])?/gi
    const profileRegex = /(?:.)?(~[^\d\s]+_[^\d\s]+[0-9]+)/gi

    const intermediate = value.replace(urlRegex, (match) => {
      const url = match.startsWith('https://openreview.net')
        ? match.replace('https://openreview.net', '')
        : match
      return `<a href="${url}" target="_blank" rel="nofollow">${url}</a>`
    })

    return intermediate.replace(profileRegex, (fullMatch, match) => {
      if (fullMatch !== match && fullMatch.charAt(0).match(/\S/)) return fullMatch
      return ` <a href="/profile?id=${match}" target="_blank">${prettyId(match)}</a>`
    })
  }

  useEffect(() => {
    if (enableMarkdown) {
      setSanitizedHtml(DOMPurify.sanitize(marked(content)))
    } else {
      setSanitizedHtml(DOMPurify.sanitize(autoLinkContent(content)))
    }
  }, [enableMarkdown, content])

  if (!sanitizedHtml) {
    return <span className={classNames('note-content-value', className)}>{content}</span>
  }

  return enableMarkdown ? (
    <div
      className={classNames('note-content-value', 'markdown-rendered', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  ) : (
    <span
      className={classNames('note-content-value', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
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
  number,
  presentation,
  noteReaders,
  omit = [],
  include = [],
  isEdit = false,
}) => {
  if (!content) return null

  const contentKeys = Object.keys(content)
  const contentOrder =
    presentation?.length > 0
      ? Array.from(new Set(presentation.map((p) => p.name).concat(contentKeys)))
      : contentKeys

  if (Number.isInteger(number)) {
    contentOrder.push('Submission_Number')
  }

  const omittedFields = [
    'title',
    'authors',
    'authorids',
    'verdict',
    'paperhash',
    'ee',
    'year',
    'venue',
    'venueid',
  ]
    .concat(omit)
    .filter((field) => !include.includes(field))

  return (
    <div className="note-content">
      {contentOrder.map((fieldName, i) => {
        if (omittedFields.includes(fieldName) || fieldName.startsWith('_')) return null

        let rawFieldValue = presentation?.[i]?.description
        if (Array.isArray(rawFieldValue)) {
          rawFieldValue = rawFieldValue.filter(Boolean)
          if (rawFieldValue.length === 0) rawFieldValue = null
        }

        if (!rawFieldValue) {
          rawFieldValue =
            fieldName === 'Submission_Number' ? number : content[fieldName]?.value
        }
        const fieldValue = prettyContentValue(rawFieldValue, presentation?.[i]?.type)

        if (!fieldValue) return null

        const enableMarkdown = presentation?.[i]?.markdown
        const customFieldName = presentation?.[i]?.fieldName
        const fieldReaders = Array.isArray(content[fieldName]?.readers)
          ? content[fieldName].readers.sort()
          : null
        const showPrivateIcon =
          fieldReaders && noteReaders && !noteReaders.every((p, j) => p === fieldReaders[j])

        return (
          <div key={fieldName}>
            <NoteContentField name={fieldName} customFieldName={customFieldName} />{' '}
            {showPrivateIcon && (
              <Icon
                name="eye-open"
                extraClasses="private-contents-icon"
                tooltip={`Privately revealed to ${fieldReaders
                  .map((p) => prettyId(p))
                  .join(', ')}`}
              />
            )}
            {fieldValue.startsWith('/attachment/') || fieldValue.startsWith('/pdf/') ? (
              <span className="note-content-value">
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
          </div>
        )
      })}
    </div>
  )
}

export default NoteContent
