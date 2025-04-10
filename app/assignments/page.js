import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import Assignments from './Assignments'
import { prettyId } from '../../lib/utils'
import serverAuth from '../auth'
import ErrorDisplay from '../../components/ErrorDisplay'

export async function generateMetadata({ searchParams }) {
  const { group } = await searchParams

  return {
    title: `${prettyId(group)} Assignments | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { group } = query
  const { token: accessToken, user } = await serverAuth()
  if (!accessToken) redirect(`/login?redirect=/assignments?${stringify(query)}`)
  if (!group)
    return <ErrorDisplay message="Could not list assignments. Missing parameter group." />

  return <Assignments accessToken={accessToken} />
}
