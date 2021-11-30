/* globals DOMPurify,marked,$,promptError,promptMessage: false */
import React, {
  useEffect, useReducer, useRef, useState,
} from 'react'
import Link from 'next/link'
import api from '../../lib/api-client'
import { getGroupVersion, prettyId, urlFromGroupId } from '../../lib/utils'
import BasicModal from '../BasicModal'
import MarkdownPreviewTab from '../MarkdownPreviewTab'
import ProgressBar from '../ProgressBar'
import PaginationLinks from '../PaginationLinks'
import Icon from '../Icon'

const MessageMemberModal = ({
  groupId,
  membersToMessage,
  accessToken,
  setJobId,
}) => {
  const [subject, setSubject] = useState(`Message to ${prettyId(groupId)}`)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)

  const sendMessage = async () => {
    const sanitizedMessage = DOMPurify.sanitize(marked(message))
    if (subject && sanitizedMessage) {
      try {
        const result = await api.post(
          '/messages',
          {
            groups: membersToMessage,
            subject,
            message: sanitizedMessage,
            parentGroup: groupId,
            useJob: true,
          },
          { accessToken },
        )
        setJobId(result.jobId)
        setSubject(`Message to ${prettyId(groupId)}`)
        setMessage('')
        // Save the timestamp in the local storage (used in PC console)
        membersToMessage.forEach(member => localStorage.setItem(`${groupId}|${member}`, Date.now()))
        $('#message-group-members').modal('hide')
        return
      } catch (e) {
        promptError(e.message)
      }
      setError('Email Subject and Body are required to send messages.')
    }
  }
  return (
    <BasicModal
      id="message-group-members"
      title="Message Group Members"
      primaryButtonText="Send Messages"
      onPrimaryButtonClick={sendMessage}
      onClose={() => setMessage('')}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      <p>
        {`Enter a subject and message below.
      Your message will be sent via email to the following ${membersToMessage?.length} group member(s):`}
      </p>
      <div className="well receiver-list">
        {membersToMessage
          .map(p => (p.includes('@') ? p : prettyId(p)))
          ?.join(', ')}
      </div>
      <div id="message-group-members-form">
        <div className="form-group">
          <label htmlFor="subject">Email Subject</label>
          <input
            type="text"
            name="subject"
            className="form-control"
            placeholder="Subject"
            value={subject}
            required
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Email Body</label>
          <p className="hint">
            {`Hint: You can personalize emails using template variables. The text
            {{ firstname }} and {{ fullname }}
            will automatically be replaced with the recipient's first or full name if they have an OpenReview profile.
            If a profile isn't found their email address will be used instead.`}
          </p>
          <p className="hint">
            {/* eslint-disable-next-line max-len */}
            You can use markdown syntax to compose email in HTML format. User
            the Preview tab to see how your email will look.
          </p>
          <MarkdownPreviewTab
            value={message}
            onValueChanged={setMessage}
            placeholder="Message"
          />
        </div>
      </div>
    </BasicModal>
  )
}

const StatusMessage = ({ statusParam }) => {
  if (!statusParam.status) return null
  const {
    status,
    sent,
    totalSent,
    queued,
    totalQueued,
    isQueuing,
  } = statusParam
  if (status.status === 'ok') {
    return (
      <>
        <strong>{`All ${totalSent} emails have been sent`}</strong>
        <br />
        <br />
        <em>
          {/* eslint-disable-next-line max-len */}
          Note: The number of emails sent may not exactly match the number of
          users you selected if multiple IDs belonging to the same user were
          included.
        </em>
      </>
    )
  }
  if (isQueuing) {
    return (
      <>
        <strong>Queuing emails:</strong>
        {' '}
        {`${queued} / ${totalQueued} complete`}
      </>
    )
  }
  return (
    <>
      <strong>Sending emails:</strong>
      {' '}
      {`${sent} / ${totalSent} complete`}
    </>
  )
}

