import { Selector, ClientFunction } from 'testcafe'
import { strongPassword } from './utils/api-helper'

const openreviewLogo = Selector('a.navbar-brand')
const loginLink = Selector('a').withText('Login')
const loginButton = Selector('button').withText('Login to OpenReview')

const getLocation = ClientFunction(() => document.location.href)
const homepageUrl = `http://localhost:${process.env.NEXT_PORT}`

// eslint-disable-next-line no-unused-expressions
fixture`#763 Login redirect is not cleared when user go back to homepage`
test('user not redirected to group page', async (t) => {
  await t
    .navigateTo(homepageUrl)
    .click(Selector('section#active-venues a'))
    .click(openreviewLogo)
    .click(loginLink)
    .typeText('#email-input', 'test@mail.com')
    .typeText('#password-input', strongPassword)
    .click(loginButton)
    .expect(getLocation())
    .eql(`${homepageUrl}/`)
})
const routesToSkipRedirection = [
  '/',
  '/login',
  '/confirm',
  '/logout',
  '/signup',
  '/404',
  '/profile/activate',
  '/reset',
  '/user/password',
]
routesToSkipRedirection.forEach((route) => {
  test(`redirection to ${route} is skipped`, async (t) => {
    await t
      .navigateTo(`${homepageUrl}${route}`)
      .click(loginLink)
      .typeText('#email-input', 'test@mail.com')
      .typeText('#password-input', strongPassword)
      .click(loginButton)
      .expect(getLocation())
      .eql(`${homepageUrl}/`)
  })
})
