import { Selector } from 'testcafe'
import { getToken, getMessages, superUserName, strongPassword } from './utils/api-helper'

const feedbackLink = Selector('a').withAttribute('data-target', '#feedback-modal').nth(0)
const feedbackModal = Selector('#feedback-modal')
const emailInput = Selector('#feedback-modal form input[placeholder="Email"]')
const subjectDropdown = Selector('#feedback-modal form div.feedback-dropdown__control')
const profileDropdownOption = Selector('#feedback-modal').find('div.feedback-dropdown__option').nth(0)
const submissionDropdownOption = Selector('#feedback-modal').find('div.feedback-dropdown__option').nth(1)
const organizationDropdownOption = Selector('#feedback-modal').find('div.feedback-dropdown__option').nth(2)
const institutionDropdownOption = Selector('#feedback-modal').find('div.feedback-dropdown__option').nth(3)
const profileIdInput = Selector('#feedback-modal form input[placeholder="Profile ID"]')
const venueIdInput = Selector('#feedback-modal form input[placeholder="Venue ID or Conference Name"]')
const submissionIdInput = Selector('#feedback-modal form input[placeholder="Submission ID"]')
const institutionEmailDomainInput = Selector('#feedback-modal form input[placeholder="Email Domain of Your Institution"]')
const institutionNameInput = Selector('#feedback-modal form input[placeholder="Full Name of Your Institution"]')
const institutionURLInput = Selector('#feedback-modal form input[placeholder="Official Website URL of Your Institution"]')
const messageInput = Selector('#feedback-modal form textarea[placeholder="Message"]')
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
    .expect(sendButton.hasAttribute('disabled')).notOk({ timeout: 5000 })
    .click(sendButton)
    .expect(alertPanel.innerText)
    .eql(' Error: Please fill in all fields.')
})

test('send feedback with no message as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .expect(emailInput.exists)
    .ok()
    .typeText(emailInput, 'melisa@test.com')
    .expect(sendButton.hasAttribute('disabled')).notOk({ timeout: 5000 })
    .click(sendButton)
    .expect(alertPanel.innerText)
    .eql(' Error: Please fill in all fields.')
})

test('send feedback selecting subject', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .expect(emailInput.exists)
    .ok()
    .typeText(emailInput, 'melisa@test.com')
    .click(subjectDropdown)
    .click(profileDropdownOption)
    .expect(profileIdInput.exists).ok()
    .selectText(Selector('#feedback-modal form input[value="My OpenReview profile"]'))
    .pressKey('delete')
    .click(subjectDropdown)
    .click(submissionDropdownOption)
    .expect(submissionIdInput.exists).ok()
    .expect(venueIdInput.exists).ok()
    .selectText(Selector('#feedback-modal form input[value="A conference I submitted to"]'))
    .pressKey('delete')
    .click(subjectDropdown)
    .click(organizationDropdownOption)
    .expect(venueIdInput.exists).ok()
    .selectText(Selector('#feedback-modal form input[value="A conference I organized"]'))
    .pressKey('delete')
    .click(subjectDropdown)
    .click(institutionDropdownOption)
    .expect(institutionEmailDomainInput.exists).ok()
    .expect(institutionNameInput.exists).ok()
    .expect(institutionURLInput.exists).ok()


  await t
    .selectText(Selector('#feedback-modal form input[value="My institution email is not recognized"]'))
    .pressKey('delete')
    .click(subjectDropdown)
    .click(profileDropdownOption)
    .typeText(profileIdInput, '~Melisa_Test1')
    .typeText(messageInput, 'this is my feedback')
    .expect(sendButton.hasAttribute('disabled')).notOk({ timeout: 5000 })
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
    .expect(messages[0].content.text)
    .eql('Profile ID: ~Melisa_Test1\n\nthis is my feedback')
})

test('send feedback custom subject', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .expect(emailInput.exists)
    .ok()
    .typeText(emailInput, 'melisa@test.com')
    .click(subjectDropdown)
    .typeText(subjectDropdown, 'something that is not listed')
    .typeText(messageInput, 'this is my feedback')
    .expect(sendButton.hasAttribute('disabled')).notOk({ timeout: 5000 })
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
    .eql(2)
    .expect(messages[1].content.replyTo)
    .eql('melisa@test.com')
    .expect(messages[1].content.subject)
    .eql('something that is not listed')
    .expect(messages[1].content.text)
    .eql('this is my feedback')
})
