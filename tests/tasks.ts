import { Selector } from 'testcafe'
import {hasTaskUser,hasNoTaskUser} from './test-utils'
require('dotenv').config()

fixture`tasks page`
test('go to tasks page', async t => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
  .click(Selector('a').withText('Login'))
  .typeText(Selector('#email-input'),hasTaskUser.email)
  .typeText(Selector('#password-input'),hasTaskUser.password)
  .click(Selector('button').withText('Login to OpenReview'))
  .click(Selector('a').withText('Tasks'))
})
