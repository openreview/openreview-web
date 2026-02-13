/* globals promptMessage,promptError: false */

import { useState } from 'react'
import { ResetForm } from '../../reset/Reset'
import styles from '../../../styles/components/ProfilePasswordSecurity.module.scss'
import MutltiFactorAuthentication from './MutiFactorAuthentication'

const ProfilePasswordSecurity = ({ profile }) => {
  const [activeSection, setActiveSection] = useState('multiFactorAuth')
  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }
  return (
    <div className={styles.profilePasswordSecurityContainer}>
      <section>
        <div className={styles.sectionHeader}>
          {activeSection === 'passwordReset' ? '▼' : '▶'}
          <span
            className={styles.sectionHeaderText}
            onClick={() => toggleSection('passwordReset')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
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
          {activeSection === 'multiFactorAuth' ? '▼' : '▶'}
          <span
            className={styles.sectionHeaderText}
            onClick={() => toggleSection('multiFactorAuth')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Multi-Factor Authentication
          </span>
        </div>
        <div className={styles.sectionContent}>
          {activeSection === 'multiFactorAuth' && <MutltiFactorAuthentication />}
        </div>
      </section>
    </div>
  )
}

export default ProfilePasswordSecurity
