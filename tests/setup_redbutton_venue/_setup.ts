import { getToken, superUserName, strongPassword } from '../utils/api-helper'
import api from '../../lib/api-client'

fixture`Shutdown venue`
  .page`http://localhost:${process.env.NEXT_PORT}`
  .before(async (ctx) => {
    ctx.superUserToken = await getToken(superUserName, strongPassword)
  })

test('shut down TestVenue V2', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const result = await api.post(
    '/domains/restriction',
    {
      domain: 'TestVenue/2023/Conference',
      action: 'restrict',
    },
    { accessToken: superUserToken }
  )
  await t.expect(result.status).eql('ok')
})
