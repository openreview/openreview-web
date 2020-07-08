import { Selector } from 'testcafe'
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

