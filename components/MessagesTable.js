/* globals $: false */
/* globals Handlebars: false */

import Table from './Table'
import { formatTimestamp } from '../lib/utils'

import '../styles/pages/message.less'

const MessageRow = ({ message }) => (
  <tr>
    <td>
      <span className={`status ${message.status === 'delivered' ? 'delivered' : 'not-delivered'}`}>
        {message.status}
      </span>
    </td>
    <td>
      <div className="clearfix">
        <div className="email-to pull-left">
          To:
          {' '}
          <span>{message.content?.to}</span>
        </div>
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
        className="email-content collapsed"
        onClick={e => e.currentTarget.classList.toggle('collapsed')}
        onKeyDown={e => e.currentTarget.classList.toggle('collapsed')}
      >
        <p>{message.content?.text}</p>
        <div className="gradient-overlay" />
      </div>
      <div>
        <a
          href={`${process.env.API_URL}/messages?id=${message.id}`}
          target="_blank"
          rel="noreferrer"
          className="log-link"
        >
          Message Log
        </a>
      </div>
    </td>
  </tr>
)

const MessagesTable = ({ messages }) => (
  <Table headings={[
    { id: 'status', content: 'Status', width: '96px' },
    { id: 'details', content: 'Message Details' }]}
  >
    {messages?.length !== 0 && messages.map((m, i) => (
      <MessageRow key={m.id} message={m} />
    ))}
  </Table>
)

export default MessagesTable
