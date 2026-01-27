/* globals DOMPurify,marked,$,promptError,promptMessage: false */
import { useEffect, useReducer, useRef, useState } from 'react'
import Link from 'next/link'
import copy from 'copy-to-clipboard'
import ProgressBar from '../ProgressBar'
import PaginationLinks from '../PaginationLinks'
import Icon from '../Icon'
import EditorSection from '../EditorSection'
import api from '../../lib/api-client'
import { prettyId, urlFromGroupId } from '../../lib/utils'
import useUser from '../../hooks/useUser'
import SpinnerButton from '../SpinnerButton'
import MessageMemberModal from './MessageMemberModal'

const StatusMessage = ({ statusParam }) => {
  if (!statusParam.status) return null
  const { status, sent, totalSent, queued, totalQueued, isQueuing } = statusParam
  if (status.status === 'ok') {
    return (
      <>
        <strong>{`All ${totalSent} emails have been sent`}</strong>
        <br />
        <br />
        <em>
          Note: The number of emails sent may not exactly match the number of users you
          selected if multiple IDs belonging to the same user were included.
        </em>
      </>
    )
  }
  if (isQueuing) {
    return (
      <>
        <strong>Queuing emails:</strong> {`${queued} / ${totalQueued} complete`}
      </>
    )
  }
  return (
    <>
      <strong>Sending emails:</strong> {`${sent} / ${totalSent} complete`}
    </>
  )
}

