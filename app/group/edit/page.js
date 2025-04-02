import { prettyId } from '../../../lib/utils'
import GroupEditor from './GroupEditor'
import ErrorDisplay from '../../../components/ErrorDisplay'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `Edit ${prettyId(id)} Group | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay message="Missing required parameter id" />

  return <GroupEditor id={id} query={query} />
}
