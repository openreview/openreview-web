import { Button, Col, Flex, Row } from 'antd'
import { useEffect, useState } from 'react'
import Icon from '../../../components/Icon'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import { formatDateTime } from '../../../lib/utils'

import { moderation as legacyStyles } from '../../../lib/legacy-bootstrap-styles'

const ConnectedAppsList = () => {
  const [connectedApps, setConnectedApps] = useState(null)

  const loadConnectedApps = async () => {
    try {
      const { consents } = await api.get('oidc/consents')
      setConnectedApps(consents)
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteConnectedApp = async (clientId, clientName) => {
    try {
      await api.delete(`oidc/consents/${clientId}`)
      promptMessage(`You are no longer connected to ${clientName}.`)
      loadConnectedApps()
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadConnectedApps()
  }, [])

  if (!connectedApps) return <LoadingSpinner />
  if (!connectedApps.length) return <p>There is no connected third-party apps or services.</p>

  return (
    <Flex vertical gap="small">
      <p>
        The following third-party apps or services can access your <strong>full name</strong>{' '}
        and <strong>OpenReview profile id</strong>:
      </p>
      {connectedApps.map((connectedApp) => {
        const { clientId, clientName, tcdate } = connectedApp
        return (
          <Row key={clientId} align="middle" gutter={[8, 8]}>
            <Col xs={24} md={12}>
              {clientName}
            </Col>
            <Col xs={20} md={10}>
              connected on {formatDateTime(tcdate)}
            </Col>
            <Col xs={4} md={2}>
              <Button
                size="small"
                type="primary"
                styles={{ root: legacyStyles.actionButton }}
                onClick={() => deleteConnectedApp(clientId, clientName)}
              >
                <span style={{ top: '0px' }}>
                  <Icon name="trash" />
                </span>
              </Button>
            </Col>
          </Row>
        )
      })}
    </Flex>
  )
}

export default ConnectedAppsList
