import { Selector, ClientFunction } from 'testcafe'
import fetch from 'node-fetch'
import api from '../lib/api-client'
import { setup, teardown } from './test-utils.js'

const firstNameInputSelector = Selector('#first-input')
const lastNameInputSelector = Selector('#last-input')
const emailAddressInputSelector = Selector('input').withAttribute('placeholder', 'Email address')
const signupButtonSelector = Selector('button').withText('Sign Up')
const passwordInputSelector = Selector('input').withAttribute('placeholder', 'Password')

api.configure({ fetchFn: fetch })

fixture`Feedback`
  .page`http://localhost:${process.env.NEXT_PORT}`
  .before(async ctx => {
    setup()
  })
  .after(async ctx => {
    teardown()
  });

test('send incomplete feedback as a guest user', async t => {
  await t
    .click(Selector('a').withAttribute('data-target', '#feedback-modal'))
    .expect(Selector('#feedback-modal').exists).ok()
    .click(Selector('#feedback-modal').child('div').child('div').child(2).child('button').nth(1))
    .expect(Selector('#feedback-modal').child('div').child('div').child(1).child('div').innerText).eql(' Error: Missing required fields')
})

test('send feedback as a guest user', async t => {
  await t
    .click(Selector('a').withAttribute('data-target', '#feedback-modal'))
    .expect(Selector('#feedback-modal').exists).ok()
    .typeText(Selector('#feedback-modal').child('div').child('div').child(1).child('form').child('div').child('input'), 'melisa@test.com')
    .typeText(Selector('#feedback-modal').child('div').child('div').child(1).child('form').child('div').nth(1).child('input'), 'subject')
    .typeText(Selector('#feedback-modal').child('div').child('div').child(1).child('form').child('div').nth(2).child('textarea'), 'this is my feedback')
    .click(Selector('#feedback-modal').child('div').child('div').child(2).child('button').nth(1))
    // Fix this assert
    //.expect(Selector('#feedback-modal').child('div').child('div').child(1).child('p').innerText).eql(' Your feedback has been submitted. Thank you.')

    const result = await api.post('/login', { id: 'openreview.net', password: '1234' })
    const result2 = await api.get('/messages?to=info@openreview.net', {}, { accessToken: result.token })
    await t.expect(result2.messages[0].content.subject).contains('OpenReview Feedback: subject')
})
