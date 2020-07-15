import { setup } from './test-utils'

fixture`Setup Data`
  .before(async () => {
    await setup()
  })
test('empty test to run setup', async t => {})
