import { setup, getToken } from './utils/api-helper'

// eslint-disable-next-line no-unused-expressions
fixture`Setup`

test('setup data', async (t) => {
  const superUserToken = await getToken('openreview.net', '1234')
  const result = await setup(superUserToken)
})
