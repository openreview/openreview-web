import Link from 'next/link'
import { nanoid } from 'nanoid'
import React, { useReducer, useState } from 'react'
import { formatDateTime, prettyId, urlFromGroupId } from '../lib/utils'
import Dropdown, { TimezoneDroopdown } from './Dropdown'
import DatetimePicker from './DatetimePicker'

const GroupIdList = ({ groupIds }) => {
  const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']
  if (!Array.isArray(groupIds)) return ''
  return groupIds.map((groupId, index) => {
    if (commonGroups.includes(groupId)) {
      return (
        <React.Fragment key={nanoid()}>
          {index > 0 && ', '}
          {prettyId(groupId)}
        </React.Fragment>
      )
    }
    return (
      <React.Fragment key={nanoid()}>
        {index > 0 && ', '}
        <Link href={urlFromGroupId(groupId)}><a>{prettyId(groupId)}</a></Link>
      </React.Fragment>
    )
  })
}

const InvitationGeneralInfo = ({ invitation }) => {
  const parentGroupId = invitation.id.split('/-/')[0]
  const isV1Invitation = !invitation.edit
  console.log(invitation)
  const trueFalseOptions = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ]

  const [isEditMode, setIsEditMode] = useState(false)
  const generalInfoReducer = (state, action) => state
  const [generalInfo, setGeneralInfo] = useReducer(generalInfoReducer, invitation)

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
                  <input className="form-control input-sm" value={invitation.super} onChange={e => setGeneralInfo({ type: 'super', payload: e.target.value })} />
                </div>
              </div>
            )}
            <div className="row d-flex">
              <span className="info-title edit-title">Readers:</span>
              <div className="info-edit-control">
                <input className="form-control input-sm" value={invitation.readers?.join(', ')} onChange={e => setGeneralInfo({ type: 'readers', payload: e.target.value })} />
              </div>
            </div>
            <div className="row d-flex">
              <span className="info-title edit-title">Non-Readers:</span>
              <div className="info-edit-control">
                <input className="form-control input-sm" value={invitation.nonreaders?.join(', ')} onChange={e => setGeneralInfo({ type: 'nonreaders', payload: e.target.value })} />
              </div>
            </div>
            <div className="row d-flex">
              <span className="info-title edit-title">Writers:</span>
              <div className="info-edit-control">
                <input className="form-control input-sm" value={invitation.writers?.join(', ')} onChange={e => setGeneralInfo({ type: 'writers', payload: e.target.value })} />
              </div>
            </div>
            <div className="row d-flex">
              <span className="info-title edit-title">Invitees:</span>
              <div className="info-edit-control">
                <input className="form-control input-sm" value={invitation.invitees?.join(', ')} onChange={e => setGeneralInfo({ type: 'invitees', payload: e.target.value })} />
              </div>
            </div>
            <div className="row d-flex">
              <span className="info-title edit-title">Non-Invitees:</span>
              <div className="info-edit-control">
                <input className="form-control input-sm" value={invitation.noninvitees?.join(', ')} onChange={e => setGeneralInfo({ type: 'noninvitees', payload: e.target.value })} />
              </div>
            </div>
            {
              isV1Invitation && (
                <div className="row d-flex">
                  <span className="info-title edit-title">Final Fields:</span>
                  <div className="info-edit-control">
                    <input className="form-control input-sm" value={invitation.final?.join(', ')} onChange={e => setGeneralInfo({ type: 'final', payload: e.target.value })} />
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
                      onChange={e => setGeneralInfo({ type: 'multiReply', value: e.value })}
                      value={invitation.multiReply ? { value: true, label: 'True' } : { value: false, label: 'False' }}
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
                    <input type="number" className="form-control input-sm" value={invitation.taskCompletionCount?.join(', ')} onChange={e => setGeneralInfo({ type: 'taskCompletionCount', payload: e.target.value })} />
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
                      onChange={e => setGeneralInfo({ type: 'hideOriginalRevisions', value: e.value })}
                      value={invitation.hideOriginalRevisions ? { value: true, label: 'True' } : { value: false, label: 'False' }}
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
                    <input type="number" className="form-control input-sm" value={invitation.maxReplies?.join(', ')} onChange={e => setGeneralInfo({ type: 'maxReplies', payload: e.target.value })} />
                  </div>
                </div>
              )
            }
            {
              !isV1Invitation && (
                <div className="row d-flex">
                  <span className="info-title edit-title">Min Replies:</span>
                  <div className="info-edit-control">
                    <input type="number" className="form-control input-sm" value={invitation.minReplies?.join(', ')} onChange={e => setGeneralInfo({ type: 'minReplies', payload: e.target.value })} />
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
                      onChange={e => setGeneralInfo({ type: 'bulk', value: e.value })}
                      value={invitation.bulk ? { value: true, label: 'True' } : { value: false, label: 'False' }}
                    />
                  </div>
                </div>
              )
            }
            <div className="row d-flex">
              <span className="info-title edit-title">Activation Date:</span>
              <div className="info-edit-control">
                <div className="d-flex">
                  <DatetimePicker />
                  <TimezoneDroopdown className="timezone-dropdown" />
                </div>
              </div>
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
            {invitation.nonreaders.length > 0 && (
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
            {invitation.noninvitees.length > 0 && (
              <div className="row d-flex">
                <span className="info-title">Non-Invitees:</span>
                <GroupIdList groupIds={invitation.noninvitees} />
              </div>
            )}
            {isV1Invitation && invitation.final.length > 0 && (
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

const InvitationEditor = ({ invitation }) => {
  const abc = 123

  if (!invitation) return null
  return (
    <>
      <div id="header">
        <h1>{prettyId(invitation.id)}</h1>
      </div>
      <InvitationGeneralInfo invitation={invitation} />
    </>
  )
}

export default InvitationEditor
