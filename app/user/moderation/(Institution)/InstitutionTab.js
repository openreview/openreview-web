import { Suspense } from 'react'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import InstitutionList from './InstitutionList'
import api from '../../../../lib/api-client'

export default async function InstitutionTab({ accessToken }) {
  const institutionsP = api.get('/settings/institutiondomains')

  return (
    <div className="institution-container">
      <Suspense fallback={<LoadingSpinner />}>
        <InstitutionList accessToken={accessToken} institutionsP={institutionsP} />
      </Suspense>
    </div>
  )
}
