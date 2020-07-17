/* global fixture */
/* global test */

import { Selector, ClientFunction } from 'testcafe'
import fetch from 'node-fetch'
import api from '../lib/api-client'
import { registerFixture, before, after } from './hooks'

api.configure({ fetchFn: fetch })
registerFixture()

const feedbackLink = Selector('a').withAttribute('data-target', '#feedback-modal')
const feedbackModal = Selector('#feedback-modal')
const emailInput = Selector('#feedback-modal form input[type="email"]')
const subjectInput = Selector('#feedback-modal form input[type="text"]')
const textInput = Selector('#feedback-modal form textarea[name="message"]')
const sendButton = Selector('#feedback-modal button:nth-child(2)')
const alertPanel = Selector('#feedback-modal .alert-danger')
const textPanel = Selector('#feedback-modal p')

fixture`Feedback`
  .page`http://localhost:${process.env.NEXT_PORT}`
  .before(async ctx => before())
  .after(async ctx => after())

test('send incomplete feedback as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists).ok()
    .click(sendButton)
    .expect(alertPanel.innerText)
    .eql(' Error: Missing required fields')
})

test('send feedback as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists).ok()
    .expect(emailInput.exists)
    .ok()
    .typeText(emailInput, 'melisa@test.com')
    .typeText(subjectInput, 'subject')
    .typeText(textInput, 'this is my feedback')
    .click(sendButton)
    .expect(textPanel.innerText)
    .eql('Your feedback has been submitted. Thank you.')

  const result = await api.post('/login', { id: 'openreview.net', password: '1234' })
  const result2 = await api.get('/messages?to=info@openreview.net', {}, { accessToken: result.token })
  await t.expect(result2.messages[0].content.subject).contains('OpenReview Feedback: subject')
})
