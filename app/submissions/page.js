import Banner from '../../components/Banner'
import api from '../../lib/api-client'
import { referrerLink } from '../../lib/banner-links'
import { prettyId } from '../../lib/utils'
import CommonLayout from '../CommonLayout'
import serverAuth from '../auth'
import Submissions from './Submissions'
import styles from './Submissions.module.scss'
import V1Submissions from './V1Submissions'

export const metadata = {
  title: 'Submissions | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { venue: groupId } = await searchParams
  const { token } = await serverAuth()

  if (!groupId) {
    throw new Error('Missing required parameter venue')
  }
  const group = await api
    .get('/groups', { id: groupId }, { accessToken: token })
    .then((result) => result.groups?.[0])

  if (!group) {
    throw new Error(`The venue ${groupId} could not be found`)
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

  if (!invitationId) throw new Error(`No submission invitation found for venue ${groupId}`)

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
