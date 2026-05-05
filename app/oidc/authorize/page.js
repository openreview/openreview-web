import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import ErrorDisplay from '../../../components/ErrorDisplay'
import api from '../../../lib/api-client'
import serverAuth from '../../auth'
import AuthorizeForm from './AuthorizeForm'

export default async function Page({ searchParams }) {
  const query = await searchParams
  const { interaction: interactionId } = query

  if (!interactionId) return <ErrorDisplay message="Invalid authorization request" />

  const { user, token } = await serverAuth()

  if (!user)
    redirect(`/login?redirect=/oidc/authorize?${encodeURIComponent(stringify(query))}`)

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  let redirectUri, client, scopes

  try {
    const confirmResult = await api.post(
      '/oidc/authorize/confirm',
      {
        interactionId,
      },
      {
        accessToken: token,
        remoteIpAddress,
      }
    )
    ;({ redirectUri, client, scopes } = confirmResult ?? {})
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.log('Error in page', {
      page: 'OIDC Authorize',
      error,
    })
    return <ErrorDisplay message="Invalid authorization request" />
  }

  if (redirectUri) {
    redirect(redirectUri)
  }

  if (!client || !scopes?.length) {
    return <ErrorDisplay message="Invalid authorization request" />
  }

  return (
    <AuthorizeForm
      interactionId={interactionId}
      clientName={client.clientName}
      scopes={scopes}
    />
  )
}
