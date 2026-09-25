import { UndoOutlined } from '@ant-design/icons'
import { Flex, Popover, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { orderBy } from 'lodash'
import React, { useState } from 'react'
import ActionButton from '../../app/user/moderation/ActionButton'
import api from '../../lib/api-client'
import { formatDateTime, prettyInvitationId } from '../../lib/utils'
import Icon from '../Icon'

import {
  colors,
  getBootstrap337LabelColor,
  getProfileStateLabelClass,
  moderation as legacyStyles,
} from '../../lib/legacy-bootstrap-styles'

dayjs.extend(utc)

const profileStateInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_State`

const formatDateOfBirth = (dob) => dayjs.utc(dob).format('MMMM DD, YYYY')

const formatYears = ({ start, end }) => {
  if (start) return `${start} – ${end ?? 'Present'}`
  return end ?? null
}

const formatHistory = ({ position, start, end, institution }) =>
  [position, institution?.name || institution?.domain, formatYears({ start, end })]
    .filter(Boolean)
    .join(', ')

const formatRelation = ({ relation, name, email, start, end }) =>
  [`${relation}: ${name}`, email, formatYears({ start, end })].filter(Boolean).join(', ')

const renderDetails = (rows) => {
  const details = rows.filter(([, value]) => value)
  if (!details.length) return null
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0.125rem 0.75rem' }}
    >
      {details.map(([label, value]) => (
        <React.Fragment key={label}>
          <span>{label}:</span>
          <span>{value}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

const BasicProfileEditInfo = ({ edit, popover, actions, children }) => {
  const isDeleted = Boolean(edit.ddate)
  const row = (
    <Space
      size="small"
      align="center"
      wrap
      style={{
        ...(popover && { cursor: 'pointer' }),
        ...(isDeleted && { textDecoration: 'line-through', opacity: 0.6 }),
      }}
    >
      {edit.tcdate && (
        <span>
          {formatDateTime(edit.tcdate, {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: undefined,
            timeZoneName: undefined,
            hour12: false,
          })}
        </span>
      )}
      <strong>{prettyInvitationId(edit.invitation)}</strong>
      {children}
      <span style={{ color: colors.subtleGray, fontSize: '0.85em' }}>{edit.tauthor}</span>
    </Space>
  )
  return (
    <Flex align="center" gap="small">
      {popover ? (
        <Popover
          content={popover}
          placement="top"
          styles={{
            content: {
              maxWidth: 480,
              maxHeight: '50vh',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            },
          }}
        >
          {row}
        </Popover>
      ) : (
        row
      )}
      {actions}
    </Flex>
  )
}

const renderProfileEdit = (edit, actions) => {
  switch (edit.invitation) {
    case profileStateInvitationId: {
      const reason = edit.content?.reason?.value
      const labels = edit.content?.labels?.value ?? []
      return (
        <BasicProfileEditInfo edit={edit} popover={reason}>
          <Tag
            color={getBootstrap337LabelColor(getProfileStateLabelClass(edit.profile.state))}
            variant="solid"
            styles={{ root: legacyStyles.statusTag }}
          >
            {edit.profile.state}
          </Tag>
          {labels.map((label) => (
            <Tag key={label} variant="outlined">
              {label}
            </Tag>
          ))}
        </BasicProfileEditInfo>
      )
    }
    default: {
      const { fullname, dob, history, relations } = edit.profile.content ?? {}
      const { source, comment } = edit.content ?? {}
      return (
        <BasicProfileEditInfo
          edit={edit}
          actions={actions}
          popover={renderDetails([
            ['Name', fullname?.value],
            ['Date of birth', dob && formatDateOfBirth(dob.value)],
            ['History', history && formatHistory(history.value)],
            ['Relation', relations && formatRelation(relations.value)],
            ['Document', source?.value],
            ['Comment', comment?.value],
          ])}
        />
      )
    }
  }
}

const ProfileEditsSection = ({ profileEdits, onEditUpdated }) => {
  const [pendingProfileEditId, setPendingProfileEditId] = useState(null)

  if (!profileEdits.length) return <p className="empty-message">No profile edits</p>

  const deleteRestoreProfileEdit = async (edit) => {
    setPendingProfileEditId(edit.id)
    try {
      const updatedEdit = await api.post('/profiles/edits', {
        id: edit.id,
        invitation: edit.invitation,
        signatures: edit.signatures,
        ddate: edit.ddate ? { delete: true } : Date.now(),
        content: edit.content,
        profile: edit.profile,
      })
      onEditUpdated(updatedEdit)
    } catch (apiError) {
      promptError(apiError.message)
    }
    setPendingProfileEditId(null)
  }

  return (
    <Flex vertical gap={2}>
      {orderBy(profileEdits, ['tcdate'], ['desc']).map((edit) => {
        const deleteOrRestoreButton = (
          <ActionButton
            loading={pendingProfileEditId === edit.id}
            onClick={() => deleteRestoreProfileEdit(edit)}
          >
            {edit.ddate ? (
              <UndoOutlined />
            ) : (
              <span style={{ top: '0px' }}>
                <Icon name="trash" />
              </span>
            )}
          </ActionButton>
        )
        return (
          <React.Fragment key={edit.id}>
            {renderProfileEdit(edit, deleteOrRestoreButton)}
          </React.Fragment>
        )
      })}
    </Flex>
  )
}

export default ProfileEditsSection
