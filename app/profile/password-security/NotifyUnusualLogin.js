import { InfoCircleOutlined } from '@ant-design/icons'
import { Col, Flex, Row, Space, Switch, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import { formatDateTime, getDeviceFromUserAgent } from '../../../lib/utils'

import { colors } from '../../../lib/legacy-bootstrap-styles'

dayjs.extend(relativeTime)

const NotifyUnusualLogin = () => {
  const [sendNotification, setSendNotification] = useState(null)
  const [loginHistory, setLoginHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const loadNotificationStatus = async () => {
    try {
      const { notifyUnusualLogins, knownLocations } = await api.get('/profiles/activity')
      setSendNotification(notifyUnusualLogins)
      setLoginHistory(orderBy(knownLocations, ['lastSeen'], ['desc']))
    } catch {
      setSendNotification(true)
    }
  }

  const updateSendNotification = async (checked) => {
    setLoading(true)
    try {
      await api.put('/profiles/activity/preferences', { notifyUnusualLogins: checked })
      setSendNotification(checked)
    } catch (error) {
      promptError(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadNotificationStatus()
  }, [])

  if (sendNotification === null) return <LoadingSpinner inline />
  return (
    <Space vertical style={{ width: '100%' }}>
      <Space>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Switch
            checkedChildren="On"
            unCheckedChildren="Off"
            checked={sendNotification}
            onChange={updateSendNotification}
            loading={loading}
          />
        </div>
        <span>Email me about unusual logins</span>
      </Space>
      {loginHistory.length > 0 && (
        <div style={{ maxWidth: '640px' }}>
          <h4>
            Recent Logins{' '}
            <Tooltip title="Locations are estimated from the IP address of each sign-in. They may not match your actual location if you use a VPN or mobile network. If you see a login you don't recognize, consider changing your password.">
              <InfoCircleOutlined style={{ color: colors.mediumBlue }} />
            </Tooltip>
          </h4>
          <Row gutter={[8, 0]} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            <Col xs={0} sm={8}>
              City
            </Col>
            <Col xs={0} sm={8}>
              Signed in
            </Col>
            <Col xs={0} sm={8}>
              Device
            </Col>
          </Row>
          <Flex vertical gap="small">
            {loginHistory.map((location, index) => (
              <Row key={index} align="middle" gutter={[8, 0]}>
                <Col xs={24} sm={8}>
                  {location.city}
                </Col>
                <Col xs={12} sm={8}>
                  <Tooltip title={formatDateTime(location.lastSeen)}>
                    <span>{dayjs(location.lastSeen).fromNow()}</span>
                  </Tooltip>
                </Col>
                <Col xs={12} sm={8}>
                  {getDeviceFromUserAgent(location.userAgent)}
                </Col>
              </Row>
            ))}
          </Flex>
        </div>
      )}
    </Space>
  )
}
export default NotifyUnusualLogin
