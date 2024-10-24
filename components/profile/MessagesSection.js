/* globals promptError: false */
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import Table from '../Table'

const MessagesSection = ({ email, accessToken, rejectMessagesOnly }) => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      const apiRes = await api.get(
        '/messages',
        {
          to: email,
          ...(rejectMessagesOnly && { subject: 'OpenReview profile activation status' }),
          limit: 5,
        },
        { accessToken }
      )

      setMessages(apiRes.messages || [])
    } catch (apiError) {
      promptError(apiError.message)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    if (!email) return
    loadMessages()
  }, [email])

  if (isLoading) {
    return (
      <p className="loading-message">
        <em>Loading...</em>
      </p>
    )
  }

  if (!messages?.length)
    return (
      <p className="empty-message">
        No {rejectMessagesOnly ? 'rejection' : ''} messages found
      </p>
    )
  return (
    <Table
      className="messages-table"
      headings={[
        { id: 'title', content: 'Title', width: '25%' },
        { id: 'details', content: 'Message Details' },
      ]}
    >
      {messages.map((message) => (
        <tr key={message.id} className="message-row">
          <td>
            <div>
              <a
                href={`${process.env.API_V2_URL}/messages?id=${message.id}`}
                className="log-link"
                target="_blank"
                rel="noreferrer"
              >
                {message.content?.subject}
              </a>
            </div>
          </td>
          <td>
            <div>{message.content?.text}</div>
          </td>
        </tr>
      ))}
    </Table>
  )
}

export default MessagesSection
