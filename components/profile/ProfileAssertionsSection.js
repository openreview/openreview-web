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

const BasicProfileAssertionInfo = ({ assertion, popover, actions, children }) => {
  const isDeleted = Boolean(assertion.ddate)
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
      {assertion.tcdate && (
        <span>
          {formatDateTime(assertion.tcdate, {
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
      <strong>{prettyInvitationId(assertion.invitation)}</strong>
      {children}
      <span style={{ color: colors.subtleGray, fontSize: '0.85em' }}>{assertion.tauthor}</span>
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

const renderProfileAssertion = (assertion, actions) => {
  switch (assertion.invitation) {
    case profileStateInvitationId: {
      const reason = assertion.content?.reason?.value
      const labels = assertion.content?.labels?.value ?? []
      const email = assertion.content?.email?.value
      return (
        <BasicProfileAssertionInfo assertion={assertion} popover={reason}>
          <Tag
            color={getBootstrap337LabelColor(
              getProfileStateLabelClass(assertion.profile.state)
            )}
            variant="solid"
            styles={{ root: legacyStyles.statusTag }}
          >
            {assertion.profile.state}
          </Tag>
          {email}
          {labels.map((label) => (
            <Tag key={label} variant="outlined">
              {label}
            </Tag>
          ))}
        </BasicProfileAssertionInfo>
      )
    }
    default: {
      const { names, dob, history, relations } = assertion.profile.content ?? {}
      const { source, comment } = assertion.content ?? {}
      return (
        <BasicProfileAssertionInfo
          assertion={assertion}
          actions={actions}
          popover={renderDetails([
            ['Name', names?.value?.add?.[0]?.fullname],
            ['Date of birth', dob && formatDateOfBirth(dob.value)],
            ['History', history && formatHistory(history.value.add[0])],
            ['Relation', relations && formatRelation(relations.value.add[0])],
            ['Document', source?.value],
            ['Comment', comment?.value],
          ])}
        />
      )
    }
  }
}

const ProfileAssertionsSection = ({ profileAssertions, onAssertionUpdated }) => {
  const [pendingProfileAssertionId, setPendingProfileAssertionId] = useState(null)

  if (!profileAssertions.length) return <p className="empty-message">No profile assertions</p>

  const deleteRestoreProfileAssertion = async (assertion) => {
    setPendingProfileAssertionId(assertion.id)
    try {
      const updatedAssertion = await api.post('/profiles/assertions', {
        id: assertion.id,
        invitation: assertion.invitation,
        signatures: assertion.signatures,
        ddate: assertion.ddate ? { delete: true } : Date.now(),
        content: assertion.content,
        profile: assertion.profile,
      })
      onAssertionUpdated(updatedAssertion)
    } catch (apiError) {
      promptError(apiError.message)
    }
    setPendingProfileAssertionId(null)
  }

  return (
    <Flex vertical gap={2}>
      {orderBy(profileAssertions, ['tcdate'], ['desc']).map((assertion) => {
        const deleteOrRestoreButton = (
          <ActionButton
            loading={pendingProfileAssertionId === assertion.id}
            onClick={() => deleteRestoreProfileAssertion(assertion)}
          >
            {assertion.ddate ? (
              <UndoOutlined />
            ) : (
              <span style={{ top: '0px' }}>
                <Icon name="trash" />
              </span>
            )}
          </ActionButton>
        )
        return (
          <React.Fragment key={assertion.id}>
            {renderProfileAssertion(assertion, deleteOrRestoreButton)}
          </React.Fragment>
        )
      })}
    </Flex>
  )
}

export default ProfileAssertionsSection
