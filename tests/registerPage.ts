import { Selector, ClientFunction } from 'testcafe'
import { registerFixture, before, after } from './utils/hooks'

const firstNameInputSelector = Selector('#first-input')
const lastNameInputSelector = Selector('#last-input')
const emailAddressInputSelector = Selector('input').withAttribute('placeholder', 'Email address')
const signupButtonSelector = Selector('button').withText('Sign Up')
const passwordInputSelector = Selector('input').withAttribute('placeholder', 'Password')
const sendActivationLinkButtonSelector = Selector('button').withText('Send Activation Link')
const claimProfileButtonSelector = Selector('button').withText('Claim Profile')

registerFixture()

fixture`Signup`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('create new profile', async (t) => {
  await t
    .typeText(firstNameInputSelector, 'Melisa')
    .typeText(lastNameInputSelector, 'Bok')
    .typeText(emailAddressInputSelector, 'melisa@test.com')
    .click(signupButtonSelector)
    .expect(passwordInputSelector.exists)
    .ok()
    .typeText(passwordInputSelector, '1234')
    .click(signupButtonSelector)
    .expect(Selector('h1').withText('Thank You for Signing Up').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText)
    .eql('melisa@test.com')

  const { api, superUserToken } = t.fixtureCtx
  const result = await api.get('/messages?to=melisa@test.com', {}, { accessToken: superUserToken })
  await t.expect(result.messages[0].content.text).contains('http://localhost:3030/profile/activate?token=')
})

test('enter invalid name', async (t) => {
  await t
    .typeText(firstNameInputSelector, 'abc')
    .typeText(lastNameInputSelector, '1')
    .expect(Selector('.important_message').exists).ok()
    .expect(Selector('.important_message').textContent)
    .eql('Name is not allowed to contain digits')
})

test('enter valid name invalid email and change to valid email and register', async (t) => {
  const firstName = 'testFirstNameaac' // must be new each test run
  const lastName = 'testLastNameaac' // must be new each test run
  const email = 'testemailaac@test.com' // must be new each test run
  await t
    .typeText(firstNameInputSelector, firstName) // must be new each test run
    .typeText(lastNameInputSelector, lastName) // must be new each test run
    .typeText(emailAddressInputSelector, `${email}@test.com`)
    .click(signupButtonSelector)
    .expect(passwordInputSelector.exists)
    .notOk() // password input should not show when email is invalid
  await t
    .typeText(emailAddressInputSelector, email, { replace: true }) // enter a valid email
    .click(signupButtonSelector)
    .expect(passwordInputSelector.exists).ok()
    .typeText(passwordInputSelector, '1234')
    .click(signupButtonSelector)
    .expect(Selector('h1').withText('Thank You for Signing Up').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText)
    .eql(email)
})

fixture.skip`Resend Activation link`
  .page`http://localhost:${process.env.NEXT_PORT}/login`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('request a new activation link', async (t) => {
  await t
    .typeText(Selector('input').withAttribute('placeholder', 'Email'), 'melisa@test.com')
    .click(Selector('a').withText('Didn\'t receive email confirmation?'))
    .expect(Selector('#flash-message-container').exists).ok()
    .expect(Selector('span').withAttribute('class', 'important_message').innerText)
    .eql('A confirmation email with the subject "OpenReview signup confirmation" has been sent to melisa@test.com. Please click the link in this email to confirm your email address and complete registration.')

  await new Promise(r => setTimeout(r, 2000))

  const { api, superUserToken } = t.fixtureCtx
  const result = await api.get('/messages?to=melisa@test.com&subject=OpenReview signup confirmation', {}, { accessToken: superUserToken })
  await t.expect(result.messages[0].content.text).contains('http://localhost:3030/profile/activate?token=')
  await t.expect(result.messages[1].content.text).contains('http://localhost:3030/profile/activate?token=')
})

test('request a reset password with no active profile', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .typeText(Selector('input').withAttribute('placeholder', 'Email'), 'melisa@test.com')
    .click(Selector('a').withText('Forgot your password?'))
    .expect(getPageUrl()).contains('http://localhost:3030/reset', { timeout: 10000 })
})

fixture.skip`Send Activation Link from signup page`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('Send Activation Link', async (t) => {
  const firstName = 'testFirstNameaaa' // must be existing inactivate acct
  const lastName = 'testLastNameaaa'
  const email = 'testemailaaa@test.com'
  await t
    .typeText(firstNameInputSelector, firstName.toLowerCase())
    .typeText(lastNameInputSelector, lastName.toLowerCase())
  const existingTildeId = await Selector('.new-username.hint').nth(0).innerText
  const newTildeId = await Selector('.new-username.hint').nth(1).innerText
  await t
    .expect(newTildeId.substring(2)).notEql(existingTildeId.substring(3)) // new sign up shoud have different tildeid
    .expect(sendActivationLinkButtonSelector.exists).ok() // existing acct so should find associated email
    .click(sendActivationLinkButtonSelector)
    .typeText(Selector('.password-row').find('input'), `${email}abc`) // type wrong email should not trigger email sending
    .click(sendActivationLinkButtonSelector)
  await t
    .selectText(Selector('.password-row').find('input'))
    .pressKey('delete')
    .typeText(Selector('.password-row').find('input'), email)
    .click(sendActivationLinkButtonSelector)
    .expect(Selector('h1').withText('Thank You for Signing Up').exists).ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText).eql(email)
})

