/* globals promptError,promptMessage: false */

import React, { useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import SpinnerButton from '../SpinnerButton'
import EditorSection from '../EditorSection'
import GroupIdList, { InvitationIdList } from '../group/GroupIdList'
import api from '../../lib/api-client'
import {
  formatDateTime,
  getDefaultTimezone,
  getMetaInvitationId,
  prettyId,
  stringToArray,
  trueFalseOptions,
  urlFromGroupId,
} from '../../lib/utils'

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

  return (
    <div>
      {invitation.super && (
        <div className="row d-flex">
          <span className="info-title">Super Invitation:</span>
          <Link href={`/invitation/edit?id=${invitation.super}`}>
            {prettyId(invitation.super)}
          </Link>
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title">Parent Group:</span>
        <Link href={urlFromGroupId(parentGroupId, true)}>{prettyId(parentGroupId)}</Link>
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
      {invitation.final?.length > 0 && (
        <div className="row d-flex">
          <span className="info-title">Final Fields:</span>
          {invitation.final.join(', ')}
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title">Multi-Reply:</span>
        {invitation.multiReply?.toString()}
      </div>
      <div className="row d-flex">
        <span className="info-title">Completed After:</span>
        {invitation.taskCompletionCount}
      </div>
      <div className="row d-flex">
        <span className="info-title">Hide revisions:</span>
        {invitation.hideOriginalRevisions?.toString()}
      </div>
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

export const InvitationGeneralViewV2 = ({
  invitation,
  showEditButton = true,
  setIsEditMode,
  isMetaInvitation,
}) => {
  const parentGroupId = invitation.id.split('/-/')[0]

  return (
    <div>
      <div className="row d-flex">
        <span className="info-title">Parent Group:</span>
        <Link href={urlFromGroupId(parentGroupId, true)}>{prettyId(parentGroupId)}</Link>
      </div>
      <div className="row d-flex">
        <span className="info-title">Invitations:</span>
        <div>
          <InvitationIdList invitationIds={invitation.invitations} />
        </div>
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

      {!isMetaInvitation && (
        <div className="row d-flex">
          <span className="info-title">Max Replies:</span>
          {invitation.maxReplies}
        </div>
      )}
      {!isMetaInvitation && (
        <div className="row d-flex">
          <span className="info-title">Min Replies:</span>
          {invitation.minReplies}
        </div>
      )}
      <div className="row d-flex">
        <span className="info-title">Bulk:</span>
        {invitation.bulk?.toString()}
      </div>
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
      <div className="row d-flex">
        <span className="info-title">Last Modified:</span>
        {formatDateTime(invitation.mdate, { month: 'long', timeZoneName: 'short' }) ??
          formatDateTime(invitation.tmdate, { month: 'long', timeZoneName: 'short' })}
      </div>
      {invitation.ddate && (
        <div className="row d-flex">
          <span className="info-title">Deleted:</span>
          {formatDateTime(invitation.ddate, { month: 'long', timeZoneName: 'short' })}
        </div>
      )}
      {showEditButton && (
        <button type="button" className="btn btn-sm btn-primary" onClick={setIsEditMode}>
          Edit General Info
        </button>
      )}
      {showEditButton && (
        <Link
          href={`/invitation/revisions?id=${invitation.id}`}
          role="button"
          className="btn btn-sm btn-default edit-group-info"
        >
          View Invitation Revisions
        </Link>
      )}
    </div>
  )
}

const InvitationGeneralEdit = ({ invitation, accessToken, loadInvitation, setIsEditMode }) => {
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
    final: invitation.final?.join(', '),
    activationDateTimezone: getDefaultTimezone()?.value,
    duedateTimezone: getDefaultTimezone()?.value,
    expDateTimezone: getDefaultTimezone()?.value,
    signatures: invitation.signatures?.join(', '),
  })

  const constructInvitationToPost = () => {
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

  const saveGeneralInfo = async () => {
    setIsSaving(true)
    const requestBody = constructInvitationToPost()
    try {
      await api.post('/invitations', requestBody, { accessToken, version: 1 })
      promptMessage(`Settings for ${prettyId(invitation.id)} updated`, { scrollToTop: false })
      setIsEditMode(false)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
    setIsSaving(false)
  }

  return (
    <div>
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
      <div className="row d-flex">
        <span className="info-title edit-title">Multi-Reply:</span>
        <div className="info-edit-control">
          <Dropdown
            className="dropdown-select dropdown-sm"
            placeholder="Enable anonymous IDs"
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
      <div className="row d-flex">
        <span className="info-title edit-title">Hide Revisions:</span>
        <div className="info-edit-control">
          <Dropdown
            className="dropdown-select dropdown-sm"
            placeholder="Hide revisions"
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

const InvitationGeneralEditV2 = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  setIsEditMode,
  isMetaInvitation,
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const generalInfoReducer = (state, action) => {
    switch (action.type) {
      case 'activationDateTimezone':
        return {
          ...state,
          cdate: dayjs(state.cdate).tz(action.payload, true).valueOf(),
          activationDateTimezone: action.payload,
        }
      case 'deletionDateTimezone':
        return {
          ...state,
          ddate: dayjs(state.ddate).tz(action.payload, true).valueOf(),
          deletionDateTimezone: action.payload,
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
    activationDateTimezone: getDefaultTimezone()?.value,
    duedateTimezone: getDefaultTimezone()?.value,
    expDateTimezone: getDefaultTimezone()?.value,
    deletionDateTimezone: getDefaultTimezone()?.value,
    signatures: invitation.signatures?.join(', '),
  })

  const constructInvitationEditToPost = () => {
    const ddate =
      !generalInfo.ddate || Number.isNaN(parseInt(generalInfo.ddate, 10))
        ? { delete: true }
        : parseInt(generalInfo.ddate, 10)
    const duedate =
      !generalInfo.duedate || Number.isNaN(parseInt(generalInfo.duedate, 10))
        ? { delete: true }
        : parseInt(generalInfo.duedate, 10)
    const expdate =
      !generalInfo.expdate || Number.isNaN(parseInt(generalInfo.expdate, 10))
        ? { delete: true }
        : parseInt(generalInfo.expdate, 10)
    const maxReplies =
      !generalInfo.maxReplies || Number.isNaN(parseInt(generalInfo.maxReplies, 10))
        ? { delete: true }
        : parseInt(generalInfo.maxReplies, 10)
    const minReplies =
      !generalInfo.minReplies || Number.isNaN(parseInt(generalInfo.minReplies, 10))
        ? { delete: true }
        : parseInt(generalInfo.minReplies, 10)

    const invitationEdit = {
      invitation: {
        id: generalInfo.id,
        signatures: stringToArray(generalInfo.signatures),
        bulk: generalInfo.bulk,
        cdate: Number.isNaN(parseInt(generalInfo.cdate, 10))
          ? null
          : parseInt(generalInfo.cdate, 10),
        ddate,
        duedate,
        expdate,
        invitees: stringToArray(generalInfo.invitees),
        ...(!isMetaInvitation &&
          maxReplies && {
            maxReplies,
          }),
        ...(!isMetaInvitation &&
          minReplies && {
            minReplies,
          }),
        noninvitees: stringToArray(generalInfo.noninvitees),
        nonreaders: stringToArray(generalInfo.nonreaders),
        readers: stringToArray(generalInfo.readers),
        writers: stringToArray(generalInfo.writers),
        ...(isMetaInvitation && { edit: true }),
      },
      readers: [profileId],
      writers: [profileId],
      signatures: [profileId],
      ...(!isMetaInvitation && { invitations: getMetaInvitationId(invitation) }),
    }
    return invitationEdit
  }

  const saveGeneralInfo = async () => {
    setIsSaving(true)
    const requestBody = constructInvitationEditToPost()
    try {
      if (!isMetaInvitation && !requestBody.invitations) {
        throw new Error('No meta invitation found')
      }
      await api.post('/invitations/edits', requestBody, { accessToken })
      promptMessage(`Settings for ${prettyId(invitation.id)} updated`, { scrollToTop: false })
      setIsEditMode(false)
      loadInvitation(invitation.id)
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
    setIsSaving(false)
  }

  return (
    <div>
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
      {!isMetaInvitation && (
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
      {!isMetaInvitation && (
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
      <div className="row d-flex">
        <span className="info-title edit-title">Bulk:</span>
        <div className="info-edit-control">
          <Dropdown
            className="dropdown-select dropdown-sm"
            placeholder="Allow bulk updates"
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
        <span className="info-title edit-title">Deletion Date:</span>
        <div className="info-edit-control">
          <div className="d-flex">
            <DatetimePicker
              existingValue={generalInfo.ddate}
              timeZone={generalInfo.deletionDateTimezone}
              onChange={(e) => setGeneralInfo({ type: 'ddate', payload: e })}
            />
            <TimezoneDropdown
              className="timezone-dropdown dropdown-sm"
              value={generalInfo.deletionDateTimezone}
              onChange={(e) =>
                setGeneralInfo({ type: 'deletionDateTimezone', payload: e.value })
              }
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

export const InvitationGeneralV2 = ({
  invitation,
  profileId,
  accessToken,
  loadInvitation,
  isMetaInvitation,
}) => {
  const [isEditMode, setIsEditMode] = useState(false)

  return (
    <EditorSection title="General Info" className="general">
      {isEditMode ? (
        <InvitationGeneralEditV2
          invitation={invitation}
          profileId={profileId}
          accessToken={accessToken}
          loadInvitation={loadInvitation}
          setIsEditMode={setIsEditMode}
          isMetaInvitation={isMetaInvitation}
        />
      ) : (
        <InvitationGeneralViewV2
          invitation={invitation}
          setIsEditMode={() => setIsEditMode(true)}
          isMetaInvitation={isMetaInvitation}
        />
      )}
    </EditorSection>
  )
}

export default InvitationGeneral
