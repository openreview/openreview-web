/* globals $: false */
/* globals Handlebars: false */

import { useState, useEffect, useRef } from 'react'
import _ from 'lodash'
import Head from 'next/head'
import Router from 'next/router'
import Table from '../components/Table'
import ErrorAlert from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import { auth } from '../lib/auth'
import api from '../lib/api-client'
import { formatTimestamp } from '../lib/utils'

import '../styles/pages/message.less'

const MessageRow = ({ message, index }) => (
  <tr key={message.id}>
    <td>
      <span className={`status ${message.status === 'delivered' ? 'delivered' : 'not-delivered'}`}>
        {message.status}
      </span>
    </td>
    <td>
      <div className="clearfix">
        <div className="email-to pull-left">
          To:
          <span>{message.content?.to}</span>
        </div>
        <div className="email-sent pull-right">
          Sent:
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
      <div className="email-title">
        <strong>{message.content?.subject}</strong>
      </div>
      <div role="button" tabIndex={index} className="email-content collapsed" onClick={e => e.currentTarget.classList.toggle('collapsed')} onKeyDown={e => e.currentTarget.classList.toggle('collapsed')}>
        <p>{message.content?.text}</p>
        <div className="gradient-overlay" />
      </div>
      <div>
        <a href={`/messages?id=${message.id}`} target="_blank" rel="noreferrer" className="log-link">Message Log</a>
      </div>
    </td>
  </tr>
)

const MessagesTable = ({ messages }) => (
  <Table headings={[{ content: 'Status', width: '96px' }, { content: 'Message Details' }]}>
    {messages.length !== 0 && messages.map((m, i) => (<MessageRow message={m} index={i} />))}
  </Table>
)

const FilterForm = ({ handleSearchParamChange }) => (
  <form className="filter-controls form-inline text-center well">
    {/* <div className="form-group">
      <label>Status:</label>
      <MultiSelectorDropdown
        filters={statusSearchFilters}
        handleSelectChange={handleSearchParamChange}
        parentId="status-search-dropdown"
      />
    </div> */}
    <div className="form-group">
      <label htmlFor="subject-search-input">Subject:</label>
      <input type="text" id="subject-search-input" className="form-control" placeholder="Message subject" onChange={e => handleSearchParamChange(e.target.id, e.target.value)} />
    </div>
    <div className="form-group">
      <label htmlFor="to-search-input">To:</label>
      <input type="text" id="to-search-input" className="form-control" placeholder="To address" onChange={e => handleSearchParamChange(e.target.id, e.target.value)} />
    </div>
  </form>
)

const Message = ({ accessToken, appContext }) => {
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)
  const { setBannerHidden, clientJsLoading } = appContext
  const [searchParams, setSearchParams] = useState({
    limit: 20,
    status: '',
    subject: '',
    to: '',
    offset: 0,
  })

  const handleSearchParamChange = _.debounce((id, value) => {
    const valueTrimmed = typeof value === 'string' ? value.trim() : ''
    const updatedParams = { ...searchParams }
    let shouldUpdateSearchParams = true
    switch (id) {
      case 'subject-search-input':
        updatedParams.subject = valueTrimmed ? `${valueTrimmed}.*` : ''
        break
      case 'status-search-dropdown':
        updatedParams.status = value
        break
      case 'to-search-input':
        updatedParams.to = valueTrimmed
        if (valueTrimmed && !valueTrimmed.includes('@')) {
          // don't update when typing email before @
          shouldUpdateSearchParams = false
        }
        break
      default:
        break
    }

    if (shouldUpdateSearchParams) {
      updatedParams.offset = 0
      setSearchParams(updatedParams)
    }
  }, 500)

  const loadMessages = async () => {
    try {
      const apiRes = await api.get('/messages', searchParams, { accessToken })
      setMessages(apiRes.messages)
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [searchParams])

  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!messages) {
    return <LoadingSpinner />
  }

  return (
    <div>

      <Head>
        <title key="title">Message Viewer | OpenReview</title>
      </Head>

      <header>
        <h1 className="text-center">Message Viewer</h1>
      </header>

      <FilterForm handleSearchParamChange={handleSearchParamChange} />

      <MessagesTable messages={messages} />

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
