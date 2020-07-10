import { Selector, ClientFunction } from 'testcafe'
import api from '../lib/api-client'
import { setup, teardown } from './test-utils.js'

const firstNameInputSelector = Selector('#first-input')
const lastNameInputSelector = Selector('#last-input')
const emailAddressInputSelector = Selector('input').withAttribute('placeholder', 'Email address')
const signupButtonSelector = Selector('button').withText('Sign Up')
const passwordInputSelector = Selector('input').withAttribute('placeholder', 'Password')

fixture `Signup`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
  .before( async ctx => {
    setup()
  })
  .after( async ctx => {
    teardown()
  });

test('create new profile', async t => {
  await t
    .typeText(firstNameInputSelector, 'Melisa')
    .typeText(lastNameInputSelector, 'Bok')
    .typeText(emailAddressInputSelector, 'melisa@test.com')
    .click(signupButtonSelector)
    .expect(passwordInputSelector.exists).ok()
    .typeText(passwordInputSelector, '1234')
    .click(signupButtonSelector)
    .expect(Selector('h1').withText('Thank You for Signing Up').exists).ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText).eql('melisa@test.com')

  const result = await api.post('/login', { id: 'openreview.net', password: '1234' })
  const result2 = await api.get('/messages?to=melisa@test.com', {}, { accessToken: result.token })
  await t.expect(result2.messages[0].content.text).contains('http://localhost:3030/profile/activate?token=')
})

fixture `Resend Activtion link`
  .page`http://localhost:${process.env.NEXT_PORT}/login`

test('request a new activation link', async t => {
  await t
    .typeText(Selector('input').withAttribute('placeholder', 'Email'), 'melisa@test.com')
    .click(Selector('a').withText('Didn\'t receive email confirmation?'))
    .expect(Selector('#flash-message-container').exists).ok()
    .expect(Selector('span').withAttribute('class', 'important_message').innerText).eql('A confirmation email with the subject "OpenReview signup confirmation" has been sent to melisa@test.com. Please click the link in this email to confirm your email address and complete registration.')

  await new Promise(r => setTimeout(r, 2000));

  const result = await api.post('/login', { id: 'openreview.net', password: '1234' })
  const result2 = await api.get('/messages?to=melisa@test.com', {}, { accessToken: result.token })
  await t.expect(result2.messages[0].content.text).contains('http://localhost:3030/profile/activate?token=')
  await t.expect(result2.messages[1].content.text).contains('http://localhost:3030/profile/activate?token=')
})

test('request a reset password with no active profile', async t => {
  const getPageUrl = ClientFunction(() => window.location.href.toString());
  await t
    .typeText(Selector('input').withAttribute('placeholder', 'Email'), 'melisa@test.com')
    .click(Selector('a').withText('Forgot your password?'))
    .expect(getPageUrl()).contains('http://localhost:3030/reset', { timeout: 10000 });
})

fixture `Activate`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=melisa@test.com`;

test('update profile', async t => {
  await t
    .typeText(Selector('#homepage_url'), 'http://homepage.do')
    .typeText(Selector('input').withAttribute('placeholder', 'Choose a position or type a new one'), 'MS student')
    .typeText(Selector('input').withAttribute('placeholder', 'Choose a domain or type a new one'), 'umass.edu')
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(Selector('#flash-message-container').exists).ok()
    .expect(Selector('span').withAttribute('class', 'important_message').innerText).eql('Your OpenReview profile has been successfully created')
})

fixture `Reset password`
  .page`http://localhost:${process.env.NEXT_PORT}/reset`;

test('reset password of active profile', async t => {
  await t
    .typeText(Selector('#email-input'), 'melisa@test.com')
    .click(Selector('button').withText('Reset Password'))
    .expect(Selector('div').withAttribute('role', 'alert').exists).ok()
    //.expect(Selector('div').withAttribute('role', 'alert').innerText).contains('An email with the subject "OpenReview Password Reset" has been sent to')

  const result = await api.post('/login', { id: 'openreview.net', password: '1234' })
  const result2 = await api.get('/messages?to=melisa@test.com&subject=OpenReview password reset', {}, { accessToken: result.token })
  await t.expect(result2.messages[0].content.text).contains('http://localhost:3030/account/password?token=')
})

