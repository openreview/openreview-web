import { Selector, ClientFunction, Role } from 'testcafe'
import { strongPassword } from './utils/api-helper'

const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const content = Selector('#content')
const errorMessageLabel = Selector('.error-message')

const reviewerRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'reviewer_iclr@mail.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})

// eslint-disable-next-line no-unused-expressions
fixture`Bidding page`
  .page`http://localhost:${process.env.NEXT_PORT}/invitation?id=ICLR.cc/2021/Conference/Reviewers/-/Bid`

test('guest user should be redirected to login page and be able to access the invitation page', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'reviewer_iclr@mail.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
    .expect(Selector('#invitation-container').exists)
    .ok()
    .expect(Selector('#invitation-container h1').innerText)
    .eql('Reviewers Bidding Console')
    .expect(Selector('#notes').exists)
    .ok()
})

test('guest user should be redirected to login page and get a forbidden error', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
    .expect(content.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql("You don't have permission to read this invitation")
})

test('logged in user should be able to access to the invitation', async (t) => {
  await t
    .useRole(reviewerRole)
    .navigateTo(
      `http://localhost:${process.env.NEXT_PORT}/invitation?id=ICLR.cc/2021/Conference/Reviewers/-/Bid`
    )
    .expect(Selector('#invitation-container').exists)
    .ok()
    .expect(Selector('#invitation-container h1').innerText)
    .eql('Reviewers Bidding Console')
    .expect(Selector('#notes').exists)
    .ok()
})

test('logged in user should get a forbidden error', async (t) => {
  await t
    .useRole(testUserRole)
    .navigateTo(
      `http://localhost:${process.env.NEXT_PORT}/invitation?id=ICLR.cc/2021/Conference/Reviewers/-/Bid`
    )
    .expect(content.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql("You don't have permission to read this invitation")
})

// eslint-disable-next-line no-unused-expressions
fixture`Invitation page`.page`http://localhost:${process.env.NEXT_PORT}`

test('accessing an invalid invitation should get a not found error', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/invitation?id=dslkjf`)
    .expect(errorMessageLabel.innerText)
    .eql('The Invitation dslkjf was not found')
})
