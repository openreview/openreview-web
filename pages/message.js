/* globals $: false */
/* globals Handlebars: false */

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import Table from '../components/Table'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import { auth } from '../lib/auth'
import api from '../lib/api-client'
import { formatTimestamp } from '../lib/utils'

import '../styles/pages/message.less'

const Message = ({ accessToken, appContext }) => {
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)
  const { setBannerHidden, clientJsLoading } = appContext

  const loadMessages = async () => {
    try {
      const apiRes = await api.get('/messages', {
        limit: 200,
      }, { accessToken })
      setMessages(apiRes.messages)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!messages) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>
      <div>
        <Table headings={[{ content: 'Status', width: '96px' }, { content: 'Message Details' }]}>
          {messages.length !== 0 && messages.map((m, i) => (
            <tr key={m.id}>
              <td>
                <span className={`status ${m.status === 'delivered' ? 'delivered' : 'not-delivered'}`}>
                  {m.status}
                </span>
              </td>
              <td>
                <div className="clearfix">
                  <div className="email-to pull-left">
                    To:
                    <span>{m.content?.to}</span>
                  </div>
                  <div className="email-sent pull-right">
                    Sent:
                    <span>{formatTimestamp(m.timestamp)}</span>
                  </div>
                </div>
                <div className="email-title">
                  <strong>{m.content?.subject}</strong>
                </div>
                <div role="button" tabIndex={i} className="email-content collapsed" onClick={e => e.currentTarget.classList.toggle('collapsed')} onKeyDown={e => e.currentTarget.classList.toggle('collapsed')}>
                  <p>{m.content?.text}</p>
                  <div className="gradient-overlay" />
                </div>
                <div>
                  <a href={`/messages?id=${m.id}`} target="_blank" rel="noreferrer" className="log-link">Message Log</a>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}

Message.getInitialProps = async (ctx) => {
  const { user, token } = auth(ctx)
  if (!user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: '/login' }).end()
    } else {
      Router.replace('/login')
    }
  }
  return { accessToken: token }
}

Message.bodyClass = 'message'

export default Message
