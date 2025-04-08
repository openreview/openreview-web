import { prettyId } from '../../../lib/utils'
import GroupInfo from './GroupInfo'
import ErrorDisplay from '../../../components/ErrorDisplay'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Group Info | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay message="Missing required parameter id" />
  return <GroupInfo id={id} query={query} />
}
