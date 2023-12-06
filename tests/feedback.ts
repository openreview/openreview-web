import { Selector } from 'testcafe'
import { getToken, getMessages, superUserName, strongPassword } from './utils/api-helper'

const feedbackLink = Selector('a').withAttribute('data-target', '#feedback-modal').nth(0)
const feedbackModal = Selector('#feedback-modal')
const emailInput = Selector('#feedback-modal form input[placeholder="Email"]')
const subjectInput = Selector('#feedback-modal form input[placeholder="Subject"]')
const categoryDropdown = Selector('#feedback-modal form div.feedback-dropdown')
const profileDropdownOption = Selector('#feedback-modal').find('div.dropdown-select__option').nth(0)
const submissionDropdownOption = Selector('#feedback-modal').find('div.dropdown-select__option').nth(1)
const organizationDropdownOption = Selector('#feedback-modal').find('div.dropdown-select__option').nth(2)
const institutionDropdownOption = Selector('#feedback-modal').find('div.dropdown-select__option').nth(3)
const profileIdInput = Selector('#feedback-modal form input[placeholder="Profile ID"]')
const venueIdInput = Selector('#feedback-modal form input[placeholder="Venue ID or Conference Name"]')
const submissionIdInput = Selector('#feedback-modal form input[placeholder="Submission ID"]')
const institutionEmailDomainInput = Selector('#feedback-modal form input[placeholder="Email Domain of Your Institution"]')
const institutionURLInput = Selector('#feedback-modal form input[placeholder="URL of Your Institution"]')
const messageInput = Selector('#feedback-modal form textarea[placeholder="Message"]')
const sendButton = Selector('#feedback-modal button:nth-child(2)')
const alertPanel = Selector('#feedback-modal .alert-danger')
const textPanel = Selector('#feedback-modal p')

fixture`Feedback Modal`.page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('send incomplete feedback as a guest user', async (t) => {
  await t
    .click(feedbackLink)
    .expect(feedbackModal.exists)
    .ok()
    .expect(sendButton.hasAttribute('disabled')).notOk({ timeout: 5000 })
    .click(sendButton)
    .expect(alertPanel.innerText)
    .eql(' Error: Please fill in all fields.')
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
    .click(categoryDropdown)
    .click(profileDropdownOption)
    .expect(profileIdInput.exists).ok()
    .click(categoryDropdown)
    .click(submissionDropdownOption)
    .expect(submissionIdInput.exists).ok()
    .expect(venueIdInput.exists).ok()
    .click(categoryDropdown)
    .click(organizationDropdownOption)
    .expect(venueIdInput.exists).ok()
    .click(categoryDropdown)
    .click(institutionDropdownOption)
    .expect(institutionEmailDomainInput.exists).ok()
    .expect(institutionURLInput.exists).ok()

  await t.click(categoryDropdown)
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
