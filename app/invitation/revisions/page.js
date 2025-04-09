import { prettyId } from '../../../lib/utils'
import InvitationRevisions from './InvitationRevisions'
import ErrorDisplay from '../../../components/ErrorDisplay'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} Invitation Edit History | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query

  if (!id) return <ErrorDisplay message="Missing required parameter id" />

  return <InvitationRevisions id={id} query={query} />
}
