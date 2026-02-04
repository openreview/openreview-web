import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { headers } from 'next/headers'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import serverAuth from '../auth'
import { invitationModeToggle } from '../../lib/banner-links'
import EditBanner from '../../components/EditBanner'
import CommonLayout from '../CommonLayout'
import styles from './Invitation.module.scss'
import { generateInvitationWebfieldCode, parseComponentCode } from '../../lib/webfield-utils'
import CustomInvitation from './CustomInvitation'
import ComponentInvitation from './ComponentInvitation'
import ErrorDisplay from '../../components/ErrorDisplay'

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

  const componentObjP = invitation.domain
    ? api
        .get('/groups', { id: invitation.domain }, { accessToken, remoteIpAddress })
        .then((apiRes) => {
          const domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
          return parseComponentCode(invitation, domainGroup, user, query)
        })
        .catch((error) => parseComponentCode(invitation, null, user, query))
    : parseComponentCode(invitation, null, user, query)

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <div className={styles.invitation}>
        <ComponentInvitation componentObjP={componentObjP} />
      </div>
    </CommonLayout>
  )
}
