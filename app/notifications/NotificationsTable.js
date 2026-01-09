/* globals DOMPurify, marked: false */

import { useEffect, useState } from 'react'
import { upperFirst } from 'lodash'
import Table from '../../components/Table'
import api from '../../lib/api-client'
import { formatDateTime, prettyId } from '../../lib/utils'
import Collapse from '../../components/Collapse'
import LoadingSpinner from '../../components/LoadingSpinner'
import PaginationLinks from '../../components/PaginationLinks'
import useUser from '../../hooks/useUser'

function MessageRow({ message, markViewed }) {
  const [localMessage, setLocalMessage] = useState(message)
  return (
    <tr>
      <td className={localMessage.vdate ? 'viewed' : null}>
        <div className="clearfix">
          {localMessage.referrer && (
            <div className="email-parent pull-left mr-3">
              To:{' '}
              <a
                href={`/group?id=${encodeURIComponent(localMessage.referrer)}`}
                className="profile-link"
                target="_blank"
                rel="noreferrer"
              >
                {prettyId(localMessage.referrer)}
              </a>
            </div>
          )}
          <div className="email-to pull-left mr-3">
            <span
              className={`status ${
                localMessage.status === 'delivered' ? 'delivered' : 'not-delivered'
              }`}
            >
              Email {upperFirst(localMessage.status)}
            </span>
            {localMessage.vdate && <span>, Viewed</span>}
          </div>
          <div className="email-sent pull-right">
            {localMessage.timestamp || localMessage.cdate ? (
              <span>
                Sent: {formatDateTime(localMessage.timestamp * 1000 || localMessage.cdate)}
              </span>
            ) : (
              'Not Sent'
            )}
          </div>
        </div>

        <div className="email-title">
          <h4
            onClick={(e) => {
              e.preventDefault()
              e.target.parentNode.nextSibling.children[0].click()
            }}
          >
            {localMessage.content?.subject || 'No Subject'}
          </h4>
        </div>

        <Collapse
          showLabel="Show Message"
          hideLabel="Hide Message"
          onExpand={() => {
            if (localMessage.vdate) return
            markViewed(localMessage.id)
            setLocalMessage({ ...localMessage, vdate: Date.now() })
          }}
        >
          <MessageContent content={localMessage.content?.text} />
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
    <div className="markdown-rendered" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  )
}

export default function NotificationsTable({
  toEmail,
  markViewed,
  numUnviewed,
  markAllViewed,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [allMessages, setAllMessages] = useState(null)
  const { token } = useUser()
  const pageSize = 25

  const count = allMessages?.length
  const messages = allMessages?.length
    ? allMessages.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : null

  const headingContent = (
    <>
      <span className="pull-left">Message Details</span>
      <span className="pull-right">
        <button
          className="btn btn-xs"
          title="Mark all messages sent to the selected email as read"
          onClick={markAllViewed}
          disabled={numUnviewed === 0}
        >
          Mark All as Read
        </button>
      </span>
    </>
  )

  const getMessages = async (after) => {
    const result = await api.get(
      '/messages',
      {
        to: toEmail,
        after,
      },
      { accessToken: token }
    )
    setAllMessages((existingMessages) => existingMessages.concat(result.messages || []))
  }

  useEffect(() => {
    if (!toEmail) return
    setAllMessages([])
    getMessages()
  }, [toEmail])

  useEffect(() => {
    if (!allMessages?.length || allMessages.length < 1000) return
    const availablePages = Math.ceil(allMessages.length / pageSize)
    if (currentPage >= availablePages - 5) {
      getMessages(allMessages[allMessages.length - 1].id)
    }
  }, [currentPage])

  if (!allMessages)
    return (
      <Table
        className="messages-table"
        headings={[
          { id: 'details', content: <span className="pull-left">Message Details</span> },
        ]}
      >
        <tr>
          <td>
            <LoadingSpinner />
          </td>
        </tr>
      </Table>
    )

  return (
    <>
      <Table
        className="messages-table"
        headings={[{ id: 'details', content: headingContent }]}
      >
        {messages?.length > 0 ? (
          messages.map((m) => <MessageRow key={m.id} message={m} markViewed={markViewed} />)
        ) : (
          <tr>
            <td>
              <p className="empty-message text-center">No messages found</p>
            </td>
          </tr>
        )}
      </Table>
      <PaginationLinks
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={pageSize}
        totalCount={count}
      />
    </>
  )
}
