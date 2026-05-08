import { Col, Row } from 'antd'
import { cookies, headers } from 'next/headers'
import VersionChecker from '../../components/VersionChecker'
import api from '../../lib/api-client'
import { formatGroupResults } from '../../lib/utils'
import ActiveVenueConsole from './_ActiveVenueConsole'
import AllVenuesWithSearch from './AllVenuesWithSearch'
import News from './News'
import OpenVenues from './OpenVenues'

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
  const [activeVenuesResult, openVenuesResult, newsResult] = await Promise.allSettled([
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

  let showNews = false
  const hideNewsBeforeTimeStamp = cookieStore.get('hideNewsBeforeTimeStamp')?.value
  if (!hideNewsBeforeTimeStamp || hideNewsBeforeTimeStamp < news?.[0]?.cdate) {
    showNews = true
  }

  return (
    <div className={styles.home}>
      <Row>
        <Col xs={24}>
          <News news={news} showNews={showNews} />
        </Col>

        <Col xs={24} md={12}>
          <ActiveVenueConsole activeVenues={activeVenues} openVenues={openVenues} />
        </Col>

        <Col xs={24} md={12}>
          <OpenVenues venues={openVenues} />
        </Col>

        <Col xs={24} style={{ marginBottom: 150 }}>
          <AllVenuesWithSearch activeVenues={activeVenues} openVenues={openVenues} />
        </Col>
      </Row>
      <VersionChecker />
    </div>
  )
}
