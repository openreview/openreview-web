import { Suspense } from 'react'
import { headers } from 'next/headers'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import InstitutionList from './InstitutionList'
import api from '../../../../lib/api-client'

export default async function InstitutionTab({ accessToken }) {
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const institutionsP = api.get('/settings/institutiondomains', null, { remoteIpAddress })

  return (
    <div className="institution-container">
      <Suspense fallback={<LoadingSpinner />}>
        <InstitutionList accessToken={accessToken} institutionsP={institutionsP} />
      </Suspense>
    </div>
  )
}
