/* globals promptMessage,promptError: false */

import { Collapse } from 'antd'
import { useState } from 'react'
import { ResetForm } from '../../reset/Reset'
import ConnectedAppsList from './ConnectedAppsList'
import MultiFactorAuthenticationSetup from './MultiFactorAuthenticationSetup'

const ProfilePasswordSecurity = ({ profile }) => {
  const [activeSection, setActiveSection] = useState('multiFactorAuth')

  const items = [
    {
      key: 'passwordReset',
      label: 'Password Reset',
      children: (
        <ResetForm
          user={{ profile }}
          setEmailSent={() => {
            promptMessage(
              'You will receive an email with the subject &quot;OpenReview Password Reset&quot;. Please follow the link in this email to reset your password.'
            )
            setActiveSection(null)
          }}
        />
      ),
    },
    {
      key: 'multiFactorAuth',
      label: 'Multi-Factor Authentication',
      children: <MultiFactorAuthenticationSetup />,
    },
    {
      key: 'connectedApps',
      label: 'Third-party apps & services',
      children: <ConnectedAppsList />,
      styles: { body: { maxWidth: 'none' } },
    },
  ]

  return (
    <Collapse
      accordion
      activeKey={activeSection}
      onChange={(key) => setActiveSection(key)}
      destroyOnHidden
      ghost
      items={items}
      styles={{
        header: { fontSize: '1.25rem', fontWeight: 'bold', alignItems: 'center' },
        body: { maxWidth: 'fit-content' },
      }}
    />
  )
}

export default ProfilePasswordSecurity