const GroupMessages = ({ jobId, groupId }) => {
  const sectionRef = useRef(null)
  const [errorText, setErrorText] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [now, setNow] = useState(0)
  const [variant, setVariant] = useState(null)
  const [statusObj, setStatusObj] = useState({})

  const getJobStatus = async () => {
    if (retryCount > 5 || statusObj.status?.status === 'ok') return
    try {
      const result = await api.get('/logs/process', { id: jobId })
      if (!result.logs?.length) {
        setErrorText(
          'Error: Email progress could not be loaded. See link below for more details.'
        )
        setVariant('danger')
        setNow(100)
        setRetryCount((count) => count + 1)
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
      const sent = status.progress.emailsProcessed ? status.progress.emailsProcessed[0] : 0
      const totalSent = status.progress.emailsProcessed
        ? status.progress.emailsProcessed[1]
        : 0
      const isQueuing = queued < totalQueued
      const percentComplete = Math.round(
        (isQueuing ? queued / totalQueued : sent / totalSent) * 100,
        2
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
      setRetryCount((count) => count + 1)
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
    <EditorSection title="Group Messages" className="members">
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
          View all messages sent to this group &raquo;
        </Link>
      </div>
    </EditorSection>
  )
}

const GroupMembers = ({
  group,
  reloadGroup,
  messageAllMembersInvitation,
  messageSingleMemberInvitation,
  addRemoveMembersInvitaiton,
}) => {
  const membersPerPage = 15
  const [searchTerm, setSearchTerm] = useState('')
  const [memberAnonIds, setMemberAnonIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [jobId, setJobId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const defaultGroupMembers = group.members.map((p) => ({
    id: p,
    isDeleted: false,
    isSelected: false,
  }))
  const [groupMembers, setGroupMembers] = useReducer(
    // eslint-disable-next-line no-use-before-define
    groupMemberReducer,
    defaultGroupMembers
  )
  const [filteredMembers, setFilteredMembers] = useState(groupMembers)

  const { user } = useUser()
  const userIds = [...(user?.profile?.emails ?? []), ...(user?.profile?.usernames ?? [])]
  const profileId = user?.profile?.id

  function groupMemberReducer(state, action) {
    switch (action.type) {
      case 'SELECT':
        return state.map((p) => (p.id === action.payload ? { ...p, isSelected: true } : p))
      case 'UNSELECT':
        return state.map((p) => (p.id === action.payload ? { ...p, isSelected: false } : p))
      case 'INVERTSELECTION':
        return state.map((p) =>
          p.id === action.payload ? { ...p, isSelected: !p.isSelected } : p
        )
      case 'DELETE':
        return state.map((p) =>
          action.payload.includes(p.id)
            ? { ...p, isDeleted: true, isSelected: false }
            : {
                ...p,
                isSelected: action.payload.length === 1 ? p.isSelected : false,
              }
        )
      case 'ADD':
        setCurrentPage(1)
        return [
          ...(action.payload.newMembers?.map((p) => ({
            id: p,
            isSelected: false,
            isDeleted: false,
          })) ?? []),
          ...state.map((p) => ({
            ...p,
            isSelected: false,
            isDeleted: action.payload.existingDeleted.includes(p.id) ? false : p.isDeleted,
          })),
        ]
      case 'RESTORE':
        return state.map((p) =>
          action.payload.includes(p.id) ? { ...p, isDeleted: false } : p
        )
      case 'SELECTDESELECTALL':
        // eslint-disable-next-line no-case-declarations
        const filterdMembers = state.filter((p) =>
          p.id.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
        // eslint-disable-next-line no-case-declarations
        const allSelected = filterdMembers
          .filter((p) => !p.isDeleted)
          .every((p) => p.isSelected)
        return state.map((p) => {
          const isSelected =
            filterdMembers.find((q) => q.id === p.id) && !p.isDeleted
              ? !allSelected
              : p.isSelected
          return {
            ...p,
            isSelected,
          }
        })
      case 'INIT':
        return defaultGroupMembers
      default:
        return state
    }
  }

  const [memberToMessage, setMemberToMessage] = useState([])
  const [messageInvitation, setMessageInvitation] = useState(null)
  const [displayedMembers, setDisplayedMembers] = useState(
    filteredMembers.length > membersPerPage
      ? filteredMembers.slice(0, membersPerPage)
      : filteredMembers
  )
  const isAllFilterdSelected =
    filteredMembers.filter((p) => !p.isDeleted).length &&
    filteredMembers.filter((p) => !p.isDeleted).every((p) => p.isSelected)
  const isFilteredEmpty = filteredMembers.filter((p) => !p.isDeleted).length === 0

  const getTitle = () => {
    if (filteredMembers.length <= 3) return 'Group Members'
    const selectedMembers = groupMembers.filter((p) => p.isSelected)
    const groupMemberActive = groupMembers.filter((p) => !p.isDeleted)
    const filteredMembersActive = filteredMembers.filter((p) => !p.isDeleted)
    const isFiltered = filteredMembersActive.length !== groupMemberActive.length
    return `Group Members (${groupMemberActive.length} total${
      isFiltered ? `, ${filteredMembersActive.length} displayed` : ''
    }${selectedMembers.length ? `, ${selectedMembers.length} selected` : ''})`
  }

  const buildEdit = (action, members) => {
    if (addRemoveMembersInvitaiton)
      return {
        group: {
          id: group.id,
          members: {
            [action]: members,
          },
        },
        invitation: addRemoveMembersInvitaiton.id,
      }
    const userNameGroupInvitationId = `${process.env.SUPER_USER}/-/Username`
    const emailGroupInvitationId = `${process.env.SUPER_USER}/-/Email`

    let invitation = group.domain ? `${group.domain}/-/Edit` : group.invitations?.[0]
    if (group.invitations?.includes(userNameGroupInvitationId))
      invitation = userNameGroupInvitationId
    if (group.invitations?.includes(emailGroupInvitationId))
      invitation = emailGroupInvitationId

    return {
      group: {
        id: group.id,
        members: {
          [action]: members,
        },
      },
      readers: [profileId],
      writers: [profileId],
      signatures: [profileId],
      invitation,
    }
  }

  const deleteMember = async (memberId) => {
    const confirmMessage =
      'You are removing yourself and may lose access to this group. Are you sure you want to continue?'
    // eslint-disable-next-line no-alert
    if (userIds.includes(memberId) && !window.confirm(confirmMessage)) return

    try {
      await api.post('/groups/edits', buildEdit('remove', [memberId]))
      setGroupMembers({ type: 'DELETE', payload: [memberId] })
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
  }

  const restoreMember = async (memberId) => {
    try {
      await api.post('/groups/edits', buildEdit('add', [memberId]))
      setGroupMembers({ type: 'RESTORE', payload: [memberId] })
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
  }

  const getMemberAnonIds = async () => {
    try {
      const anonGroupRegex = group.id.endsWith('s')
        ? `${group.id.slice(0, -1)}_`
        : `${group.id}_`
      const result = await api.get(`/groups?prefix=${anonGroupRegex}`)
      setMemberAnonIds(
        result.groups.map((p) =>
          p.id.startsWith(anonGroupRegex)
            ? { member: [p.id], anonId: p.members?.[0] }
            : { member: p.members, anonId: p.id }
        )
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleAddButtonClick = async (term) => {
    setIsAdding(true)
    const membersToAdd = term
      .split(',')
      .map((member) => {
        const trimmedMem = member.trim()
        return trimmedMem.includes('@') ? trimmedMem.toLowerCase() : trimmedMem
      })
      .filter((member) => member)
    if (!membersToAdd.length) {
      promptError('No member to add')
      setIsAdding(false)
      return
    }

    // Could include new members, existing deleted members, or existing active member
    const newMembers = membersToAdd.filter((p) => !groupMembers.find((q) => q.id === p))
    const existingDeleted = membersToAdd.filter(
      (p) => groupMembers.find((q) => q.id === p)?.isDeleted
    )
    const existingActive = membersToAdd.filter(
      (p) =>
        groupMembers.find((q) => q.id === p) && !groupMembers.find((q) => q.id === p).isDeleted
    )

    const newMembersMessage = newMembers.length
      ? `${newMembers.length} new member${newMembers.length > 1 ? 's' : ''} added`
      : 'No new member to add.'
    const existingDeletedMessage = existingDeleted.length
      ? `${existingDeleted.length} previously deleted member${
          existingDeleted.length > 1 ? 's' : ''
        } restored.`
      : ''
    const existingActiveMessage = existingActive.length
      ? `${existingActive.length} member${existingActive.length > 1 ? 's' : ''} already exist.`
      : ''

    try {
      await api.post('/groups/edits', buildEdit('add', [...newMembers, ...existingDeleted]))
      setSearchTerm('')
      setGroupMembers({
        type: 'ADD',
        payload: { newMembers, existingDeleted },
      })
      getMemberAnonIds()
      promptMessage(`${newMembersMessage} ${existingDeletedMessage} ${existingActiveMessage}`)
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
    setIsAdding(false)
  }

  const handleRemoveSelectedButtonClick = async () => {
    const membersToRemove = groupMembers.filter((p) => p.isSelected).map((p) => p.id)
    if (membersToRemove.length === 0) {
      promptMessage('No group members selected')
      return
    }

    const groupName = prettyId(group.id)
    const additionalWarning = userIds.some((p) => membersToRemove.includes(p))
      ? 'You are removing yourself and may lose access to this group if you continue.'
      : ''
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Are you sure you want to remove ${membersToRemove.length} members from ${groupName}? ${additionalWarning}`
      )
    ) {
      return
    }

    try {
      await api.post('/groups/edits', buildEdit('remove', membersToRemove))
      setGroupMembers({ type: 'DELETE', payload: membersToRemove })
      reloadGroup()
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleCopySelectedButtonClick = async () => {
    const selectedMemberIds = groupMembers.filter((p) => p.isSelected).map((q) => q.id)
    const success = copy(selectedMemberIds.join(','))
    if (success) {
      promptMessage(`${selectedMemberIds.length} IDs copied to clipboard`)
    } else {
      promptError('Could not copy selected member IDs to clipboard')
    }
  }

  const messageMember = (members) => {
    setJobId(null)
    setMemberToMessage(members)
    $('#message-group-members').modal('show')
  }

  useEffect(() => {
    const filterResult = groupMembers.filter((p) =>
      p.id.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    setFilteredMembers(filterResult)
    setDisplayedMembers(
      filterResult.length > membersPerPage
        ? filterResult.slice(0, membersPerPage)
        : filterResult
    )
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    const filterResult = groupMembers.filter((p) =>
      p.id.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    setFilteredMembers(filterResult)
    setDisplayedMembers(
      filterResult.slice((currentPage - 1) * membersPerPage, currentPage * membersPerPage)
    )
  }, [currentPage, groupMembers])

  useEffect(() => {
    setGroupMembers({ type: 'INIT' })
    getMemberAnonIds()
  }, [group.id])

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, [])

  const showCustomGroupMembers =
    messageAllMembersInvitation || messageSingleMemberInvitation || addRemoveMembersInvitaiton

  if (!showCustomGroupMembers)
    return (
      <>
        <EditorSection title={getTitle()} className="members">
          <div className="container members-container">
            <div className="search-row">
              <div className="input-group">
                <input
                  className="form-control input-sm"
                  placeholder="e.g. ~Jane_Doe1, jane@example.com, abc.com/2018/Conf/Authors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <SpinnerButton
                type="primary"
                className="search-button"
                disabled={
                  isAdding ||
                  !searchTerm.trim() ||
                  groupMembers.find((p) => p.id === searchTerm)
                }
                onClick={() => handleAddButtonClick(searchTerm)}
                loading={isAdding}
              >
                Add to Group
              </SpinnerButton>
              <div className="space-taker" />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={isFilteredEmpty}
                onClick={() => setGroupMembers({ type: 'SELECTDESELECTALL' })}
              >
                {isAllFilterdSelected ? 'Deselect All' : 'Select All'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary hidden-sm hidden-xs"
                disabled={!groupMembers.some((p) => p.isSelected)}
                onClick={handleCopySelectedButtonClick}
                title="Copy member IDs to clipboard. Useful for adding group members to other groups"
                data-toggle="tooltip"
                data-placement="top"
              >
                Copy Selected
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!groupMembers.some((p) => p.isSelected)}
                onClick={() =>
                  messageMember(groupMembers.filter((p) => p.isSelected)?.map((q) => q.id))
                }
              >
                Message Selected
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!groupMembers.some((p) => p.isSelected)}
                onClick={() => handleRemoveSelectedButtonClick()}
              >
                Remove Selected
              </button>
            </div>

            {filteredMembers?.length > 0 ? (
              displayedMembers.map((member) => {
                const hasAnonId = memberAnonIds.find((p) => p.member.includes(member.id))
                return (
                  <div
                    key={member.id}
                    className={`member-row ${member.isDeleted ? 'deleted' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={member.isSelected}
                      disabled={member.isDeleted}
                      onChange={(e) => {
                        setGroupMembers({
                          type: e.target.checked ? 'SELECT' : 'UNSELECT',
                          payload: member.id,
                        })
                      }}
                    />
                    <span
                      className="member-id"
                      onClick={(e) => {
                        if (e.currentTarget !== e.target) return
                        setGroupMembers({
                          type: 'INVERTSELECTION',
                          payload: member.id,
                        })
                      }}
                    >
                      <Link href={urlFromGroupId(member.id)}>{member.id}</Link>
                      {hasAnonId && (
                        <>
                          {' | '}
                          <Link href={urlFromGroupId(hasAnonId.anonId, true)}>
                            {prettyId(hasAnonId.anonId)}
                          </Link>
                        </>
                      )}
                      {member.isDeleted && <> {'(Deleted)'}</>}
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
                )
              })
            ) : (
              <div className="empty-message-row">
                {searchTerm
                  ? `No members matching the search "${searchTerm}" found. Click Add to Group above to add a new member.`
                  : 'No members to display'}
              </div>
            )}
            <PaginationLinks
              setCurrentPage={(e) => setCurrentPage(e)}
              totalCount={filteredMembers.length}
              itemsPerPage={membersPerPage}
              currentPage={currentPage}
              options={{ noScroll: true }}
            />
          </div>
        </EditorSection>

        <MessageMemberModal
          groupId={group.id}
          domainId={group.domain}
          groupDomainContent={group.details.domain?.content}
          membersToMessage={memberToMessage}
          setJobId={(id) => setJobId(id)}
        />

        <GroupMessages jobId={jobId} groupId={group.id} />
      </>
    )

  const showMessageAll = messageAllMembersInvitation
  const showMessageSingle = messageSingleMemberInvitation
  const showAddRemoveMembers = addRemoveMembersInvitaiton
  const showCheckbox = showMessageSingle || showAddRemoveMembers

  return (
    <>
      <EditorSection title={getTitle()} className="members">
        <div className="container members-container">
          <div className="search-row">
            <div className="input-group">
              <input
                className="form-control input-sm"
                placeholder="e.g. ~Jane_Doe1, jane@example.com, abc.com/2018/Conf/Authors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label='"Add or search group members"'
              />
            </div>
            {showAddRemoveMembers && (
              <SpinnerButton
                type="primary"
                className="search-button"
                disabled={
                  isAdding ||
                  !searchTerm.trim() ||
                  groupMembers.find((p) => p.id === searchTerm)
                }
                onClick={() => handleAddButtonClick(searchTerm)}
                loading={isAdding}
              >
                Add to Group
              </SpinnerButton>
            )}
            <div className="space-taker" />
            {showCheckbox && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={isFilteredEmpty}
                onClick={() => setGroupMembers({ type: 'SELECTDESELECTALL' })}
              >
                {isAllFilterdSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
            {showAddRemoveMembers && (
              <button
                type="button"
                className="btn btn-sm btn-primary hidden-sm hidden-xs"
                disabled={!groupMembers.some((p) => p.isSelected)}
                onClick={handleCopySelectedButtonClick}
                title="Copy member IDs to clipboard. Useful for adding group members to other groups"
                data-toggle="tooltip"
                data-placement="top"
              >
                Copy Selected
              </button>
            )}
            {showMessageSingle && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!groupMembers.some((p) => p.isSelected)}
                onClick={() => {
                  setMessageInvitation(messageSingleMemberInvitation)
                  messageMember(groupMembers.filter((p) => p.isSelected)?.map((q) => q.id))
                }}
              >
                Message Selected
              </button>
            )}
            {showMessageAll && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setMessageInvitation(messageAllMembersInvitation)
                  messageMember([group.id])
                }}
              >
                Message All
              </button>
            )}
            {showAddRemoveMembers && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!groupMembers.some((p) => p.isSelected)}
                onClick={() => handleRemoveSelectedButtonClick()}
              >
                Remove Selected
              </button>
            )}
          </div>

          {filteredMembers?.length > 0 ? (
            displayedMembers.map((member) => {
              const hasAnonId = memberAnonIds.find((p) => p.member.includes(member.id))
              return (
                <div
                  key={member.id}
                  className={`member-row ${member.isDeleted ? 'deleted' : ''}`}
                >
                  {showCheckbox && (
                    <input
                      type="checkbox"
                      checked={member.isSelected}
                      disabled={member.isDeleted}
                      onChange={(e) => {
                        setGroupMembers({
                          type: e.target.checked ? 'SELECT' : 'UNSELECT',
                          payload: member.id,
                        })
                      }}
                      aria-label="Select or unselect group member"
                    />
                  )}
                  <span
                    className="member-id"
                    onClick={(e) => {
                      if (e.currentTarget !== e.target) return
                      setGroupMembers({
                        type: 'INVERTSELECTION',
                        payload: member.id,
                      })
                    }}
                  >
                    <Link href={urlFromGroupId(member.id)}>{member.id}</Link>
                    {hasAnonId && (
                      <>
                        {' | '}
                        <Link href={urlFromGroupId(hasAnonId.anonId, true)}>
                          {prettyId(hasAnonId.anonId)}
                        </Link>
                      </>
                    )}
                    {member.isDeleted && <> {'(Deleted)'}</>}
                  </span>
                  {showAddRemoveMembers && member.isDeleted ? (
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
                      {showMessageSingle && (
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => {
                            setMessageInvitation(messageSingleMemberInvitation)
                            messageMember([member.id])
                          }}
                        >
                          <Icon name="envelope" />
                          Message
                        </button>
                      )}
                      {showAddRemoveMembers && (
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => deleteMember(member.id)}
                        >
                          <Icon name="remove" />
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })
          ) : (
            <div className="empty-message-row">
              {searchTerm
                ? `No members matching the search "${searchTerm}" found.${showAddRemoveMembers ? ' Click Add to Group above to add a new member.' : ''}`
                : 'No members to display'}
            </div>
          )}
          <PaginationLinks
            setCurrentPage={(e) => setCurrentPage(e)}
            totalCount={filteredMembers.length}
            itemsPerPage={membersPerPage}
            currentPage={currentPage}
            options={{ noScroll: true }}
          />
        </div>
      </EditorSection>

      <MessageMemberModal
        groupId={group.id}
        domainId={group.domain}
        groupDomainContent={group.details.domain?.content}
        membersToMessage={memberToMessage}
        setJobId={(id) => setJobId(id)}
        messageMemberInvitation={messageInvitation}
      />

      <GroupMessages jobId={jobId} groupId={group.id} />
    </>
  )
}

export default GroupMembers
