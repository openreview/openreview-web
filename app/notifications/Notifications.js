'use client'

import { use, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Table from '../../components/Table'
import NotificationsTable from './NotificationsTable'
import api from '../../lib/api-client'
import { decrementNotificationCount } from '../../notificationSlice'

export default function Notifications({
  unviewedMessagesCountsP,
  confirmedEmails,
  defaultToEmail,
}) {
  const [toEmail, setToEmail] = useState(defaultToEmail)
  const initialUnviewedCounts = use(unviewedMessagesCountsP)
  const [unviewedCounts, setUnviewedCounts] = useState(initialUnviewedCounts)
  const { token } = useSelector((state) => state.root)
  const dispatch = useDispatch()

  const markAllViewed = async () => {
    try {
      const apiRes = await api.get(
        '/messages',
        { to: toEmail, viewed: false },
        { accessToken: token }
      )
      if (!apiRes.messages?.length) return

      const unreadMessageIds = apiRes.messages.map((m) => m.id)
      await api.post(
        '/messages/viewed',
        { ids: unreadMessageIds, vdate: Date.now() },
        { accessToken: token }
      )

      setUnviewedCounts({
        ...unviewedCounts,
        [toEmail]: unviewedCounts[toEmail] - unreadMessageIds.length,
      })
      dispatch(decrementNotificationCount(unreadMessageIds.length))
    } catch (apiError) {
      promptError(apiError.message)
    }
  }
  const markViewed = async (messageId) => {
    const now = Date.now()
    try {
      await api.post(
        '/messages/viewed',
        { ids: [messageId], vdate: now },
        { accessToken: token }
      )
      setUnviewedCounts({
        ...unviewedCounts,
        [toEmail]: unviewedCounts[toEmail] - 1,
      })
      dispatch(decrementNotificationCount(1))
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  return (
    <div className="row">
      <div className="filters-col">
        <Table
          className="filters-table"
          headings={[{ id: 'filters', content: <span>Inboxes</span> }]}
        >
          <tr>
            <td>
              <ul className="nav nav-pills nav-stacked">
                {confirmedEmails.map((email) => (
                  <li
                    key={email}
                    role="presentation"
                    className={toEmail === email ? 'active' : null}
                    onClick={(e) => {
                      setToEmail(email)
                    }}
                  >
                    <a>{email}</a>
                    {unviewedCounts?.[email] > 0 && (
                      <span className="badge badge-light">{unviewedCounts[email]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        </Table>
      </div>
      <div className="messages-col">
        <NotificationsTable
          toEmail={toEmail}
          numUnviewed={unviewedCounts?.[toEmail] ?? 0}
          markViewed={markViewed}
          markAllViewed={markAllViewed}
        />
      </div>
    </div>
  )
}
