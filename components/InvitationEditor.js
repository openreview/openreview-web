/* globals promptError,promptMessage,moment: false */
import Link from 'next/link'
import { nanoid } from 'nanoid'
import React, { useReducer, useState } from 'react'
import {
  formatDateTime, getDefaultTimezone, prettyId, urlFromGroupId,
} from '../lib/utils'
import Dropdown, { TimezoneDropdown } from './Dropdown'
import DatetimePicker from './DatetimePicker'
import api from '../lib/api-client'

const GroupIdList = ({ groupIds }) => {
  const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']
  if (!Array.isArray(groupIds)) return ''
  return groupIds.map((groupId, index) => {
    if (commonGroups.includes(groupId)) {
      return (
        <React.Fragment key={nanoid()}>
          {index > 0 && <>,&nbsp;</>}
          {prettyId(groupId)}
        </React.Fragment>
      )
    }
    return (
      <React.Fragment key={nanoid()}>
        {index > 0 && <>,&nbsp;</>}
        <Link href={urlFromGroupId(groupId)}><a>{prettyId(groupId)}</a></Link>
      </React.Fragment>
    )
  })
}

const InvitationGeneralInfo = ({ invitation, accessToken, loadInvitation }) => {
  const parentGroupId = invitation.id.split('/-/')[0]
  const isV1Invitation = !invitation.edit
  const trueFalseOptions = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ]

  const [isEditMode, setIsEditMode] = useState(false)
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
    readers: invitation.readers.join(', '),
    nonreaders: invitation.nonreaders.join(', '),
    writers: invitation.writers.join(', '),
    invitees: invitation.invitees.join(', '),
    noninvitees: invitation.noninvitees.join(', '),
    ...(isV1Invitation && { final: invitation.final.join(', ') }),
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

  }

  const saveGeneralInfo = async () => {
    try {
      const requestPath = isV1Invitation ? '/invitations' : '/invitations/edits'
      const requestBody = isV1Invitation ? await constructInvitationToPost() : await constructInvitationEditToPost()
      const result = await api.post(requestPath, requestBody, { accessToken, version: isV1Invitation ? 1 : 2 })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`)
      setIsEditMode(false)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <section className="general">
      <h4>General Info</h4>
      {isEditMode
        ? (
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
              <button type="button" className="btn btn-sm btn-primary" onClick={() => saveGeneralInfo()}>Save Invitation</button>
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
              {formatDateTime({ timestamp: invitation.tcdate, month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Activation Date:</span>
              {formatDateTime({ timestamp: invitation.cdate, month: 'long', timeZoneName: 'short' }) ?? formatDateTime({ timestamp: invitation.tcdate, month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Modified Date:</span>
              {formatDateTime({ timestamp: invitation.mdate, month: 'long', timeZoneName: 'short' }) ?? formatDateTime({ timestamp: invitation.tmdate, month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Due Date:</span>
              {formatDateTime({ timestamp: invitation.duedate, month: 'long', timeZoneName: 'short' })}
            </div>
            <div className="row d-flex">
              <span className="info-title">Expiration Date:</span>
              {formatDateTime({ timestamp: invitation.expdate, month: 'long', timeZoneName: 'short' })}
            </div>
            {invitation.ddate && (
              <div className="row d-flex">
                <span className="info-title">Deleted:</span>
                {formatDateTime({ timestamp: invitation.ddate, month: 'long', timeZoneName: 'short' })}
              </div>
            )}
            <div className="row d-flex">
              <span className="info-title">Last Modified:</span>
              {formatDateTime({ timestamp: invitation.mdate, month: 'long', timeZoneName: 'short' }) ?? formatDateTime({ timestamp: invitation.tmdate, month: 'long', timeZoneName: 'short' })}
            </div>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setIsEditMode(true)}>Edit General Info</button>
          </>
        )}
    </section>
  )
}

const InvitationEditor = ({ invitation, accessToken, loadInvitation }) => {
  const abc = 123

  if (!invitation) return null
  return (
    <>
      <div id="header">
        <h1>{prettyId(invitation.id)}</h1>
      </div>
      {/* eslint-disable-next-line max-len */}
      <InvitationGeneralInfo key={nanoid()} invitation={invitation} accessToken={accessToken} loadInvitation={loadInvitation} />
    </>
  )
}

export default InvitationEditor
