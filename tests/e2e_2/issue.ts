/* oxlint-disable no-unused-expressions */
import { Selector, ClientFunction } from 'testcafe'
import { strongPassword } from '../utils/api-helper'

const openreviewLogo = Selector('nav a[href="/"]').filterVisible()
const loginLink = Selector('a').withText('Login').filterVisible()
const loginButton = Selector('button').withText('Login to OpenReview')

const getLocation = ClientFunction(() => document.location.href)
const homepageUrl = `http://localhost:${process.env.NEXT_PORT}`

fixture`#763 Login redirect is not cleared when user go back to homepage`
test('user not redirected to group page', async (t) => {
  await t
    .navigateTo(homepageUrl)
    .click(Selector('section#active-venues a'))
    .click(openreviewLogo)
    .click(loginLink)
    .typeText('#email-input', 'test@mail.com')
    .typeText('#password-input', strongPassword)
    .wait(100)
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
  '/reset',
  '/user/password',
]
routesToSkipRedirection.forEach((route) => {
  test(`redirection to ${route} is skipped`, async (t) => {
    await t
      .navigateTo(`${homepageUrl}${route}`)
      .wait(100)
      .click(loginLink)
      .typeText('#email-input', 'test@mail.com')
      .typeText('#password-input', strongPassword)
      .wait(100)
      .click(loginButton)
      .expect(getLocation())
      .eql(`${homepageUrl}/`)
  })
})

test(`redirection to /profile/activate is skipped`, async (t) => {
  await t
    .navigateTo(`${homepageUrl}/profile/activate`)
    .wait(100)
    .click(loginLink)
    .typeText('#email-input', 'test@mail.com')
    .typeText('#password-input', strongPassword)
    .wait(100)
    .click(loginButton)
    .expect(getLocation())
    .eql(`${homepageUrl}/`)
}).skipJsErrors()

fixture`miscellaneous issues`
test('terms and conditions date should be updated', async (t) => {
  // terms page, privacy page, login page and signup page
  const lastUpdatedDate = 'September 24, 2024'
  await t
    .navigateTo(`${homepageUrl}/legal/terms`)
    .expect(Selector('p').withText(lastUpdatedDate).exists)
    .ok()

  await t
    .navigateTo(`${homepageUrl}/legal/privacy`)
    .expect(Selector('p').withText(lastUpdatedDate).exists)
    .ok()

  await t
    .navigateTo(`${homepageUrl}/login`)
    .expect(Selector('p').withText(lastUpdatedDate).exists)
    .ok()
})
