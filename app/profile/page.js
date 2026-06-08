import { orderBy } from 'lodash'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import EditBanner from '../../components/EditBanner'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import { formatProfileData } from '../../lib/profiles'
import { prettyId } from '../../lib/utils'
import serverAuth, { isSuperUser } from '../auth'
import CommonLayout from '../CommonLayout'
import PreferredIdUpdater from './PreferredIdUpdater'
import Profile from './Profile'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const { user, token } = await serverAuth()
  const query = await searchParams
  const { id, email } = query

  if (!user && !id && !email)
    redirect(`/login?redirect=/profile?${encodeURIComponent(stringify(query))}`)
  if (email && !isSuperUser(user)) return <ErrorDisplay message="Profile id is required" />

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const isProfileOwner =
    (id && user?.profile?.usernames?.includes(id)) ||
    (email && user?.profile?.emails?.includes(email)) ||
    id === '' ||
    email === '' ||
    (!id && !email)

  let profileQuery
  if (isProfileOwner) {
    profileQuery = { id: user.profile.id }
  } else if (id) {
    profileQuery = { id }
  } else {
    profileQuery = { email }
  }

  let profileResult
  try {
    profileResult = await api.get('/profiles', profileQuery, {
      accessToken: token,
      remoteIpAddress,
    })
  } catch (error) {
    return <ErrorDisplay message="Profile not found" />
  }
  const profile = profileResult?.profiles?.[0]
  if (!profile)
    return (
      <ErrorDisplay message={`The profile ${id || email} does not exist or it's not public`} />
    )
  if (!profile.active && !isSuperUser(user)) {
    return (
      <ErrorDisplay statusCode={400} message={`The profile ${id || email} is not active`} />
    )
  }

  let serviceRoles = []
  if (isSuperUser(user)) {
    try {
      const serviceRolesResult = await api.get(
        '/tags',
        {
          profile: profile.id,
        },
        {
          remoteIpAddress,
        }
      )

      serviceRoles = orderBy(
        serviceRolesResult.tags?.filter((p) => p.parentInvitations?.endsWith('_Role')),
        ['cdate'],
        ['desc']
      )
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.log('Error in page', {
        page: 'Home',
        error,
      })
    }
  }

  const editBanner = isProfileOwner ? (
    <EditBanner>
      <span>
        Currently showing your profile in View mode. Switch to Edit mode:{' '}
        <Link href="/profile/edit" className="btn btn-xs btn-primary toggle-mode">
          Edit Profile
        </Link>
      </span>
    </EditBanner>
  ) : null

  const formattedProfile = formatProfileData(profile)

  try {
    const result = await api.get(
      '/tags',
      {
        invitation: `${process.env.SUPER_USER}/Support/-/Vouch`,
        signature: profile.id,
      },
      { accessToken: token, remoteIpAddress }
    )
    const vouchByUsername = new Map(
      result.tags.map((tag) => {
        let decoded = {}
        try {
          decoded = JSON.parse(tag.label ?? '') ?? {}
        } catch {
          decoded = {}
        }
        return [
          tag.profile,
          {
            relation: decoded.relation ?? '',
            username: tag.profile,
            start: decoded.start ?? null,
            end: decoded.end ?? null,
            readers: ['everyone'],
            vouched: true,
          },
        ]
      })
    )
    if (vouchByUsername.size) {
      const relations = (formattedProfile.relations ?? []).map((relation) => {
        const vouch = vouchByUsername.get(relation.username)
        if (!vouch) return relation
        vouchByUsername.delete(relation.username)
        return { ...relation, ...vouch, name: relation.name ?? prettyId(vouch.username) }
      })

      const reconstructed = [...vouchByUsername.values()].map((vouch) => ({
        ...vouch,
        name: prettyId(vouch.username),
      }))
      formattedProfile.relations = [...relations, ...reconstructed]
    }
  } catch {}

  const { preferredId } = formattedProfile
  const shouldRedirect = email || id !== preferredId || (!email && !id)

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <PreferredIdUpdater shouldRedirect={shouldRedirect} preferredId={preferredId}>
        <Profile
          profile={formattedProfile}
          publicProfile={!isProfileOwner}
          serviceRoles={serviceRoles}
          remoteIpAddress={remoteIpAddress}
        />
      </PreferredIdUpdater>
    </CommonLayout>
  )
}
