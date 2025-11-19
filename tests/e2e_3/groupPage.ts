import { Selector, ClientFunction, Role } from 'testcafe'
import { strongPassword } from '../utils/api-helper'

const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const content = Selector('#content')
const errorMessageLabel = Selector('.error-message')

const johnRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'john@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
})

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
})

// eslint-disable-next-line no-unused-expressions
fixture`Program Chairs page`
  .page`http://localhost:${process.env.NEXT_PORT}/group?id=ICLR.cc/2021/Conference/Program_Chairs`

test('guest user should be redirected to login page and access to the group', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'john@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
    .expect(Selector('#group-container').exists)
    .ok()
    .expect(Selector('#group-container h1').innerText)
    .eql('Program Chairs Console')
    .expect(Selector('#notes').exists)
    .ok()
})

test('guest user should be redirected to login page and get a forbidden', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
    .expect(content.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql("You don't have permission to read this group")
})

test('logged user should access to the group', async (t) => {
  await t
    .useRole(johnRole)
    .navigateTo(
      `http://localhost:${process.env.NEXT_PORT}/group?id=ICLR.cc/2021/Conference/Program_Chairs`
    )
    .expect(Selector('#group-container').exists)
    .ok()
    .expect(Selector('#group-container h1').innerText)
    .eql('Program Chairs Console')
    .expect(Selector('#notes').exists)
    .ok()
})

test('logged user should get a forbidden error', async (t) => {
  await t
    .useRole(testUserRole)
    .navigateTo(
      `http://localhost:${process.env.NEXT_PORT}/group?id=ICLR.cc/2021/Conference/Program_Chairs`
    )
    .expect(content.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql("You don't have permission to read this group")
})

// eslint-disable-next-line no-unused-expressions
fixture`Group page`.page`http://localhost:${process.env.NEXT_PORT}`

test('try to access to an invalid group and get a not found error', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/group?id=dslkjf`)
    .expect(errorMessageLabel.innerText)
    .eql('Group Not Found: dslkjf')
})
