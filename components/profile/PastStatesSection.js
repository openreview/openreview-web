/* globals promptError: false */
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatDateTime, getProfileStateLabelClass } from '../../lib/utils'
import styles from '../../styles/components/PastStatesSection.module.scss'

const PastStatesSection = ({ email, pastStates, accessToken }) => {
  const [messages, setMessages] = useState([])

  const loadMessages = async () => {
    try {
      const apiRes = await api.get(
        '/messages',
        {
          to: email,
          subject: 'OpenReview profile activation status',
          limit: 5,
        },
        { accessToken }
      )

      setMessages(apiRes.messages || [])
    } catch (apiError) {
      /* empty */
    }
  }
  useEffect(() => {
    loadMessages()
  }, [email])

  return (
    <div className={styles.pastStatesContainer}>
      {pastStates.map((pastState, index) => {
        const message = messages.find((p) => {
          const timeDiff = p.cdate - pastState.date
          return timeDiff > 0 && timeDiff < 5000
        })

        return (
          <div key={index} className={styles.pastState}>
            <span className={styles.pastStateDate}>
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
            <span
              className={`${styles.pastStateLabel} ${getProfileStateLabelClass(pastState.state)}`}
            >
              {pastState.state}
            </span>

            {message && (
              <a
                href={`${process.env.API_V2_URL}/messages?id=${message.id}`}
                className={`log-link ${styles.pastStateMessage}`}
                target="_blank"
                rel="noreferrer"
              >
                {message.content.text.replace(
                  /Your OpenReview profile (could not be activated|has been deactivated) for the following reason:\n/,
                  ''
                )}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PastStatesSection
