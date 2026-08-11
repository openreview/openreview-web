'use server'

import { headers } from 'next/headers'
import serverAuth from '../auth'

const arxivIdRegex = /^\d{4}\.\d{4,5}$/

export async function fetchArxivData(id) {
  if (!id || !arxivIdRegex.test(id)) {
    throw new Error('Invalid arXiv ID')
  }

  const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`)
  if (!response.ok) {
    const { user } = await serverAuth()
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
