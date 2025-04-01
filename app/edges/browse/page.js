import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { uniq } from 'lodash'
import serverAuth from '../../auth'

import { referrerLink } from '../../../lib/banner-links'
import { parseEdgeList } from '../../../lib/edge-utils'
import Browse from './Browse'
import ErrorDisplay from '../../../components/ErrorDisplay'

export const metadata = {
  title: 'Edge Browser | OpenReview',
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { user, token: accessToken } = await serverAuth()
  if (!accessToken) redirect(`/login?redirect=/edge/browse?${stringify(query)}`)

  const banner = query.referrer ? referrerLink(query.referrer) : null

  const startInvitations = parseEdgeList(query.start, 'start')
  const traverseInvitations = parseEdgeList(query.traverse, 'traverse')
  const editInvitations = parseEdgeList(query.edit, 'edit')
  const browseInvitations = parseEdgeList(query.browse, 'browse')
  const hideInvitations = parseEdgeList(query.hide, 'hide')
  const allInvitations = traverseInvitations.concat(
    startInvitations,
    editInvitations,
    browseInvitations,
    hideInvitations
  )
  if (allInvitations.length === 0) {
    return <ErrorDisplay message="Could not load edge explorer. Invalid edge invitation." />
  }
  const apiVersion = Number.parseInt(query.version, 10)

  return (
    <Browse
      traverseInvitations={traverseInvitations}
      startInvitations={startInvitations}
      editInvitations={editInvitations}
      browseInvitations={browseInvitations}
      hideInvitations={hideInvitations}
      allInvitations={allInvitations}
      idsToLoad={uniq(allInvitations.map((i) => i.id)).filter((id) => id !== 'staticList')}
      version={apiVersion}
      maxColumns={Math.max(Number.parseInt(query.maxColumns, 10), -1) || -1}
      showCounter={query.showCounter ? query.showCounter === 'true' : true}
      user={user}
      accessToken={accessToken}
      banner={banner}
    />
  )
}
