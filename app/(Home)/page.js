import AllVenues from './AllVenues'
import ActiveVenues from './ActiveVenues'
import styles from './Home.module.scss'
import OpenVenues from './OpenVenues'
import api from '../../lib/api-client'
import { formatGroupResults } from '../../lib/utils'
import ActiveConsoles from './ActiveConsoles'

export const metadata = {
  title: 'Venues | OpenReview',
}

export const revalidate = 600

const formatInvitationResults = (apiRes) =>
  apiRes.invitations
    .map((inv) => ({ groupId: inv.id.split('/-/')[0], dueDate: inv.duedate }))
    .filter((p, index, arr) => index === arr.findIndex((q) => q.groupId === p.groupId))
    .sort((a, b) => a.dueDate - b.dueDate)

export default async function page() {
  const [activeVenuesResult, openVenuesResult] = await Promise.allSettled([
    api.get('groups', { id: 'active_venues' }).then(formatGroupResults),
    api
      .getCombined(
        '/invitations',
        { invitee: '~', pastdue: false, type: 'notes' },
        { invitee: '~', pastdue: false, type: 'note' }
      )
      .then(formatInvitationResults),
  ])
  const activeVenues =
    activeVenuesResult.status === 'fulfilled' ? activeVenuesResult.value : []
  const openVenues = openVenuesResult.status === 'fulfilled' ? openVenuesResult.value : []

  return (
    <div className={styles.home}>
      <div className="col-xs-12 col-sm-6">
        <ActiveConsoles activeVenues={activeVenues} openVenues={openVenues} />
        <div className="visible-xs">
          <OpenVenues venues={openVenues} />
        </div>
        <ActiveVenues venues={activeVenues} />
      </div>
      <div className="col-xs-12 col-sm-6 hidden-xs">
        <OpenVenues venues={openVenues} />
      </div>

      <div className="col-xs-12">
        <AllVenues />
      </div>
    </div>
  )
}
