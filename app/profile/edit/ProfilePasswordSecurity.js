/* globals promptMessage,promptError: false */

import { useState } from 'react'
import { ResetForm } from '../../reset/Reset'
import MultiFactorAuthenticationSetup from './MultiFactorAuthenticationSetup'

import styles from '../../../styles/components/ProfilePasswordSecurity.module.scss'

const ProfilePasswordSecurity = ({ profile }) => {
  const [activeSection, setActiveSection] = useState('multiFactorAuth')
  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }
  return (
    <div className={styles.profilePasswordSecurityContainer}>
      <section>
        <div className={styles.sectionHeader}>
          <span
            className={styles.sectionHeaderText}
            onClick={() => toggleSection('passwordReset')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span className={styles.sectionHeaderIcon}>
              {activeSection === 'passwordReset' ? '▼' : '▶'}
            </span>
            Password Reset
          </span>
        </div>
        <div className={styles.sectionContent}>
          {activeSection === 'passwordReset' && (
            <ResetForm
              user={{ profile }}
              setEmailSent={() => {
                promptMessage(
                  'You will receive an email with the subject &quot;OpenReview Password Reset&quot;. Please follow the link in this email to reset your password.'
                )
                setActiveSection(null)
              }}
            />
          )}
        </div>
      </section>
      <section>
        <div className={styles.sectionHeader}>
          <span
            className={styles.sectionHeaderText}
            onClick={() => toggleSection('multiFactorAuth')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span className={styles.sectionHeaderIcon}>
              {activeSection === 'multiFactorAuth' ? '▼' : '▶'}
            </span>
            Multi-Factor Authentication
          </span>
        </div>
        <div className={styles.sectionContent}>
          {activeSection === 'multiFactorAuth' && <MultiFactorAuthenticationSetup />}
        </div>
      </section>
    </div>
  )
}

export default ProfilePasswordSecurity