fixture.skip`Claim Profile`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('enter invalid name', async (t) => {
  const firstName = 'Andrew' // no email no password not active
  const lastName = 'Naish'
  await t
    .typeText(firstNameInputSelector, firstName)
    .typeText(lastNameInputSelector, lastName)
    .expect(Selector('.submissions-list').find('.note').count).lte(3) // at most 3 recent publications
    .expect(claimProfileButtonSelector.exists)
    .ok()
    .expect(claimProfileButtonSelector.hasAttribute('disabled'))
    .ok()
    .expect(signupButtonSelector.exists)
    .ok()
    .expect(signupButtonSelector.hasAttribute('disabled'))
    .ok()
})

fixture.skip`Sign up`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('email address should be masked', async (t) => {
  const firstName = 'Evan' // has email no password not active
  const lastName = 'Sparks'
  const email = 'testemailaaa@test.com'
  await t
    .typeText(firstNameInputSelector, firstName)
    .typeText(lastNameInputSelector, lastName)
    .expect(Selector('input').withAttribute('type', 'email').nth(0).value).contains('****') // email should be masked
})

fixture.skip`Reset Password·`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('email address should be masked', async (t) => {
  const firstName = 'Evan' // has email no password not active
  const lastName = 'Sparks'
  const email = 'testemailaaa@test.com'
  await t
    .typeText(firstNameInputSelector, firstName)
    .typeText(lastNameInputSelector, lastName)
    .expect(Selector('input').withAttribute('type', 'email').nth(0).value).contains('****') // email should be masked
})

fixture`Activate`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=melisa@test.com`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('update profile', async (t) => {
  await t
    .typeText(Selector('#homepage_url'), 'http://homepage.do')
    .typeText(Selector('input').withAttribute('placeholder', 'Choose a position or type a new one'), 'MS student')
    .typeText(Selector('input').withAttribute('placeholder', 'Choose a domain or type a new one'), 'umass.edu')
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(Selector('#flash-message-container').exists).ok()
    .expect(Selector('span').withAttribute('class', 'important_message').innerText)
    .eql('Your OpenReview profile has been successfully created')
})

fixture.skip`Reset password`
  .page`http://localhost:${process.env.NEXT_PORT}/reset`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('reset password of active profile', async (t) => {
  await t
    .typeText(Selector('#email-input'), 'melisa@test.com')
    .click(Selector('button').withText('Reset Password'))
    .expect(Selector('div').withAttribute('role', 'alert').exists).ok()
    // .expect(Selector('div').withAttribute('role', 'alert').innerText)
    // .contains('An email with the subject "OpenReview Password Reset" has been sent to')

  const { api, superUserToken } = t.fixtureCtx
  const result = await api.get('/messages?to=melisa@test.com&subject=OpenReview password reset', {}, { accessToken: superUserToken })
  await t.expect(result.messages[0].content.text).contains('http://localhost:3030/user/password?token=')
})

fixture`Edit profile`
  .page`http://localhost:${process.env.NEXT_PORT}/login`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('add alternate email', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .typeText(Selector('#email-input'), 'melisa@test.com')
    .typeText(Selector('#password-input'), '1234')
    .click(Selector('button').withText('Login to OpenReview'))
    .expect(getPageUrl())
    .contains('http://localhost:3030', { timeout: 10000 })
    .expect(Selector('#user-menu').exists)
    .ok()
    .click(Selector('#user-menu'))
    .expect(Selector('ul').withAttribute('class', 'dropdown-menu').exists)
    .ok()
    .click(Selector('a').withText('Profile'))
    .click(Selector('a').withAttribute('href', '/profile/edit'))
    .expect(Selector('h4').withText('Emails').exists)
    .ok()
    .click(Selector('div').withAttribute('class', 'profile-edit-container').child('section').nth(2)
      .child('div'))
    .expect(Selector('#emails_table').child('tbody').child('tr').count)
    .eql(2)
    .typeText(Selector('#emails_table').child('tbody').child('tr').nth(1)
      .child('td')
      .child('input'), 'melisa@alternate.com')
    .click(Selector('#emails_table').child('tbody').child('tr').nth(1)
      .child('td')
      .nth(1)
      .child('button'))
    .expect(Selector('#flash-message-container').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'important_message').innerText)
    .eql('A confirmation email has been sent to melisa@alternate.com')

  const { api, superUserToken } = t.fixtureCtx
  const result = await api.get('/messages?to=melisa@alternate.com&subject=OpenReview Account Linking', {}, { accessToken: superUserToken })
  await t.expect(result.messages[0].content.text).contains('http://localhost:3030/confirm?token=')
})

fixture.skip`Confirm altenate email`
  .page`http://localhost:${process.env.NEXT_PORT}/confirm?token=melisa@alternate.com`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('update profile', async (t) => {
  await t
    .expect(Selector('#flash-message-container').exists).ok()
    .expect(Selector('span').withAttribute('class', 'important_message').innerText).eql('Thank you for confirming your email melisa@alternate.com')
})
