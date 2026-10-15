'use server'

import { headers } from 'next/headers'
import serverAuth from '../auth'

export async function fetchArxivData(id) {
  if (!id || !/^\d{4}\.\d{4,5}$/.test(id)) {
    throw new Error('Invalid arXiv ID')
  }
  const { user } = await serverAuth()
  if (!user) {
    throw new Error('Invalid user')
  }

  const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) {
    const headersList = await headers()
    const remoteIpAddress = headersList.get('x-forwarded-for')
    // oxlint-disable-next-line no-console
    console.log('Error in arxiv import', {
      arxivId: id,
      status: response.status,
      statusText: response.statusText,
      user: user?.profile?.id,
      remoteIpAddress,
    })
    throw new Error('arXiv service is temporarily unavailable')
  }

  return response.text()
}
