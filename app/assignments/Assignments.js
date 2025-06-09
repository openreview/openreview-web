'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '../../lib/api-client'
import V2Assignments from './V2Assignments'
import LoadingSpinner from '../../components/LoadingSpinner'
import styles from './Assignments.module.scss'
import ErrorDisplay from '../../components/ErrorDisplay'
import CommonLayout from '../CommonLayout'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import Banner from '../../components/Banner'

export default function Assignments({ accessToken }) {
  const [error, setError] = useState(null)
  const [configInvitation, setConfigInvitation] = useState(null)
  const [preferredEmailInvitationId, setPreferredEmailInvitationId] = useState(null)
  const searchParams = useSearchParams()
  const group = searchParams.get('group')
  const referrer = searchParams.get('referrer')

  const notFoundMessage =
    'There is currently no assignment configuration ready for use. Please go to your venue request form and use the Paper Matching Setup to compute conflicts and/or affinity scores.'

  const getPreferredEmailInvitationId = async (invitation) => {
    try {
      const domainGroup = await api.getGroupById(invitation.domain, accessToken)
      setPreferredEmailInvitationId(domainGroup?.content?.preferred_emails_id?.value)
    } catch (_) {
      /* empty */
    }
  }

  const getConfigInvitation = async () => {
    try {
      const invitation = await api.getInvitationById(
        `${group}/-/Assignment_Configuration`,
        accessToken
      )
      if (invitation) {
        setConfigInvitation(invitation)
        getPreferredEmailInvitationId(invitation)
      } else {
        setError({
          statusCode: 404,
          message: notFoundMessage,
        })
      }
    } catch (apiError) {
      setError({
        statusCode: 404,
        message: notFoundMessage,
      })
    }
  }
  useEffect(() => {
    getConfigInvitation()
  }, [])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  if (!configInvitation)
    return (
      <CommonLayout>
        <LoadingSpinner />
      </CommonLayout>
    )
  if (configInvitation.apiVersion !== 2)
    return <ErrorDisplay message={'Old version of assignments is not supported'} />

  const banner = referrer ? referrerLink(referrer) : venueHomepageLink(group)
  return (
    <CommonLayout banner={<Banner>{banner}</Banner>}>
      <div className={styles.assignments}>
        <V2Assignments
          configInvitation={configInvitation}
          accessToken={accessToken}
          preferredEmailInvitationId={preferredEmailInvitationId}
        />
      </div>
    </CommonLayout>
  )
}
