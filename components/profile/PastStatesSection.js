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

const PastStatesSection = ({ email, pastStates }) => {
  const [messages, setMessages] = useState([])

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
    loadMessages()
  }, [email])

  return (
    <Flex vertical gap={2}>
      {pastStates.map((pastState, index) => {
        const message = messages.find((p) => {
          const timeDiff = p.cdate - pastState.date
          return timeDiff > 0 && timeDiff < 5000
        })

        return (
          <Space key={index} size="small" align="center" wrap>
            <span>
              {formatDateTime(pastState.date, {
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
          </Space>
        )
      })}
    </Flex>
  )
}

export default PastStatesSection
