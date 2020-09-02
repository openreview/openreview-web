import { Selector, ClientFunction, Role } from 'testcafe'

const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const content = Selector('#content')
const errorCodeLabel = Selector('#content h1')
const errorMessageLabel = Selector('.error-message')

const reviewerRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(emailInput, 'reviewer_iclrn@mail.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
})

const testRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
})

// eslint-disable-next-line no-unused-expressions
fixture`Bidding page`
  .page`http://localhost:${process.env.NEXT_PORT}/group?id=ICLR.cc/2021/Conference/Reviewers/-/Bid`

test('guest user should be redirected to login page and access to the invitation page', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl()).contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'reviewer_iclr@mail.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
    .expect(Selector('#group-container').exists).ok()
    .expect(Selector('#group-container h1').innerText).eql('ICLR 2021 Bidding Console')
    .expect(Selector('#notes').exists).ok()
})

test('guest user should be redirected to login page and get a forbidden', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .expect(getPageUrl()).contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
    .expect(content.exists).ok()
    .expect(errorCodeLabel.innerText).eql('Error 403')
    .expect(errorMessageLabel.innerText).eql('You don\'t have permission to read this invitation')
})

test('logged user should access to the invitation', async (t) => {
  await t
    .useRole(reviewerRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/group?id=ICLR.cc/2021/Conference/Reviewers/-/Bid`)
    .expect(Selector('#group-container').exists).ok()
    .expect(Selector('#group-container h1').innerText).eql('ICLR 2021 Bidding Console')
    .expect(Selector('#notes').exists).ok()
})

test('logged user should get a forbidden error', async (t) => {
  await t
    .useRole(testRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/group?id=ICLR.cc/2021/Conference/Reviewers/-/Bid`)
    .expect(content.exists).ok()
    .expect(errorCodeLabel.innerText).eql('Error 403')
    .expect(errorMessageLabel.innerText).eql('You don\'t have permission to read this invitation')
})

// eslint-disable-next-line no-unused-expressions
fixture`Invitation page`
  .page`http://localhost:${process.env.NEXT_PORT}`

test('try to access to an invalid group and get a not found error', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/invitation?id=dslkjf`)
    .expect(errorCodeLabel.innerText).eql('Error 400')
    .expect(errorMessageLabel.innerText).eql('Invitation Not Found: dslkjf')
})
