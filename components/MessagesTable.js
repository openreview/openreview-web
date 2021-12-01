/* globals DOMPurify: false */

import Table from './Table'
import { formatTimestamp } from '../lib/utils'

const MessageRow = ({ message }) => (
  <tr>
    <td>
      <span className={`status ${message.status === 'delivered' ? 'delivered' : 'not-delivered'}`}>
        {message.status}
      </span>
    </td>

    <td>
      <div className="clearfix">
        <div className="email-to pull-left mr-3">
          To:
          {' '}
          <a
            href={`/profile?email=${encodeURIComponent(message.content?.to)}`}
            className="profile-link"
            target="_blank"
            rel="noreferrer"
          >
            {message.content?.to}
          </a>
        </div>
        {message.referrer && (
          <div className="email-parent pull-left mr-4">
            Parent:
            {' '}
            <a
              href={`/group/edit?id=${encodeURIComponent(message.referrer)}`}
              className="profile-link"
              target="_blank"
              rel="noreferrer"
            >
              {message.referrer}
            </a>
          </div>
        )}
        <div className="email-sent pull-right">
          Sent:
          {' '}
          <span>{formatTimestamp(message.timestamp * 1000)}</span>
        </div>
      </div>

      <div className="email-title">
        <strong>{message.content?.subject}</strong>
      </div>

      <div
        role="button"
        tabIndex="0"
        className={`email-content collapsed ${message.content?.text?.startsWith('<p>') ? 'markdown-rendered' : ''}`}
        onClick={e => e.currentTarget.classList.toggle('collapsed')}
      >
        {/* eslint-disable-next-line react/no-danger */}
        <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content?.text) }} />
        <div className="gradient-overlay" />
      </div>

      <div>
        <a
          href={`${process.env.API_URL}/messages?id=${message.id}`}
          className="log-link"
          target="_blank"
          rel="noreferrer"
        >
          Message Log
        </a>
      </div>
    </td>
  </tr>
)

const MessagesTable = ({ messages }) => {
  if (!messages) return null

  return (
    <Table
      className="messages-table"
      headings={[
        { id: 'status', content: 'Status', width: '96px' },
        { id: 'details', content: 'Message Details' },
      ]}
    >
      {messages.length > 0 ? messages.map(m => (
        <MessageRow key={m.id} message={m} />
      )) : (
        <tr>
          <td colSpan="2"><p className="empty-message text-center">No messages found</p></td>
        </tr>
      )}
    </Table>
  )
}

export default MessagesTable
