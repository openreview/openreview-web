/* globals promptError,promptMessage,moment: false */
import Link from 'next/link'
import { nanoid } from 'nanoid'
import React, { useEffect, useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  formatDateTime, getDefaultTimezone, prettyId, translateErrorDetails, urlFromGroupId,
} from '../lib/utils'
import api from '../lib/api-client'
import { isSuperUser } from '../lib/auth'
import PaginationLinks from './PaginationLinks'
import LoadingSpinner from './LoadingSpinner'

const CodeEditor = dynamic(() => import('./CodeEditor'))
const DatetimePicker = dynamic(() => import('./DatetimePicker'))
const Dropdown = dynamic(() => import('./Dropdown'))
const TimezoneDropdown = dynamic(() => import('./Dropdown').then(mod => mod.TimezoneDropdown))

const GroupIdList = ({ groupIds }) => {
  const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']
  if (!Array.isArray(groupIds)) return ''
  return (
    <div className="info-content">
      {groupIds.map((groupId, index) => {
        if (commonGroups.includes(groupId)) {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={index}>
              {index > 0 && <>,&nbsp;</>}
              {prettyId(groupId)}
            </React.Fragment>
          )
        }
        return (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>
            {index > 0 && <>,&nbsp;</>}
            <Link href={urlFromGroupId(groupId)}><a>{prettyId(groupId)}</a></Link>
          </React.Fragment>
        )
      })}
    </div>
  )
}