const GroupMessages = ({ jobId, accessToken, groupId }) => {
  const sectionRef = useRef(null)
  const [errorText, setErrorText] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [now, setNow] = useState(0)
  const [variant, setVariant] = useState(null)
  const [statusObj, setStatusObj] = useState({})

  const getJobStatus = async () => {
    if (retryCount > 5 || statusObj.status?.status === 'ok') return
    try {
      const result = await api.get(
        '/logs/process',
        { id: jobId },
        { accessToken },
      )
      if (!result.logs?.length) {
        setErrorText(
          'Error: Email progress could not be loaded. See link below for more details.',
        )
        setVariant('danger')
        setNow(100)
        setRetryCount(count => count + 1)
        return
      }
      const status = result.logs[0]
      if (status.status === 'error') {
        setErrorText(`Error: ${status.error.message}`)
        setVariant('danger')
        setNow(100)
        return
      }
      const queued = status.progress.groupsProcessed[0]
      const totalQueued = status.progress.groupsProcessed[1]
      const sent = status.progress.emailsProcessed
        ? status.progress.emailsProcessed[0]
        : 0
      const totalSent = status.progress.emailsProcessed
        ? status.progress.emailsProcessed[1]
        : 0
      const isQueuing = queued < totalQueued
      const percentComplete = Math.round(
        (isQueuing ? queued / totalQueued : sent / totalSent) * 100,
        2,
      )
      setStatusObj({
        status,
        sent,
        totalSent,
        queued,
        totalQueued,
        isQueuing,
      })
      setNow(percentComplete)
    } catch (error) {
      promptError(error.message)
      setRetryCount(count => count + 1)
    }
  }

  useEffect(() => {
    if (!jobId) return
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setNow(0)
    setVariant(null)
    setStatusObj({})
  }, [jobId])

  return (
    <section className="members">
      <h4>Group Messages</h4>
      <div className="container members-container pl-0" ref={sectionRef}>
        {jobId && (
          <>
            <ProgressBar
              key={jobId}
              statusCheckFn={getJobStatus}
              now={now}
              variant={variant}
              animated={now !== 100}
              striped={now !== 100}
            />
            <p>{errorText || <StatusMessage statusParam={statusObj} />}</p>
          </>
        )}
        <Link href={`/messages?parentGroup=${groupId}`}>
          <a>View all messages sent to this group </a>
        </Link>
      </div>
    </section>
  )
}

