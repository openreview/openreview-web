import { stringify } from 'query-string'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import serverAuth from '../../auth'
import api from '../../../lib/api-client'
import CommonLayout from '../../CommonLayout'
import { referrerLink } from '../../../lib/banner-links'
import { getGroupIdfromInvitation, prettyId } from '../../../lib/utils'
import Banner from '../../../components/Banner'
import V1Stats from './V1Stats'
import styles from './Stats.module.scss'
import { getNoteContentValues } from '../../../lib/forum-utils'
import Stats from './Stats'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ErrorDisplay from '../../../components/ErrorDisplay'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams
  const { token: accessToken } = await serverAuth()
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  try {
    const note = await api.getNoteById(id, accessToken, null, null, remoteIpAddress)
    const title = note.apiVersion === 2 ? note.content.title.value : note.content.title
    return {
      title: `${title} Stats | OpenReview`,
    }
  } catch (error) {
    return {
      title: 'OpenReview',
    }
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id, referrer } = query
  const { token: accessToken, user } = await serverAuth()
  if (!accessToken)
    redirect(`/login?redirect=/assignments/stats?${encodeURIComponent(stringify(query))}`)
  if (!id)
    return (
      <ErrorDisplay message="Could not load assignment statistics. Missing parameter id." />
    )

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  let note
  try {
    note = await api.getNoteById(id, accessToken, null, null, remoteIpAddress)
  } catch (error) {
    /* empty */
  }
  if (!note) {
    console.log('Error in getNoteById', {
      page: 'assignments/stats',
      user: user?.id,
      apiError: `No note of ${id}`,
    })
    return <ErrorDisplay message={`No assignment note with the ID "${id}" found`} />
  }

  const isV2Note = note.apiVersion === 2
  const groupId = isV2Note
    ? getGroupIdfromInvitation(note.invitations[0])
    : getGroupIdfromInvitation(note.invitation)

  const banner = referrerLink(
    referrer || `[all assignments for ${prettyId(groupId)}](/assignments?group=${groupId})`
  )

  if (!isV2Note)
    return (
      <CommonLayout banner={<Banner>{banner}</Banner>}>
        <div className={styles.stats}>
          <V1Stats configNote={note} />
        </div>
      </CommonLayout>
    )

  const noteContent = getNoteContentValues(note.content)

  return (
    <CommonLayout banner={<Banner>{banner}</Banner>}>
      <div className={styles.stats}>
        <Suspense fallback={<LoadingSpinner />}>
          <Stats configNote={note} />
        </Suspense>
      </div>
    </CommonLayout>
  )
}
