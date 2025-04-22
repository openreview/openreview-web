import { headers } from 'next/headers'
import Banner from '../../components/Banner'
import api from '../../lib/api-client'
import { referrerLink } from '../../lib/banner-links'
import { prettyId } from '../../lib/utils'
import CommonLayout from '../CommonLayout'
import serverAuth from '../auth'
import Submissions from './Submissions'
import styles from './Submissions.module.scss'
import V1Submissions from './V1Submissions'
import ErrorDisplay from '../../components/ErrorDisplay'

export const metadata = {
  title: 'Submissions | OpenReview',
}

export default async function page({ searchParams }) {
  const { venue: groupId } = await searchParams
  const { token } = await serverAuth()

  if (!groupId) {
    return <ErrorDisplay message="Missing required parameter venue" />
  }

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let group
  try {
    group = await api
      .get('/groups', { id: groupId }, { accessToken: token, remoteIpAddress })
      .then((result) => result.groups?.[0])
  } catch (error) {
    return <ErrorDisplay message={error.message} />
  }

  if (!group) {
    return <ErrorDisplay message={`The venue ${groupId} could not be found`} />
  }

  // #region v1 logic
  if (!group.invitations) {
    return (
      <CommonLayout
        banner={
          <Banner>{referrerLink(`[${prettyId(group.host)}](/venue?id=${group.host})`)}</Banner>
        }
        editBanner={null}
      >
        <div className={styles.submissions}>
          <V1Submissions groupId={group.id} />
        </div>
      </CommonLayout>
    )
  }
  // #endregion

  const invitationId = group.content?.submission_id?.value

  if (!invitationId)
    return <ErrorDisplay message={`No submission invitation found for venue ${groupId}`} />

  const banner = (
    <Banner>{referrerLink(`[${prettyId(group.host)}](/venue?id=${group.host})`)}</Banner>
  )
  return (
    <CommonLayout banner={banner} editBanner={null}>
      <div className={styles.submissions}>
        <Submissions groupId={group.id} invitationId={invitationId} />
      </div>
    </CommonLayout>
  )
}