const InvitationGeneralInfo = ({
  invitation, profileId, accessToken, loadInvitation,
}) => {
  const parentGroupId = invitation.id.split('/-/')[0]
  const isV1Invitation = invitation.apiVersion === 1
  const trueFalseOptions = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ]

  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const generalInfoReducer = (state, action) => {
    switch (action.type) {
      case 'activationDateTimezone':
        return {
          ...state,
          cdate: moment.tz(moment(state.cdate).format('YYYY-MM-DD HH:mm'), action.payload).valueOf(),
          activationDateTimezone: action.payload,
        }
      case 'duedateTimezone':
        return {
          ...state,
          duedate: moment.tz(moment(state.duedate).format('YYYY-MM-DD HH:mm'), action.payload).valueOf(),
          duedateTimezone: action.payload,
        }
      case 'expDateTimezone':
        return {
          ...state,
          expdate: moment.tz(moment(state.expdate).format('YYYY-MM-DD HH:mm'), action.payload).valueOf(),
          expDateTimezone: action.payload,
        }
      default:
        return {
          ...state,
          [action.type]: action.payload,
        }
    }
  }
  const [generalInfo, setGeneralInfo] = useReducer(generalInfoReducer, {
    ...invitation,
    readers: invitation.readers?.join(', '),
    nonreaders: invitation.nonreaders?.join(', '),
    writers: invitation.writers?.join(', '),
    invitees: invitation.invitees?.join(', '),
    noninvitees: invitation.noninvitees?.join(', '),
    ...(isV1Invitation && { final: invitation.final?.join(', ') }),
    activationDateTimezone: getDefaultTimezone().value,
    duedateTimezone: getDefaultTimezone().value,
    expDateTimezone: getDefaultTimezone().value,
  })

  // eslint-disable-next-line arrow-body-style
  const stringToArray = (value) => {
    return value?.split(',')?.flatMap(p => (p.trim() ? p.trim() : []))
  }

  const constructInvitationToPost = async () => {
    const {
      activationDateTimezone,
      duedateTimezone,
      expDateTimezone,
      apiVersion,
      ...rest
    } = generalInfo
    return {
      ...rest,
      readers: stringToArray(generalInfo.readers),
      nonreaders: stringToArray(generalInfo.nonreaders),
      writers: stringToArray(generalInfo.writers),
      invitees: stringToArray(generalInfo.invitees),
      noninvitees: stringToArray(generalInfo.noninvitees),
      final: stringToArray(generalInfo.final),
      taskCompletionCount: Number(generalInfo.taskCompletionCount),
    }
  }

  const constructInvitationEditToPost = async () => {
    const invitationEdit = {
      invitation: {
        id: generalInfo.id,
        signatures: generalInfo.signatures,
        bulk: generalInfo.bulk,
        cdate: Number.isNaN(parseInt(generalInfo.cdate, 10)) ? null : parseInt(generalInfo.cdate, 10),
        duedate: Number.isNaN(parseInt(generalInfo.duedate, 10)) ? null : parseInt(generalInfo.duedate, 10),
        expdate: Number.isNaN(parseInt(generalInfo.expdate, 10)) ? null : parseInt(generalInfo.expdate, 10),
        invitees: stringToArray(generalInfo.invitees),
        maxReplies: Number.isNaN(Number(generalInfo.maxReplies)) ? null : Number(generalInfo.maxReplies),
        minReplies: Number.isNaN(Number(generalInfo.minReplies)) ? null : Number(generalInfo.minReplies),
        noninvitees: stringToArray(generalInfo.noninvitees),
        nonreaders: stringToArray(generalInfo.nonreaders),
        readers: stringToArray(generalInfo.readers),
        writers: stringToArray(generalInfo.writers),
      },
      readers: [profileId],
      writers: [profileId],
      signatures: [profileId],
    }
    return invitationEdit
  }

  const saveGeneralInfo = async () => {
    try {
      setIsSaving(true)
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = isV1Invitation ? await constructInvitationToPost() : await constructInvitationEditToPost()
      await api.post(requestPath, requestBody, { accessToken, version: invitation.apiVersion })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      setIsEditMode(false)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.details && error.legacy ? translateErrorDetails(error.details) : error.message)
    }
    setIsSaving(false)
  }

  return (
    <section className="general">
      <h4>General Info</h4>
      {isEditMode ? (
        <>
          {isV1Invitation && (
            <div className="row d-flex">
              <span className="info-title edit-title">Super Invitation:</span>
              <div className="info-edit-control">
                <input className="form-control input-sm" value={generalInfo.super} onChange={e => setGeneralInfo({ type: 'super', payload: e.target.value })} />
              </div>
            </div>
          )}
          <div className="row d-flex">
            <span className="info-title edit-title">Readers:</span>
            <div className="info-edit-control">
              <input className="form-control input-sm" value={generalInfo.readers} onChange={e => setGeneralInfo({ type: 'readers', payload: e.target.value })} />
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Non-Readers:</span>
            <div className="info-edit-control">
              <input className="form-control input-sm" value={generalInfo.nonreaders} onChange={e => setGeneralInfo({ type: 'nonreaders', payload: e.target.value })} />
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Writers:</span>
            <div className="info-edit-control">
              <input className="form-control input-sm" value={generalInfo.writers} onChange={e => setGeneralInfo({ type: 'writers', payload: e.target.value })} />
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Invitees:</span>
            <div className="info-edit-control">
              <input className="form-control input-sm" value={generalInfo.invitees} onChange={e => setGeneralInfo({ type: 'invitees', payload: e.target.value })} />
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Non-Invitees:</span>
            <div className="info-edit-control">
              <input className="form-control input-sm" value={generalInfo.noninvitees} onChange={e => setGeneralInfo({ type: 'noninvitees', payload: e.target.value })} />
            </div>
          </div>
          {
            isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Final Fields:</span>
                <div className="info-edit-control">
                  <input className="form-control input-sm" value={generalInfo.final} onChange={e => setGeneralInfo({ type: 'final', payload: e.target.value })} />
                </div>
              </div>
            )
          }
          {
            isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Multi-Reply:</span>
                <div className="info-edit-control">
                  <Dropdown
                    className="dropdown-select"
                    placeholder="select whether to enable anonymous id"
                    options={trueFalseOptions}
                    onChange={e => setGeneralInfo({ type: 'multiReply', payload: e.value })}
                    value={generalInfo.multiReply ? { value: true, label: 'True' } : { value: false, label: 'False' }}
                  />
                </div>
              </div>
            )
          }
          {
            isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Completed After:</span>
                <div className="info-edit-control">
                  <input type="number" className="form-control input-sm" value={generalInfo.taskCompletionCount} onChange={e => setGeneralInfo({ type: 'taskCompletionCount', payload: e.target.value })} />
                </div>
              </div>
            )
          }
          {
            isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Hide Revisions:</span>
                <div className="info-edit-control">
                  <Dropdown
                    className="dropdown-select"
                    placeholder="select whether to hide revisions"
                    options={trueFalseOptions}
                    onChange={e => setGeneralInfo({ type: 'hideOriginalRevisions', payload: e.value })}
                    value={generalInfo.hideOriginalRevisions ? { value: true, label: 'True' } : { value: false, label: 'False' }}
                  />
                </div>
              </div>
            )
          }
          {
            !isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Max Replies:</span>
                <div className="info-edit-control">
                  <input type="number" className="form-control input-sm" value={generalInfo.maxReplies} onChange={e => setGeneralInfo({ type: 'maxReplies', payload: e.target.value })} />
                </div>
              </div>
            )
          }
          {
            !isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Min Replies:</span>
                <div className="info-edit-control">
                  <input type="number" className="form-control input-sm" value={generalInfo.minReplies} onChange={e => setGeneralInfo({ type: 'minReplies', payload: e.target.value })} />
                </div>
              </div>
            )
          }
          {
            !isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title edit-title">Bulk:</span>
                <div className="info-edit-control">
                  <Dropdown
                    className="dropdown-select"
                    placeholder="select whether to bulk"
                    options={trueFalseOptions}
                    onChange={e => setGeneralInfo({ type: 'bulk', payload: e.value })}
                    value={generalInfo.bulk ? { value: true, label: 'True' } : { value: false, label: 'False' }}
                  />
                </div>
              </div>
            )
          }
          <div className="row d-flex">
            <span className="info-title edit-title">Activation Date:</span>
            <div className="info-edit-control">
              <div className="d-flex">
                <DatetimePicker extraClasses="date-picker" value={generalInfo.cdate} timeZone={generalInfo.activationDateTimezone} onChange={e => setGeneralInfo({ type: 'cdate', payload: e })} />
                <TimezoneDropdown className="timezone-dropdown" value={generalInfo.activationDateTimezone} onChange={e => setGeneralInfo({ type: 'activationDateTimezone', payload: e.value })} />
              </div>
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Due Date:</span>
            <div className="info-edit-control">
              <div className="d-flex">
                <DatetimePicker extraClasses="date-picker" value={generalInfo.duedate} timeZone={generalInfo.duedateTimezone} onChange={e => setGeneralInfo({ type: 'duedate', payload: e })} />
                <TimezoneDropdown className="timezone-dropdown" value={generalInfo.duedateTimezone} onChange={e => setGeneralInfo({ type: 'duedateTimezone', payload: e.value })} />
              </div>
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Expiration Date:</span>
            <div className="info-edit-control">
              <div className="d-flex">
                <DatetimePicker extraClasses="date-picker" value={generalInfo.expdate} timeZone={generalInfo.expDateTimezone} onChange={e => setGeneralInfo({ type: 'expdate', payload: e })} />
                <TimezoneDropdown className="timezone-dropdown" value={generalInfo.expDateTimezone} onChange={e => setGeneralInfo({ type: 'expDateTimezone', payload: e.value })} />
              </div>
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title">Signature:</span>
            <div className="info-edit-control">
              <input className="form-control input-sm" value={generalInfo.signatures?.join(', ')} onChange={e => setGeneralInfo({ type: 'signatures', payload: e.target.value })} />
            </div>
          </div>
          <div className="row d-flex">
            <span className="info-title edit-title" />
            <button type="button" className="btn btn-sm btn-primary" onClick={() => saveGeneralInfo()} disabled={isSaving}>
              {isSaving ? (
                <div className="save-button-wrapper">
                  Saving
                  <LoadingSpinner inline text="" extraClass="spinner-small" />
                </div>
              )
                : <>Save Invitation</>}
            </button>
            <button type="button" className="btn btn-sm btn-default" onClick={() => setIsEditMode(false)}>Cancel</button>
          </div>
        </>
      )
        : (
          <>
            {isV1Invitation && invitation.super && (
              <div className="row d-flex">
                <span className="info-title">Super Invitation:</span>
                <Link href={`/invitation/edit?id=${invitation.super}`}><a>{prettyId(invitation.super)}</a></Link>
              </div>
            )}
            <div className="row d-flex">
              <span className="info-title">Parent Group:</span>
              <Link href={urlFromGroupId(parentGroupId, true)}><a>{prettyId(parentGroupId)}</a></Link>
            </div>
            <div className="row d-flex">
              <span className="info-title">Readers:</span>
              <GroupIdList groupIds={invitation.readers} />
            </div>
            {invitation.nonreaders?.length > 0 && (
              <div className="row d-flex">
                <span className="info-title">Non-readers:</span>
                <GroupIdList groupIds={invitation.nonreaders} />
              </div>
            )}
            <div className="row d-flex">
              <span className="info-title">Writers:</span>
              <GroupIdList groupIds={invitation.writers} />
            </div>
            <div className="row d-flex">
              <span className="info-title">Invitees:</span>
              <GroupIdList groupIds={invitation.invitees} />
            </div>
            {invitation.noninvitees?.length > 0 && (
              <div className="row d-flex">
                <span className="info-title">Non-Invitees:</span>
                <GroupIdList groupIds={invitation.noninvitees} />
              </div>
            )}
            {isV1Invitation && invitation.final?.length > 0 && (
              <div className="row d-flex">
                <span className="info-title">Final Fields:</span>
                {invitation.final.join(', ')}
              </div>
            )}
            {isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title">Multi-Reply:</span>
                {invitation.multiReply?.toString()}
              </div>
            )}
            {isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title">Completed After:</span>
                {invitation.taskCompletionCount}
              </div>
            )}
            {isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title">Hide revisions:</span>
                {invitation.hideOriginalRevisions?.toString()}
              </div>
            )}
            {!isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title">Max Replies:</span>
                {invitation.maxReplies}
              </div>
            )}
            {!isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title">Min Replies:</span>
                {invitation.minReplies}
              </div>
            )}
            {!isV1Invitation && (
              <div className="row d-flex">
                <span className="info-title">Bulk:</span>
                {invitation.bulk?.toString()}
              </div>
            )}
            <div className="row d-flex">
              <span className="info-title">Signature:</span>
              <GroupIdList groupIds={invitation.signatures} />
            </div>
            <div className="row d-flex">
              <span className="info-title">Creation Date:</span>
              {formatDateTime(invitation.tcdate, { month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Activation Date:</span>
              {formatDateTime(invitation.cdate, { month: 'long', timeZoneName: 'short' }) ?? formatDateTime(invitation.tcdate, { month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Modified Date:</span>
              {formatDateTime(invitation.mdate, { month: 'long', timeZoneName: 'short' }) ?? formatDateTime(invitation.tmdate, { month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Due Date:</span>
              {formatDateTime(invitation.duedate, { month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Expiration Date:</span>
              {formatDateTime(invitation.expdate, { month: 'long', timeZoneName: 'short' })}
            </div>
            {invitation.ddate && (
              <div className="row d-flex">
                <span className="info-title">Deleted:</span>
                {formatDateTime(invitation.ddate, { month: 'long', timeZoneName: 'short' })}
              </div>
            )}
            <div className="row d-flex">
              <span className="info-title">Last Modified:</span>
              {formatDateTime(invitation.mdate, { month: 'long', timeZoneName: 'short' }) ?? formatDateTime(invitation.tmdate, { month: 'long', timeZoneName: 'short' })}
            </div>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setIsEditMode(true)}>Edit General Info</button>
          </>
        )}
    </section>
  )
}

// for both reply and reply forum
const InvitationReply = ({
  invitation, profileId, accessToken, loadInvitation, replyField,
}) => {
  const isV1Invitation = invitation.apiVersion === 1
  const [replyString, setReplyString] = useState(JSON.stringify(invitation[replyField], undefined, 2))

  const getTitle = () => {
    switch (replyField) {
      case 'reply': return 'Reply Parameters'
      case 'edge': return 'Edge'
      case 'edit': return 'Edit'
      case 'replyForumViews': return 'Reply Forum Views'
      default: return replyField
    }
  }

  const getRequestBody = (replyObj) => {
    switch (replyField) {
      case 'reply': return {
        ...invitation,
        reply: replyObj,
        apiVersion: undefined,
      }
      case 'edge': return {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          edge: replyObj,
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
      }
      case 'replyForumViews': return isV1Invitation ? {
        ...invitation,
        replyForumViews: replyObj,
        apiVersion: undefined,
      } : {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          replyForumViews: replyObj,
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
      }
      case 'edit': return {
        invitation: {
          id: invitation.id,
          signatures: invitation.signatures,
          edit: {
            note: {
              signatures: null,
              readers: null,
              writers: null,
              content: invitation.edit.note.content,
            },
            ...replyObj,
          },
        },
        readers: [profileId],
        writers: [profileId],
        signatures: [profileId],
      }
      default: return null
    }
  }

  const saveInvitationReply = async () => {
    try {
      const cleanReplyString = replyString.trim()
      const replyObj = JSON.parse(cleanReplyString.length ? cleanReplyString : '[]')
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = getRequestBody(replyObj)
      await api.post(requestPath, requestBody, { accessToken, version: isV1Invitation ? 1 : 2 })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      if (error instanceof SyntaxError) {
        promptError(`Reply content is not valid JSON - ${error.message}. Make sure all quotes and brackets match.`)
      } else {
        promptError(error.details && error.legacy ? translateErrorDetails(error.details) : error.message)
      }
    }
  }

  return (
    <section>
      <h4>{getTitle()}</h4>
      <CodeEditor code={replyString} onChange={setReplyString} isJson />
      <button type="button" className="btn btn-sm btn-primary" onClick={() => saveInvitationReply()}>Save Invitation</button>
    </section>
  )
}

const InvitationCode = ({
  invitation, profileId, accessToken, loadInvitation, codeType,
}) => {
  const isV1Invitation = invitation.apiVersion === 1
  const [code, setCode] = useState(invitation[codeType])
  const [showEditor, setShowEditor] = useState(false)

  const saveCode = async () => {
    try {
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = isV1Invitation
        ? {
          ...invitation,
          [codeType]: code,
          apiVersion: undefined,
        }
        : {
          invitation: {
            id: invitation.id,
            signatures: invitation.signatures,
            [codeType]: code,
          },
          readers: [profileId],
          writers: [profileId],
          signatures: [profileId],
        }
      await api.post(requestPath, requestBody, { accessToken, version: isV1Invitation ? 1 : 2 })
      promptMessage(`Code for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.details && error.legacy ? translateErrorDetails(error.details) : error.message)
    }
  }

  const handleCancelClick = () => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }

  const getTitle = () => {
    switch (codeType) {
      case 'web': return 'Invitation UI Code'
      case 'process': return 'Process Function Code'
      case 'preprocess': return 'PreProcess Function Code'
      default: return 'Code'
    }
  }

  useEffect(() => {
    setCode(invitation[codeType])
    setShowEditor(false)
  }, [invitation.id])

  return (
    <section>
      <h4>{getTitle()}</h4>
      {
        showEditor
          ? (
            <>
              <CodeEditor code={code} onChange={setCode} />
              <button type="button" className="btn btn-sm btn-primary" onClick={() => saveCode()}>Update Code</button>
              <button type="button" className="btn btn-sm btn-default" onClick={() => handleCancelClick()}>Cancel</button>
            </>
          )
          : <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowEditor(true)}>Show Code Editor</button>
      }
    </section>
  )
}

const ChildInvitations = ({ invitation, accessToken }) => {
  const isV1Invitation = invitation.apiVersion === 1
  const [totalCount, setTotalCount] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [childInvitations, setChildInvitations] = useState([])

  const ChildInvitationRow = ({ childInvitation }) => (
    <li>
      <Link href={`/invitation/edit?id=${childInvitation.id}`}>
        <a>
          {prettyId(childInvitation.id)}
        </a>
      </Link>
    </li>
  )

  const loadChildInvitations = async (limit = 15, offset = 0) => {
    try {
      const result = await api.get('/invitations', {
        super: invitation.id,
        limit,
        offset,
      }, { accessToken, version: isV1Invitation ? 1 : 2 })
      setTotalCount(result.count)
      setChildInvitations(result.invitations)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadChildInvitations()
  }, [invitation])

  const getTitle = () => `Child Invitations ${totalCount ? `(${totalCount})` : ''}`

  if (!childInvitations.length) return null
  return (
    <section>
      <h4>{getTitle()}</h4>
      <ul className="list-unstyled">
        {childInvitations.map(childInvitation => (
          <ChildInvitationRow
            key={childInvitation.id}
            childInvitation={childInvitation}
          />
        ))}
      </ul>
      <PaginationLinks
        // eslint-disable-next-line max-len
        setCurrentPage={(pageNumber) => { setCurrentPage(pageNumber); loadChildInvitations(15, (pageNumber - 1) * 15) }}
        totalCount={totalCount}
        itemsPerPage={15}
        currentPage={currentPage}
        options={{ noScroll: true }}
      />
    </section>
  )
}

const InvitationEditor = ({
  invitation, user, accessToken, loadInvitation,
}) => {
  const profileId = user?.profile?.id
  const showProcessEditor = invitation?.apiVersion === 2 || isSuperUser(user)
  if (!invitation) return null
  return (
    <>
      <div id="header">
        <h1>{prettyId(invitation.id)}</h1>
      </div>
      <InvitationGeneralInfo
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
      />
      <InvitationReply
        key={nanoid()}
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        // eslint-disable-next-line no-nested-ternary
        replyField={invitation.apiVersion === 1 ? 'reply' : (invitation.edge ? 'edge' : 'edit')}
      />
      <InvitationReply
        key={nanoid()}
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        // eslint-disable-next-line no-nested-ternary
        replyField="replyForumViews"
      />
      <InvitationCode
        invitation={invitation}
        profileId={profileId}
        accessToken={accessToken}
        loadInvitation={loadInvitation}
        codeType="web"
      />
      {
        showProcessEditor
        && (
          <>
            <InvitationCode
              invitation={invitation}
              profileId={profileId}
              accessToken={accessToken}
              loadInvitation={loadInvitation}
              codeType="process"
            />
            <InvitationCode
              invitation={invitation}
              profileId={profileId}
              accessToken={accessToken}
              loadInvitation={loadInvitation}
              codeType="preprocess"
            />

          </>
        )
      }
      <ChildInvitations invitation={invitation} />
    </>
  )
}

export default InvitationEditor
