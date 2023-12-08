import { Selector } from 'testcafe'
import { getToken, getMessages, superUserName, strongPassword } from './utils/api-helper'

const feedbackLink = Selector('a').withAttribute('data-target', '#feedback-modal').nth(0)
const feedbackModal = Selector('#feedback-modal')
const emailInput = Selector('#feedback-modal form input[type="email"]')
const subjectInput = Selector('#feedback-modal form input[type="text"]')
const textInput = Selector('#feedback-modal form textarea[name="message"]')
const sendButton = Selector('#feedback-modal button:nth-child(2)')
const alertPanel = Selector('#feedback-modal .alert-danger')
const textPanel = Selector('#feedback-modal p')

fixture`Feedback Modal`.page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('send empty feedback as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .click(sendButton)
    .expect(alertPanel.innerText)
    .eql(' Error: from must NOT have fewer than 1 characters')
})

test('send feedback with no message as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .expect(emailInput.exists)
    .ok()
    .typeText(emailInput, 'melisa@test.com')
    .click(sendButton)
    .expect(alertPanel.innerText)
    .eql(' Error: message must NOT have fewer than 1 characters')
})

test('send feedback as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .expect(emailInput.exists)
    .ok()
    .typeText(emailInput, 'melisa@test.com')
    .typeText(subjectInput, 'subject')
    .typeText(textInput, 'this is my feedback')
    .click(sendButton)
    .expect(textPanel.innerText)
    .eql('Your feedback has been submitted. Thank you.')

  const { superUserToken } = t.fixtureCtx
  const messages = await getMessages(
    { subject: 'OpenReview Feedback: subject' },
    superUserToken
  )
  await t
    .expect(messages.length)
    .eql(1)
    .expect(messages[0].content.replyTo)
    .eql('melisa@test.com')
})
