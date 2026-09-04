/* globals promptError: false */
import { Flex, Space, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatDateTime } from '../../lib/utils'

import {
  getBootstrap337LabelColor,
  getProfileStateLabelClass,
  moderation as legacyStyles,
} from '../../lib/legacy-bootstrap-styles'

const detailLineStyle = { display: 'block', maxWidth: '100%' }

// Shows the complete moderation message on hover: wide enough to read and with the
// message's own line breaks preserved.
const ReasonTooltip = ({ reason, children }) => (
  <Tooltip
    title={reason && <span style={{ whiteSpace: 'pre-wrap' }}>{reason}</span>}
    styles={{ root: { maxWidth: 480 } }}
  >
    {children}
  </Tooltip>
)

// One row of the state history. Both sources (Profile_State edits and the legacy
// pastStates + messages fallback) render through this, so the two stay visually
// identical: date, state tag, who set it, the moderation labels inline, and an
// optional second line only for details too long to sit on the row (a free-text
// reason without labels, or the legacy message link).
const PastStateRow = ({ date, state, setBy, labels, reason, children }) => (
  <div>
    <Space size="small" align="center" wrap>
      <Typography.Text>
        {formatDateTime(date, {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: undefined,
          timeZoneName: undefined,
          hour12: false,
        })}
      </Typography.Text>
      <Tag
        color={getBootstrap337LabelColor(getProfileStateLabelClass(state))}
        variant="solid"
        styles={{ root: legacyStyles.statusTag }}
      >
        {state}
      </Tag>

      {setBy && (
        <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
          {setBy}
        </Typography.Text>
      )}

      {labels?.length > 0 && (
        <ReasonTooltip reason={reason}>
          <Typography.Text style={{ fontSize: '0.85em' }}>
            {labels.join(', ')}
          </Typography.Text>
        </ReasonTooltip>
      )}
    </Space>

    {children}
  </div>
)

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
          const labels = edit.content?.labels?.value
          const reason = edit.content?.reason?.value

          return (
            <PastStateRow
              key={edit.id}
              date={edit.tcdate}
              state={edit.content?.state?.value}
              setBy={edit.tauthor ?? edit.signatures?.[0]}
              labels={labels}
              reason={reason}
            >
              {!labels?.length && reason && (
                <ReasonTooltip reason={reason}>
                  <Typography.Text ellipsis style={detailLineStyle}>
                    {reason}
                  </Typography.Text>
                </ReasonTooltip>
              )}
            </PastStateRow>
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
          <PastStateRow
            key={index}
            date={pastState.date}
            state={pastState.state}
            setBy={pastState.setBy}
          >
            {message && (
              <Typography.Link
                href={`${process.env.API_V2_URL}/messages?id=${message.id}`}
                target="_blank"
                rel="noreferrer"
                ellipsis
                style={detailLineStyle}
              >
                {message.content.text.replace(
                  /Your OpenReview profile (could not be activated|has been deactivated) for the following reason:\n/,
                  ''
                )}
              </Typography.Link>
            )}
          </PastStateRow>
        )
      })}
    </Flex>
  )
}

export default PastStatesSection
