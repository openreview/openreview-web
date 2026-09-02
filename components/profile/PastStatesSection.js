/* globals promptError: false */
import { Flex, Space, Tag } from 'antd'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatDateTime } from '../../lib/utils'

import {
  colors,
  getBootstrap337LabelColor,
  getProfileStateLabelClass,
  moderation as legacyStyles,
} from '../../lib/legacy-bootstrap-styles'

const formatStateDate = (date) =>
  formatDateTime(date, {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: undefined,
    timeZoneName: undefined,
    hour12: false,
  })

const PastStatesSection = ({ email, pastStates, profileId }) => {
  const [statusEdits, setStatusEdits] = useState(null)
  const [messages, setMessages] = useState([])

  const loadStatusEdits = async () => {
    try {
      const apiRes = await api.get('/profiles/edits', {
        'profile.id': profileId,
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_State`,
        sort: 'tcdate:desc',
      })
      setStatusEdits(apiRes.edits ?? [])
    } catch (apiError) {
      setStatusEdits([])
    }
  }

  const loadMessages = async () => {
    try {
      const apiRes = await api.get('/messages', {
        to: email,
        subject: 'OpenReview profile activation status',
        limit: 5,
      })

      setMessages(apiRes.messages || [])
    } catch (apiError) {
      /* empty */
    }
  }

  useEffect(() => {
    setStatusEdits(null)
    setMessages([])
    if (profileId) {
      loadStatusEdits()
    } else {
      setStatusEdits([])
    }
  }, [profileId])

  // Messages are the legacy source of the state history; only fall back to them
  // when the profile has no moderation profile edits.
  useEffect(() => {
    if (statusEdits?.length === 0) loadMessages()
  }, [statusEdits, email])

  if (statusEdits?.length > 0) {
    return (
      <Flex vertical gap={2}>
        {statusEdits.map((edit) => {
          const status = edit.content?.state?.value
          const reason = edit.content?.reason?.value
          const labels = edit.content?.labels?.value

          return (
            <div key={edit.id}>
              <Space size="small" align="center" wrap>
                <span>{formatStateDate(edit.tcdate)}</span>
                <Tag
                  color={getBootstrap337LabelColor(getProfileStateLabelClass(status))}
                  variant="solid"
                  styles={{ root: legacyStyles.statusTag }}
                >
                  {status}
                </Tag>
                <span style={{ color: colors.subtleGray, fontSize: '0.85em' }}>
                  {edit.tauthor ?? edit.signatures?.[0]}
                </span>
              </Space>

              {(labels?.length || reason) && (
                <span
                  title={reason}
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    display: 'block',
                  }}
                >
                  {labels?.length ? labels.join(', ') : reason}
                </span>
              )}
            </div>
          )
        })}
      </Flex>
    )
  }

  return (
    <Flex vertical gap={2}>
      {pastStates.map((pastState, index) => {
        const message = messages.find((p) => {
          const timeDiff = p.cdate - pastState.date
          return timeDiff > 0 && timeDiff < 5000
        })

        return (
          <div key={index}>
            <Space size="small" align="center" wrap>
              <span>{formatStateDate(pastState.date)}</span>
              <Tag
                color={getBootstrap337LabelColor(getProfileStateLabelClass(pastState.state))}
                variant="solid"
                styles={{ root: legacyStyles.statusTag }}
              >
                {pastState.state}
              </Tag>

              {pastState.setBy && (
                <span style={{ color: colors.subtleGray, fontSize: '0.85em' }}>
                  {pastState.setBy}
                </span>
              )}
            </Space>

            {message && (
              <a
                href={`${process.env.API_V2_URL}/messages?id=${message.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {message.content.text.replace(
                  /Your OpenReview profile (could not be activated|has been deactivated) for the following reason:\n/,
                  ''
                )}
              </a>
            )}
          </div>
        )
      })}
    </Flex>
  )
}

export default PastStatesSection
