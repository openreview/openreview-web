import { InfoCircleFilled } from '@ant-design/icons'
import { Alert, Button } from 'antd'
import { useEffect, useState } from 'react'
import api from '../../../lib/api-client'

export default function MFADisabledAlert() {
  const [isMFADisabled, setIsMFADisabled] = useState(false)

  const loadMFAStatus = async () => {
    try {
      const { enabled } = await api.get('/mfa/status')
      setIsMFADisabled(enabled === false)
    } catch {}
  }

  useEffect(() => {
    loadMFAStatus()
  }, [])

  if (!isMFADisabled) return null

  return (
    <Alert
      type="warning"
      icon={<InfoCircleFilled />}
      showIcon
      title="Multi-factor authentication is disabled for your profile. Please set it up to secure your OpenReview profile."
      action={
        <Button type="primary" href="/profile/password-security" target="_blank">
          Set up
        </Button>
      }
    />
  )
}
