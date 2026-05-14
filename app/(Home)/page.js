import { Col, Row } from 'antd'
import { cookies, headers } from 'next/headers'
import VersionChecker from '../../components/VersionChecker'
import api from '../../lib/api-client'
import { formatGroupResults } from '../../lib/utils'
import serverAuth from '../auth'
import ActiveVenueConsole from './_ActiveVenueConsole'
import HomeSearch from './HomeSearch'
import News from './News'
import PinnedVenues from './PinnedVenues'
import UpcomingDeadlines from './UpcomingDeadlines'

import styles from './Home.module.scss'

export const metadata = {
  title: 'Venues | OpenReview',
}

const formatInvitationResults = (apiRes) =>
  apiRes.invitations
    .map((inv) => ({ groupId: inv.id.split('/-/')[0], dueDate: inv.duedate }))
    .filter((p, index, arr) => index === arr.findIndex((q) => q.groupId === p.groupId))
    .sort((a, b) => a.dueDate - b.dueDate)

export default async function page() {
  const headersList = await headers()
  const cookieStore = await cookies()
  const remoteIpAddress = headersList.get('x-forwarded-for')
  const { user } = await serverAuth()
  const isLoggedIn = !!user
  const [activeVenuesResult, openVenuesResult, newsResult, totalVenuesResult] =
    await Promise.allSettled([
      api.get('groups', { id: 'active_venues' }, { remoteIpAddress }).then(formatGroupResults),
      api
        .get('/invitations', { invitee: '~', pastdue: false, type: 'note' }, { remoteIpAddress })
        .then(formatInvitationResults),
      api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/News/-/Article`,
          select: 'id,cdate,content.title,content.paperhash',
          limit: 3,
          sort: 'cdate:desc',
        },
        { remoteIpAddress }
      ),
      api.get('/groups', { id: 'host', select: 'members' }, { remoteIpAddress }),
    ])

  let activeVenues
  if (activeVenuesResult.status === 'fulfilled') {
    activeVenues = activeVenuesResult.value
  } else {
    activeVenues = []
    // oxlint-disable-next-line no-console
    console.log('Error in page', {
      page: 'Home',
      activeVenuesResult,
    })
  }
  let openVenues
  if (openVenuesResult.status === 'fulfilled') {
    openVenues = openVenuesResult.value
  } else {
    openVenues = []
    // oxlint-disable-next-line no-console
    console.log('Error in page', {
      page: 'Home',
      openVenuesResult,
    })
  }
  let news = []
  if (newsResult.status === 'fulfilled') {
    news = newsResult.value.notes
  } else {
    // oxlint-disable-next-line no-console
    console.log('Error in page', {
      page: 'Home',
      newsResult,
    })
  }

  let totalVenues = 0
  if (totalVenuesResult.status === 'fulfilled') {
    totalVenues = totalVenuesResult.value.groups?.[0]?.members?.length ?? 0
  } else {
    // oxlint-disable-next-line no-console
    console.log('Error in page', {
      page: 'Home',
      totalVenuesResult,
    })
  }

  let showNews = false
  const hideNewsBeforeTimeStamp = cookieStore.get('hideNewsBeforeTimeStamp')?.value
  if (!hideNewsBeforeTimeStamp || hideNewsBeforeTimeStamp < news?.[0]?.cdate) {
    showNews = true
  }

  return (
    <div className={styles.home}>
      {isLoggedIn && (
        <Row gutter={[24, 16]} style={{ marginBottom: '2rem' }}>
          <Col xs={24} md={12}>
            <ActiveVenueConsole activeVenues={activeVenues} openVenues={openVenues} />
          </Col>
          <Col xs={24} md={12}>
            <PinnedVenues
              userId={user.id}
              openVenues={openVenues}
              activeVenues={activeVenues}
            />
          </Col>
        </Row>
      )}
      {isLoggedIn ? (
        <HomeSearch
          activeVenues={activeVenues}
          openVenues={openVenues}
          isLoggedIn={isLoggedIn}
          userId={user?.id}
          totalVenues={totalVenues}
        />
      ) : (
        <div className={`${styles.hero} ${styles.heroGuest}`}>
          <HomeSearch
            activeVenues={activeVenues}
            openVenues={openVenues}
            isLoggedIn={isLoggedIn}
            userId={user?.id}
            totalVenues={totalVenues}
          />
        </div>
      )}
      <News news={news} showNews={showNews} />
      <UpcomingDeadlines openVenues={openVenues} />
      <VersionChecker />
    </div>
  )
}
