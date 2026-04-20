import { Selector, ClientFunction } from 'testcafe'
import {
  hasTaskUser,
  hasNoTaskUser,
  strongPassword,
  superUserName,
  conferenceSubmissionInvitationId,
  getToken,
  getNotes,
} from '../utils/api-helper'

const pageHeader = Selector('h1').nth(0)
const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const getPageUrl = ClientFunction(() => window.location.href.toString())

// oxlint-disable-next-line no-unused-expressions
fixture`tests with a venue being shutdown`
  .page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
  const superUserToken = await getToken(superUserName, strongPassword)
  const notes = await getNotes(
    { invitation: conferenceSubmissionInvitationId },
    superUserToken,
    2
  )
  ctx.forumId = notes[0].id
})

test('home page loads', async (t) => {
  await t
    .expect(Selector('h1').withText('Error').exists)
    .notOk({ timeout: 10000 })
    .expect(Selector('#active-venues').exists)
    .ok({ timeout: 10000 })
})

test('signup page loads', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/signup`)
    .expect(Selector('#first-input').exists)
    .ok({ timeout: 10000 })
    .expect(Selector('h1').withText('Sign Up for OpenReview').exists)
    .ok()
})

test('login redirect works', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/messages`)
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .expect(Selector('a').withText('Login').filterVisible().exists)
    .ok()
})

test('own profile shows correct user', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login').filterVisible())
    .typeText(emailInput, hasTaskUser.email)
    .typeText(passwordInput, hasTaskUser.password)
    .wait(100)
    .click(loginButton)
    .wait(1000)
    .click(Selector('a.dropdown-toggle'))
    .click(Selector('a').withText('Profile'))
    .click(Selector('#edit-banner').find('a'))
    .expect(Selector('input.full-name').value)
    .eql(hasTaskUser.fullname)
})

test('view other user profile by id', async (t) => {
  await t
    .navigateTo(
      `http://localhost:${process.env.NEXT_PORT}/profile?id=${hasNoTaskUser.tildeId}`
    )
    .expect(pageHeader.innerText)
    .eql(hasNoTaskUser.fullname, undefined, { timeout: 10000 })
    .expect(Selector('h1').withText('Error').exists)
    .notOk()
})

test('messages page loads for logged-in user', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login').filterVisible())
    .typeText(emailInput, hasTaskUser.email)
    .typeText(passwordInput, hasTaskUser.password)
    .wait(100)
    .click(loginButton)
    .wait(1000)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/messages`)
    .expect(Selector('form.filter-controls').exists)
    .ok({ timeout: 10000 })
})

test('forum page loads', async (t) => {
  const { forumId } = t.fixtureCtx
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forumId}`)
    .expect(Selector('.forum-container').exists)
    .ok({ timeout: 10000 })
    .expect(Selector('.forum-title h2').exists)
    .ok()
    .expect(Selector('h1').withText('Error').exists)
    .notOk()
})
