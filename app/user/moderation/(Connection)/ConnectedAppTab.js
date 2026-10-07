'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Button, Checkbox, Col, Flex, Input, Modal, Row } from 'antd'
import { useEffect, useState } from 'react'
import Icon from '../../../../components/Icon'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import api from '../../../../lib/api-client'

import styles from './connectedApp.module.scss'
import { moderation as legacyStyles } from '../../../../lib/legacy-bootstrap-styles'

const modalWidth = { xs: '90%', sm: '70%', md: '50%' }

export default function ConnectedAppTab() {
  const [connectedApps, setConnectedApps] = useState(null)
  const [modalData, setModalData] = useState({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const loadConnectedApps = async () => {
    try {
      const { clients } = await api.get('/oidc/clients')
      setConnectedApps(clients)
    } catch (error) {
      promptError(error.message)
    }
  }

  const openAddModal = () => {
    setModalData({ scopes: ['openid', 'profile'] })
    setIsAddModalOpen(true)
  }

  const handleAddConnectedApp = async () => {
    const clientId = modalData.clientId?.trim()
    if (!clientId) {
      promptError('Client ID is required.')
      return
    }
    try {
      await api.post('/oidc/clients', {
        clientId,
        clientName: modalData.clientName?.trim() || undefined,
        redirectUris: modalData.redirectUris
          ? modalData.redirectUris
              .split(',')
              .map((u) => u.trim())
              .filter(Boolean)
          : [],
        scopes: modalData.scopes,
        trusted: false,
      })
      promptMessage(`${clientId} app has been added.`)
      setIsAddModalOpen(false)
      setModalData({})
      await loadConnectedApps()
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteConnectedApp = async (clientId) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${clientId}?`)
    if (!confirmed) return
    try {
      await api.delete(`/oidc/clients/${clientId}`)
      promptMessage(`${clientId} app has been deleted.`)
      await loadConnectedApps()
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadConnectedApps()
  }, [])

  if (!connectedApps) return <LoadingSpinner />

  return (
    <>
      <Row style={{ marginBottom: '0.75rem' }}>
        <Col>
          <Button
            type="primary"
            styles={{ root: legacyStyles.formButton }}
            icon={<PlusOutlined />}
            onClick={openAddModal}
          >
            Add Connected App
          </Button>
        </Col>
      </Row>

      {connectedApps.length > 0 && (
        <Row
          align="middle"
          gutter={[8, 0]}
          className={styles.columnheaders}
          style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
        >
          <Col xs={0} sm={2} md={2} lg={1} />
          <Col xs={0} sm={4} md={4} lg={4}>
            Client ID
          </Col>
          <Col xs={0} sm={4} md={4} lg={6}>
            Client Name
          </Col>
          <Col xs={0} sm={3} md={3} lg={3}>
            Trusted
          </Col>
          <Col xs={0} sm={3} md={3} lg={3}>
            Email Scope
          </Col>
          <Col xs={0} sm={8} md={8} lg={7}>
            Redirect URIs
          </Col>
        </Row>
      )}

      <Flex vertical gap="small" style={{ marginBottom: '1.5rem' }}>
        {connectedApps.map((app) => (
          <Row key={app.clientId} align="middle" gutter={[8, 0]}>
            <Col xs={4} sm={2} md={2} lg={1}>
              <Button
                size="small"
                type="primary"
                styles={{ root: legacyStyles.actionButton }}
                onClick={() => deleteConnectedApp(app.clientId)}
              >
                <span style={{ top: '0px' }}>
                  <Icon name="trash" />
                </span>
              </Button>
            </Col>
            <Col xs={20} sm={4} md={4} lg={4}>
              <strong>{app.clientId}</strong>
            </Col>
            <Col xs={24} sm={4} md={4} lg={6} className={styles.truncatedtext}>
              {app.clientName}
            </Col>
            <Col xs={24} sm={3} md={3} lg={3}>
              {app.trusted ? 'Yes' : 'No'}
            </Col>
            <Col xs={24} sm={3} md={3} lg={3}>
              {app.scopes?.includes('email') ? 'Yes' : 'No'}
            </Col>
            <Col xs={24} sm={8} md={8} lg={7} className={styles.truncatedtext}>
              {app.redirectUris?.join(', ')}
            </Col>
          </Row>
        ))}
      </Flex>

      {connectedApps.length === 0 && <p>No connected apps found.</p>}

      <Modal
        title="Add Connected App"
        open={isAddModalOpen}
        okText="Add"
        onCancel={() => {
          setIsAddModalOpen(false)
          setModalData({})
        }}
        onOk={handleAddConnectedApp}
        destroyOnHidden
        width={modalWidth}
      >
        <Flex vertical gap="small" style={{ marginTop: 12 }}>
          <div>
            <label>Client ID</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.clientId ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, clientId: e.target.value }))}
            />
          </div>
          <div>
            <label>Client Name</label>
            <Input
              style={legacyStyles.formInput}
              value={modalData.clientName ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, clientName: e.target.value }))}
            />
          </div>
          <div>
            <label>Redirect URIs</label>
            <Input
              placeholder="https://dev.openreview.net , https://openreview.net"
              style={legacyStyles.formInput}
              value={modalData.redirectUris ?? ''}
              onChange={(e) => setModalData((p) => ({ ...p, redirectUris: e.target.value }))}
            />
          </div>
          <div>
            <label>Scopes</label>
            <Flex gap="small" align="center">
              <Checkbox checked disabled>
                openid
              </Checkbox>
              <Checkbox checked disabled>
                profile
              </Checkbox>
              <Checkbox
                checked={!!modalData.scopes?.includes('email')}
                onChange={(e) =>
                  setModalData((p) => ({
                    ...p,
                    scopes: e.target.checked
                      ? ['openid', 'profile', 'email']
                      : ['openid', 'profile'],
                  }))
                }
              >
                email
              </Checkbox>
            </Flex>
          </div>
        </Flex>
      </Modal>
    </>
  )
}
