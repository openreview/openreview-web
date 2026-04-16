'use client'

import { Button, Card, Divider, Flex, Typography } from 'antd'
import { useState } from 'react'
import LoadingIcon from '../../../components/LoadingIcon'
import api from '../../../lib/api-client'
import CommonLayout from '../../CommonLayout'

const { Title, Text, Paragraph } = Typography

const scopeLabels = {
  openid: 'Access your OpenReview tilde ID',
  profile: 'Access full name set in your OpenReview profile',
}

const AuthorizeForm = ({ interactionId, clientName, scopes }) => {
  const [loading, setIsLoading] = useState(false)

  const handleAuthorizeDecision = async (approved) => {
    setIsLoading(true)
    try {
      const { redirectUri } = await api.post('/oidc/authorize/consent', {
        interactionId,
        approved,
      })
      window.location.href = redirectUri
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }

  return (
    <CommonLayout banner={null}>
      <Flex justify="center">
        <Card>
          <Flex vertical align="center" gap={8} style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>
              Sign in to {clientName}
            </Title>
            <Text type="secondary">with your OpenReview account</Text>
          </Flex>

          <Divider />

          <Paragraph>
            <Text strong>{clientName}</Text> wants to access your OpenReview profile.
          </Paragraph>
          <Paragraph>This will allow {clientName} to:</Paragraph>

          <Flex vertical gap={12}>
            <ul>
              {scopes.map((scope) => (
                <li key={scope}>
                  <Text>{scopeLabels[scope] ?? scope}</Text>
                </li>
              ))}
            </ul>
          </Flex>

          <Divider />

          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 24 }}>
            Make sure you trust {clientName}. You can revoke access at any time from your
            OpenReview profile password & security.
          </Paragraph>

          <Flex justify="end" gap={12}>
            <Button
              iconPlacement="end"
              loading={loading && { icon: <LoadingIcon /> }}
              onClick={() => handleAuthorizeDecision(false)}
            >
              Deny
            </Button>
            <Button
              type="primary"
              iconPlacement="end"
              loading={loading && { icon: <LoadingIcon /> }}
              onClick={() => handleAuthorizeDecision(true)}
            >
              Allow
            </Button>
          </Flex>
        </Card>
      </Flex>
    </CommonLayout>
  )
}

export default AuthorizeForm
