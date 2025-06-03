import { prettyId } from '../../../lib/utils'
import InvitationAdmin from './InvitationAdmin'
import ErrorDisplay from '../../../components/ErrorDisplay'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `Edit ${prettyId(id)} Invitation | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay error="Missing required parameter id" />

  return <InvitationAdmin id={id} query={query} />
}
