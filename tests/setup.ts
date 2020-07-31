import { setup, getToken } from './utils/api-helper'

fixture`Setup`
  .before(async (ctx) => {
  })

test('setup data', async (t) => {
  const superUserToken = await getToken('openreview.net', '1234')
  setup(superUserToken)
})
