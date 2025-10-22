import { Selector, ClientFunction, Role } from 'testcafe'
import { strongPassword } from './utils/api-helper'

const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
})

// eslint-disable-next-line no-unused-expressions
fixture`Messages`
  .page`http://localhost:${process.env.NEXT_PORT}/messages`

test('guest user should be redirected to login page', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'a@a.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
    .expect(Selector('form.filter-controls').exists)
    .ok()
    .expect(Selector('table.messages-table').exists)
    .ok()
    .expect(Selector('p.empty-message').innerText)
    .eql('No messages found')
})

test('logged user should be able to filter messages', async (t) => {
  await t
    .useRole(testUserRole)
    .navigateTo(
      `http://localhost:${process.env.NEXT_PORT}/messages`
    )
    .typeText(Selector('input#to-search-input'), 'test@mail.com')
    .expect(Selector('table.messages-table tr').count).eql(2)
})
