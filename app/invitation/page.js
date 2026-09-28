import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import EditBanner from '../../components/EditBanner'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import { invitationModeToggle } from '../../lib/banner-links'
import { prettyId } from '../../lib/utils'
import { generateInvitationWebfieldCode } from '../../lib/webfield-utils'
import serverAuth from '../auth'
import CommonLayout from '../CommonLayout'
import ComponentInvitation from './ComponentInvitation'
import CustomInvitation from './CustomInvitation'

import styles from './Invitation.module.scss'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams
  const invitationTitle = prettyId(id)

  return {
    title: `${invitationTitle} | OpenReview`,
    description: '',
    openGraph: {
      title: invitationTitle,
      description: '',
    },
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay message="'Invitation ID is required'" />
  const { token: accessToken, user } = await serverAuth()

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let invitation
  try {
    invitation = await api.getInvitationById(id, accessToken, null, null, remoteIpAddress)
    if (!invitation) {
      throw new Error(`The Invitation ${id} was not found`)
    }
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.log('Error in get invitation', {
      page: 'invitation',
      user: user?.id,
      apiError: error,
      apiRequest: {
        params: { id },
      },
    })
    if (error.name === 'ForbiddenError') {
      if (!accessToken) {
        redirect(`/login?redirect=/invitation?${encodeURIComponent(stringify(query))}`)
      }
      return <ErrorDisplay message="You don't have permission to read this invitation" />
    }
    return <ErrorDisplay message={error.message} />
  }

  const isWebfieldComponent = invitation.web?.startsWith('// Webfield component')
  const editBanner = invitation.details?.writable ? (
    <EditBanner>{invitationModeToggle('view', id)}</EditBanner>
  ) : null

  if (!isWebfieldComponent)
    return (
      <CommonLayout banner={null} editBanner={editBanner}>
        <div className={styles.invitation}>
          <CustomInvitation
            webfieldCode={generateInvitationWebfieldCode(invitation, query)}
            user={user}
          />
        </div>
      </CommonLayout>
    )

  const domainGroupP = invitation.domain
    ? api
        .get('/groups', { id: invitation.domain }, { accessToken, remoteIpAddress })
        .then((apiRes) => (apiRes.groups?.length > 0 ? apiRes.groups[0] : null))
        .catch(() => null)
    : Promise.resolve(null)

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.invitation}>
        <ComponentInvitation
          invitation={invitation}
          domainGroupP={domainGroupP}
          user={user}
          query={query}
        />
      </div>
    </CommonLayout>
  )
}
