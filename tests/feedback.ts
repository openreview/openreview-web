import { Selector } from 'testcafe'
import { registerFixture, before, after } from './utils/hooks'

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
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

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

  const { api, superUserToken } = t.fixtureCtx
  const result = await api.get('/messages?to=info@openreview.net', {}, { accessToken: superUserToken })
  await t.expect(result.messages[0].content.subject).contains('OpenReview Feedback: subject')
})
