import api from '../lib/api-client'

export async function setup() {
  const result1 = await api.put('/reset/openreview.net', { password: '1234' })
}

export function teardown() {
  console.log('TEARDOWN')
}
