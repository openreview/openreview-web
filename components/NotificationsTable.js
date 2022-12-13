/* globals DOMPurify, marked: false */

import { useState, useEffect } from 'react'
import upperFirst from 'lodash/upperFirst'
import Table from './Table'
import Collapse from './Collapse'
import { formatDateTime, prettyId } from '../lib/utils'

export default function NotificationsTable({ messages, markViewed }) {
  if (!messages) return null

  return (
    <Table
      className="messages-table"
      headings={[
        { id: 'details', content: 'Message Details' },
      ]}
    >
      {messages.length > 0 ? (
        messages.map((m) => <MessageRow key={m.id} message={m} markViewed={markViewed} />)
      ) : (
        <tr>
          <td>
            <p className="empty-message text-center">No messages found</p>
          </td>
        </tr>
      )}
    </Table>
  )
}

function MessageRow({ message, markViewed }) {
  return (
    <tr>
      <td className={message.vdate ? 'viewed' : null}>
        <div className="clearfix">
          {message.referrer && (
            <div className="email-parent pull-left mr-3">
              To:{' '}
              <a
                href={`/group?id=${encodeURIComponent(message.referrer)}`}
                className="profile-link"
                target="_blank"
                rel="noreferrer"
              >
                {prettyId(message.referrer)}
              </a>
            </div>
          )}
          <div className="email-to pull-left mr-3">
            <span
              className={`status ${message.status === 'delivered' ? 'delivered' : 'not-delivered'}`}
            >
              {upperFirst(message.status)}
            </span>
            {message.vdate && (
              <span>, Viewed</span>
            )}
          </div>
          <div className="email-sent pull-right">
            {(message.timestamp || message.cdate) ? (
              <span>{formatDateTime(message.timestamp * 1000 || message.cdate)}</span>
            ) : 'Not Sent'}
          </div>
        </div>

        <div className="email-title">
          <h4>{message.content?.subject || 'No Subject'}</h4>
        </div>

        <Collapse
          showLabel="Show Message"
          hideLabel="Hide Message"
          onExpand={() => {
            markViewed(message.id)
          }}
        >
          <MessageContent content={message.content?.text} />
        </Collapse>
      </td>
    </tr>
  )
}

function MessageContent({ content = '' }) {
  const [sanitizedHtml, setSanitizedHtml] = useState(null)

  useEffect(() => {
    const htmlContent = content.startsWith('<p>') ? content : marked(content)
    setSanitizedHtml(DOMPurify.sanitize(htmlContent))
  }, [])

  if (!sanitizedHtml) return null

  return (
    // eslint-disable-next-line react/no-danger
    <div
      className="markdown-rendered"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
