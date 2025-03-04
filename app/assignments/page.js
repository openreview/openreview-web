import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { Suspense } from 'react'
import { prettyId } from '../../lib/utils'
import serverAuth from '../auth'
import CommonLayout from '../CommonLayout'
import Banner from '../../components/Banner'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import Assignments from './Assignments'
import LoadingSpinner from '../../components/LoadingSpinner'
import V1Assignments from './V1Assignments'
import styles from './Assignments.module.scss'
import ErrorDisplay from '../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { group } = await searchParams

  return {
    title: `${prettyId(group)} Assignments | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { group, referrer } = query
  const { token: accessToken, user } = await serverAuth()
  if (!accessToken) redirect(`/login?redirect=/assignments?${stringify(query)}`)
  if (!group)
    return <ErrorDisplay message="Could not list assignments. Missing parameter group." />

  const banner = referrer ? referrerLink(referrer) : venueHomepageLink(group)

  const notFoundMessage =
    'There is currently no assignment configuration ready for use. Please go to your venue request form and use the Paper Matching Setup to compute conflicts and/or affinity scores.'

  let configInvitation = null
  let preferredEmailInvitationId = null
  try {
    configInvitation = await api.getInvitationById(
      `${group}/-/Assignment_Configuration`,
      accessToken
    )
    const domainGroup = await api.getGroupById(configInvitation.domain, accessToken)
    preferredEmailInvitationId = domainGroup?.content?.preferred_emails_id?.value
  } catch (error) {
    console.log('Error in configInvitation', {
      page: 'assignments',
      user: user?.id,
      apiError: error,
      apiRequest: {
        endpoint: 'getInvitationById',
        params: { id: `${group}/-/Assignment_Configuration` },
      },
    })
    return <ErrorDisplay message={notFoundMessage} />
  }
  if (!configInvitation) {
    console.log('Error in page', {
      page: 'assignments',
      user: user?.id,
      apiError: 'No config invitation',
    })
    return <ErrorDisplay message={notFoundMessage} />
  }

  const assignmentNotesP =
    configInvitation.apiVersion === 2
      ? api
          .get(
            '/notes',
            {
              invitation: `${query.group}/-/Assignment_Configuration`,
            },
            { accessToken, version: 2 }
          )
          .then((response) => {
            const { notes, count } = response
            return { notes, count }
          })
          .catch((error) => {
            console.log('Error in assignmentNotesP', {
              page: 'assignments',
              user: user?.id,
              apiError: error,
              apiRequest: {
                endpoint: '/notes',
                params: { invitation: `${query.group}/-/Assignment_Configuration` },
              },
            })
            return { errorMessage: error.message }
          })
      : Promise.resolve(null)

  return (
    <CommonLayout banner={<Banner>{banner}</Banner>}>
      <Suspense fallback={<LoadingSpinner />}>
        <div className={styles.assignments}>
          {configInvitation.apiVersion === 2 ? (
            <Assignments
              assignmentNotesP={assignmentNotesP}
              query={query}
              configInvitation={configInvitation}
              accessToken={accessToken}
              preferredEmailInvitationId={preferredEmailInvitationId}
            />
          ) : (
            <V1Assignments
              configInvitation={configInvitation}
              query={query}
              accessToken={accessToken}
            />
          )}
        </div>
      </Suspense>
    </CommonLayout>
  )
}
