/* globals promptError,promptMessage: false */

import React, { useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import SpinnerButton from '../SpinnerButton'
import EditorSection from '../EditorSection'
import GroupIdList from '../group/GroupIdList'
import api from '../../lib/api-client'
import { formatDateTime, getDefaultTimezone, prettyId, urlFromGroupId } from '../../lib/utils'

dayjs.extend(timezone)
dayjs.extend(utc)

const DatetimePicker = dynamic(() => import('../DatetimePicker'))
const Dropdown = dynamic(() => import('../Dropdown'))
const TimezoneDropdown = dynamic(() =>
  import('../Dropdown').then((mod) => mod.TimezoneDropdown)
)

export const InvitationGeneralView = ({
  invitation,
  showEditButton = true,
  setIsEditMode,
}) => {
  const parentGroupId = invitation.id.split('/-/')[0]
  const isV1Invitation = invitation.apiVersion === 1

  return (
    <div>
      {isV1Invitation && invitation.super && (
        <div className="row d-flex">
          <span className="info-title">Super Invitation:</span>
          <Link href={`/invitation/edit?id=${invitation.super}`}>
            <a>{prettyId(invitation.super)}</a>
          </Link>
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title">Parent Group:</span>
        <Link href={urlFromGroupId(parentGroupId, true)}>
          <a>{prettyId(parentGroupId)}</a>
        </Link>
      </div>
      <div className="row d-flex">
        <span className="info-title">Readers:</span>
        <div>
          <GroupIdList groupIds={invitation.readers} />
        </div>
      </div>
      {invitation.nonreaders?.length > 0 && (
        <div className="row d-flex">
          <span className="info-title">Non-readers:</span>
          <div>
            <GroupIdList groupIds={invitation.nonreaders} />
          </div>
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title">Writers:</span>
        <div>
          <GroupIdList groupIds={invitation.writers} />
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title">Invitees:</span>
        <div>
          <GroupIdList groupIds={invitation.invitees} />
        </div>
      </div>
      {invitation.noninvitees?.length > 0 && (
        <div className="row d-flex">
          <span className="info-title">Non-Invitees:</span>
          <div>
            <GroupIdList groupIds={invitation.noninvitees} />
          </div>
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
        <div>
          <GroupIdList groupIds={invitation.signatures} />
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title">Creation Date:</span>
        {formatDateTime(invitation.tcdate, { month: 'long', timeZoneName: 'short' })}
      </div>
      <div className="row d-flex">
        <span className="info-title">Activation Date:</span>
        {formatDateTime(invitation.cdate, { month: 'long', timeZoneName: 'short' }) ??
          formatDateTime(invitation.tcdate, { month: 'long', timeZoneName: 'short' })}
      </div>
      <div className="row d-flex">
        <span className="info-title">Modified Date:</span>
        {formatDateTime(invitation.mdate, { month: 'long', timeZoneName: 'short' }) ??
          formatDateTime(invitation.tmdate, { month: 'long', timeZoneName: 'short' })}
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
        {formatDateTime(invitation.mdate, { month: 'long', timeZoneName: 'short' }) ??
          formatDateTime(invitation.tmdate, { month: 'long', timeZoneName: 'short' })}
      </div>
      {showEditButton && (
        <button type="button" className="btn btn-sm btn-primary" onClick={setIsEditMode}>
          Edit General Info
        </button>
      )}
    </div>
  )
}

const InvitationGeneralEdit = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  setIsEditMode,
}) => {
  const isV1Invitation = invitation.apiVersion === 1
  const trueFalseOptions = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ]
  const [isSaving, setIsSaving] = useState(false)
  const generalInfoReducer = (state, action) => {
    switch (action.type) {
      case 'activationDateTimezone':
        return {
          ...state,
          cdate: dayjs(state.cdate).tz(action.payload, true).valueOf(),
          activationDateTimezone: action.payload,
        }
      case 'duedateTimezone':
        return {
          ...state,
          duedate: dayjs(state.duedate).tz(action.payload, true).valueOf(),
          duedateTimezone: action.payload,
        }
      case 'expDateTimezone':
        return {
          ...state,
          expdate: dayjs(state.expdate).tz(action.payload, true).valueOf(),
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
    signatures: invitation.signatures?.join(', '),
  })

  // eslint-disable-next-line arrow-body-style
  const stringToArray = (value) => {
    return value?.split(',')?.flatMap((p) => (p.trim() ? p.trim() : []))
  }

  const constructInvitationToPost = async () => {
    const {
      activationDateTimezone,
      duedateTimezone,
      expDateTimezone,
      apiVersion,
      rdate,
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
      signatures: stringToArray(generalInfo.signatures),
    }
  }

  const constructInvitationEditToPost = async () => {
    const invitationEdit = {
      invitation: {
        id: generalInfo.id,
        signatures: stringToArray(generalInfo.signatures),
        bulk: generalInfo.bulk,
        cdate: Number.isNaN(parseInt(generalInfo.cdate, 10))
          ? null
          : parseInt(generalInfo.cdate, 10),
        duedate: Number.isNaN(parseInt(generalInfo.duedate, 10))
          ? null
          : parseInt(generalInfo.duedate, 10),
        expdate: Number.isNaN(parseInt(generalInfo.expdate, 10))
          ? null
          : parseInt(generalInfo.expdate, 10),
        invitees: stringToArray(generalInfo.invitees),
        maxReplies: Number.isNaN(Number(generalInfo.maxReplies))
          ? null
          : Number(generalInfo.maxReplies),
        minReplies: Number.isNaN(Number(generalInfo.minReplies))
          ? null
          : Number(generalInfo.minReplies),
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
      const requestBody = isV1Invitation
        ? await constructInvitationToPost()
        : await constructInvitationEditToPost()
      await api.post(requestPath, requestBody, { accessToken, version: invitation.apiVersion })
      promptMessage(`Settings for '${prettyId(invitation.id)} updated`, { scrollToTop: false })
      setIsEditMode(false)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
    setIsSaving(false)
  }

  return (
    <div>
      {isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Super Invitation:</span>
          <div className="info-edit-control">
            <input
              className="form-control input-sm"
              value={generalInfo.super}
              onChange={(e) => setGeneralInfo({ type: 'super', payload: e.target.value })}
            />
          </div>
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title edit-title">Readers:</span>
        <div className="info-edit-control">
          <input
            className="form-control input-sm"
            value={generalInfo.readers}
            onChange={(e) => setGeneralInfo({ type: 'readers', payload: e.target.value })}
          />
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Non-Readers:</span>
        <div className="info-edit-control">
          <input
            className="form-control input-sm"
            value={generalInfo.nonreaders}
            onChange={(e) => setGeneralInfo({ type: 'nonreaders', payload: e.target.value })}
          />
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Writers:</span>
        <div className="info-edit-control">
          <input
            className="form-control input-sm"
            value={generalInfo.writers}
            onChange={(e) => setGeneralInfo({ type: 'writers', payload: e.target.value })}
          />
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Invitees:</span>
        <div className="info-edit-control">
          <input
            className="form-control input-sm"
            value={generalInfo.invitees}
            onChange={(e) => setGeneralInfo({ type: 'invitees', payload: e.target.value })}
          />
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Non-Invitees:</span>
        <div className="info-edit-control">
          <input
            className="form-control input-sm"
            value={generalInfo.noninvitees}
            onChange={(e) => setGeneralInfo({ type: 'noninvitees', payload: e.target.value })}
          />
        </div>
      </div>
      {isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Final Fields:</span>
          <div className="info-edit-control">
            <input
              className="form-control input-sm"
              value={generalInfo.final}
              onChange={(e) => setGeneralInfo({ type: 'final', payload: e.target.value })}
            />
          </div>
        </div>
      )}
      {isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Multi-Reply:</span>
          <div className="info-edit-control">
            <Dropdown
              className="dropdown-select dropdown-sm"
              placeholder="select whether to enable anonymous id"
              options={trueFalseOptions}
              onChange={(e) => setGeneralInfo({ type: 'multiReply', payload: e.value })}
              value={
                generalInfo.multiReply
                  ? { value: true, label: 'True' }
                  : { value: false, label: 'False' }
              }
            />
          </div>
        </div>
      )}
      {isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Completed After:</span>
          <div className="info-edit-control">
            <input
              type="number"
              className="form-control input-sm"
              value={generalInfo.taskCompletionCount}
              onChange={(e) =>
                setGeneralInfo({ type: 'taskCompletionCount', payload: e.target.value })
              }
            />
          </div>
        </div>
      )}
      {isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Hide Revisions:</span>
          <div className="info-edit-control">
            <Dropdown
              className="dropdown-select dropdown-sm"
              placeholder="select whether to hide revisions"
              options={trueFalseOptions}
              onChange={(e) =>
                setGeneralInfo({ type: 'hideOriginalRevisions', payload: e.value })
              }
              value={
                generalInfo.hideOriginalRevisions
                  ? { value: true, label: 'True' }
                  : { value: false, label: 'False' }
              }
            />
          </div>
        </div>
      )}
      {!isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Max Replies:</span>
          <div className="info-edit-control">
            <input
              type="number"
              className="form-control input-sm"
              value={generalInfo.maxReplies}
              onChange={(e) => setGeneralInfo({ type: 'maxReplies', payload: e.target.value })}
            />
          </div>
        </div>
      )}
      {!isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Min Replies:</span>
          <div className="info-edit-control">
            <input
              type="number"
              className="form-control input-sm"
              value={generalInfo.minReplies}
              onChange={(e) => setGeneralInfo({ type: 'minReplies', payload: e.target.value })}
            />
          </div>
        </div>
      )}
      {!isV1Invitation && (
        <div className="row d-flex">
          <span className="info-title edit-title">Bulk:</span>
          <div className="info-edit-control">
            <Dropdown
              className="dropdown-select dropdown-sm"
              placeholder="select whether to bulk"
              options={trueFalseOptions}
              onChange={(e) => setGeneralInfo({ type: 'bulk', payload: e.value })}
              value={
                generalInfo.bulk
                  ? { value: true, label: 'True' }
                  : { value: false, label: 'False' }
              }
            />
          </div>
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title edit-title">Activation Date:</span>
        <div className="info-edit-control">
          <div className="d-flex">
            <DatetimePicker
              existingValue={generalInfo.cdate}
              timeZone={generalInfo.activationDateTimezone}
              onChange={(e) => setGeneralInfo({ type: 'cdate', payload: e })}
            />
            <TimezoneDropdown
              className="timezone-dropdown dropdown-sm"
              value={generalInfo.activationDateTimezone}
              onChange={(e) =>
                setGeneralInfo({ type: 'activationDateTimezone', payload: e.value })
              }
            />
          </div>
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Due Date:</span>
        <div className="info-edit-control">
          <div className="d-flex">
            <DatetimePicker
              existingValue={generalInfo.duedate}
              timeZone={generalInfo.duedateTimezone}
              onChange={(e) => setGeneralInfo({ type: 'duedate', payload: e })}
            />
            <TimezoneDropdown
              className="timezone-dropdown dropdown-sm"
              value={generalInfo.duedateTimezone}
              onChange={(e) => setGeneralInfo({ type: 'duedateTimezone', payload: e.value })}
            />
          </div>
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Expiration Date:</span>
        <div className="info-edit-control">
          <div className="d-flex">
            <DatetimePicker
              existingValue={generalInfo.expdate}
              timeZone={generalInfo.expDateTimezone}
              onChange={(e) => setGeneralInfo({ type: 'expdate', payload: e })}
            />
            <TimezoneDropdown
              className="timezone-dropdown dropdown-sm"
              value={generalInfo.expDateTimezone}
              onChange={(e) => setGeneralInfo({ type: 'expDateTimezone', payload: e.value })}
            />
          </div>
        </div>
      </div>
      <div className="row d-flex">
        <span className="info-title edit-title">Signature:</span>
        <div className="info-edit-control">
          <input
            className="form-control input-sm"
            value={generalInfo.signatures}
            onChange={(e) => setGeneralInfo({ type: 'signatures', payload: e.target.value })}
          />
        </div>
      </div>

      <div className="row d-flex">
        <span className="info-title edit-title" />
        <SpinnerButton
          type="primary"
          onClick={() => saveGeneralInfo()}
          disabled={isSaving}
          loading={isSaving}
        >
          {isSaving ? 'Saving' : 'Save Invitation'}
        </SpinnerButton>

        <button
          type="button"
          className="btn btn-sm btn-default"
          onClick={() => setIsEditMode(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const InvitationGeneral = ({ invitation, profileId, accessToken, loadInvitation }) => {
  const [isEditMode, setIsEditMode] = useState(false)

  return (
    <EditorSection title="General Info" className="general">
      {isEditMode ? (
        <InvitationGeneralEdit
          invitation={invitation}
          profileId={profileId}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          setIsEditMode={setIsEditMode}
        />
      ) : (
        <InvitationGeneralView
          invitation={invitation}
          setIsEditMode={() => setIsEditMode(true)}
        />
      )}
    </EditorSection>
  )
}

export default InvitationGeneral