const GroupMembers = ({ group, accessToken }) => {
  const membersPerPage = 15
  const [searchTerm, setSearchTerm] = useState('')
  const [memberAnonIds, setMemberAnonIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [jobId, setJobId] = useState(null)
  const groupMemberReducer = (state, action) => {
    switch (action.type) {
      case 'SELECT':
        return state.map(p => (p.id === action.payload ? { ...p, isSelected: true } : p))
      case 'UNSELECT':
        return state.map(p => (p.id === action.payload ? { ...p, isSelected: false } : p))
      case 'DELETE':
        return state.map(p => (action.payload.includes(p.id)
          ? { ...p, isDeleted: true, isSelected: false }
          : {
            ...p,
            isSelected: action.payload.length === 1 ? p.isSelected : false,
          }))
      case 'ADD':
        // eslint-disable-next-line no-use-before-define
        setCurrentPage(1)
        return [
          ...action.payload.newMembers?.map(p => ({
            id: p,
            isSelected: false,
            isDeleted: false,
          })),
          ...state.map(p => ({
            ...p,
            isSelected: false,
            isDeleted: action.payload.existingDeleted.includes(p.id)
              ? false
              : p.isDeleted,
          })),
        ]
      case 'RESTORE':
        return state.map(p => (action.payload.includes(p.id) ? { ...p, isDeleted: false } : p))
      case 'SELECTDESELECTALL':
        // eslint-disable-next-line no-case-declarations
        const allSelected = state.every(p => p.isSelected)
        return state.map(p => ({ ...p, isSelected: !allSelected }))
      default:
        return state
    }
  }
  const [groupMembers, setGroupMembers] = useReducer(
    groupMemberReducer,
    group.members.map(p => ({
      id: p,
      isDeleted: false,
      isSelected: false,
    })),
  )
  const [filteredMembers, setFilteredMembers] = useState(groupMembers)
  const [memberToMessage, setMemberToMessage] = useState([])
  // eslint-disable-next-line max-len
  const [displayedMembers, setDisplayedMembers] = useState(
    filteredMembers.length > membersPerPage
      ? filteredMembers.slice(0, membersPerPage)
      : filteredMembers,
  )
  const showMembers = filteredMembers?.length > 0

  const getTitle = () => {
    if (filteredMembers.length <= 3) return 'Group Members'
    const selectedMembers = groupMembers.filter(p => p.isSelected)
    if (selectedMembers.length) { return `Group Members (${filteredMembers.length} total, ${selectedMembers.length} selected)` }
    return `Group Members (${filteredMembers.length})`
  }

  const deleteMember = async (memberId) => {
    try {
      await api.delete(
        '/groups/members',
        { id: group.id, members: [memberId] },
        { accessToken, version: getGroupVersion(group.id) },
      )
      setGroupMembers({ type: 'DELETE', payload: [memberId] })
    } catch (error) {
      promptError(error.message)
    }
  }

  const restoreMember = async (memberId) => {
    try {
      await api.put(
        '/groups/members',
        { id: group.id, members: [memberId] },
        { accessToken, version: getGroupVersion(group.id) },
      )
      setGroupMembers({ type: 'RESTORE', payload: [memberId] })
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleAddButtonClick = async (term) => {
    if (!term.trim()) {
      promptError('No member to add')
      return
    }
    const membersToAdd = term.split(',').flatMap((p) => {
      if (p.includes('@')) return p.trim().toLowerCase()
      if (p.trim()) return p.trim()
      return []
    })
    if (!membersToAdd.length) {
      promptError('No member to add')
      return
    }
    // could be new member, existing deleted member or existing active member
    const newMembers = membersToAdd.filter(
      p => !groupMembers.find(q => q.id === p),
    )
    const existingDeleted = membersToAdd.filter(
      p => groupMembers.find(q => q.id === p)?.isDeleted,
    )
    const existingActive = membersToAdd.filter(
      p => groupMembers.find(q => q.id === p)
        && !groupMembers.find(q => q.id === p).isDeleted,
    )

    const newMembersMessage = newMembers.length
      ? `${newMembers.length} new member${
        newMembers.length > 1 ? 's' : ''
      } added`
      : 'No new member to add.'
    const existingDeletedMessage = existingDeleted.length
      ? `${existingDeleted.length} previously deleted member${
        existingDeleted.length > 1 ? 's' : ''
      } restored.`
      : ''
    const existingActiveMessage = existingActive.length
      ? `${existingActive.length} member${
        existingActive.length > 1 ? 's' : ''
      } already exist.`
      : ''

    try {
      await api.put(
        '/groups/members',
        { id: group.id, members: [...newMembers, ...existingDeleted] },
        { accessToken, version: getGroupVersion(group.id) },
      )
      setSearchTerm('')
      setGroupMembers({
        type: 'ADD',
        payload: { newMembers, existingDeleted },
      })
      // eslint-disable-next-line no-use-before-define
      getMemberAnonIds()
      promptMessage(
        `${newMembersMessage} ${existingDeletedMessage} ${existingActiveMessage}`,
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleRemoveSelectedButtonClick = async () => {
    if (!groupMembers.some(p => p.isSelected)) {
      promptMessage('No member is selected')
      return
    }
    const membersToRemove = groupMembers
      .filter(p => p.isSelected)
      .map(p => p.id)
    try {
      await api.delete(
        '/groups/members',
        { id: group.id, members: membersToRemove },
        { accessToken, version: getGroupVersion(group.id) },
      )
      setGroupMembers({ type: 'DELETE', payload: membersToRemove })
    } catch (error) {
      promptError(error.message)
    }
  }

  const getMemberAnonIds = async () => {
    try {
      const anonGroupRegex = group.id.endsWith('s')
        ? `${group.id.slice(0, -1)}_`
        : `${group.id}_`
      const result = await api.get(
        `/groups?regex=${anonGroupRegex}`,
        {},
        { accessToken, version: getGroupVersion(group.id) },
      )
      setMemberAnonIds(
        result.groups.map(p => ({ member: p.members, anonId: p.id })),
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const messageMember = (members) => {
    setJobId(null)
    setMemberToMessage(members)
    $('#message-group-members').modal('show')
  }

  useEffect(() => {
    const filterResult = groupMembers.filter(p => p.id.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    setFilteredMembers(filterResult)
    setDisplayedMembers(
      filterResult.length > membersPerPage
        ? filterResult.slice(0, membersPerPage)
        : filterResult,
    )
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    const filterResult = groupMembers.filter(p => p.id.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    setFilteredMembers(filterResult)
    setDisplayedMembers(
      filterResult.slice(
        (currentPage - 1) * membersPerPage,
        currentPage * membersPerPage,
      ),
    )
  }, [currentPage, groupMembers])

  useEffect(() => {
    getMemberAnonIds()
  }, [])

  return (
    <section className="members">
      <h4>{getTitle()}</h4>
      <div className="container members-container">
        <div className="search-row">
          <div className="input-group">
            <input
              className="form-control input-sm"
              placeholder="e.g. ~Jane_Doe1, jane@example.com, abc.com/2018/Conf/Authors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {/* <Icon name="search" /> */}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary mr-3 search-button"
            disabled={
              !searchTerm.trim() || groupMembers.find(p => p.id === searchTerm)
            }
            onClick={() => handleAddButtonClick(searchTerm)}
          >
            Add to Group
          </button>
          <div className="space-taker" />
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setGroupMembers({ type: 'SELECTDESELECTALL' })}
          >
            Select All
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={!groupMembers.some(p => p.isSelected)}
            onClick={() => messageMember(
                groupMembers.filter(p => p.isSelected)?.map(q => q.id),
            )}
          >
            Message Selected
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={!groupMembers.some(p => p.isSelected)}
            onClick={() => handleRemoveSelectedButtonClick()}
          >
            Remove Selected
          </button>
        </div>
        {showMembers ? (
          <>
            {displayedMembers.map((member) => {
              // eslint-disable-next-line eqeqeq
              const hasAnonId = memberAnonIds.find(p => p.member == member.id)
              return (
                <React.Fragment key={member.id}>
                  <div
                    className={`member-row ${
                      member.isDeleted ? 'deleted' : ''
                    }`}
                    key={member}
                  >
                    <input
                      type="checkbox"
                      checked={member.isSelected}
                      disabled={member.isDeleted}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGroupMembers({
                            type: 'SELECT',
                            payload: member.id,
                          })
                        } else {
                          setGroupMembers({
                            type: 'UNSELECT',
                            payload: member.id,
                          })
                        }
                      }}
                    />
                    <span className="member-id">
                      <Link href={urlFromGroupId(member.id)}>
                        <a>{member.id}</a>
                      </Link>
                      {hasAnonId && (
                        <>
                          {' | '}
                          <Link href={urlFromGroupId(hasAnonId.anonId)}>
                            <a>{prettyId(hasAnonId.anonId)}</a>
                          </Link>
                        </>
                      )}
                      {member.isDeleted && (
                      <>
                        {' '}
                        {'(Deleted)'}
                      </>
                      )}
                    </span>
                    {member.isDeleted ? (
                      <button
                        type="button"
                        className="btn btn-xs btn-primary"
                        onClick={() => restoreMember(member.id)}
                      >
                        <Icon name="repeat" />
                        Undo
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => messageMember([member.id])}
                        >
                          <Icon name="envelope" />
                          Message
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => deleteMember(member.id)}
                        >
                          <Icon name="remove" />
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
            <PaginationLinks
              setCurrentPage={e => setCurrentPage(e)}
              totalCount={filteredMembers.length}
              itemsPerPage={membersPerPage}
              currentPage={currentPage}
              options={{ noScroll: true }}
            />
          </>
        ) : (
          <div className="empty-message-row">
            {searchTerm
              ? `No members matching the search "${searchTerm}" found. Click Add to Group above to add a new member.`
              : 'No members to display'}
          </div>
        )}
      </div>
      <MessageMemberModal
        groupId={group.id}
        membersToMessage={memberToMessage}
        accessToken={accessToken}
        setJobId={id => setJobId(id)}
      />
      <GroupMessages
        jobId={jobId}
        accessToken={accessToken}
        groupId={group.id}
      />
    </section>
  )
}

export default GroupMembers
