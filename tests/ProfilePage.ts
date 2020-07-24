/* eslint-disable newline-per-chained-call */
import { Selector, Role } from 'testcafe'
import { hasTaskUser, hasNoTaskUser as userB } from './utils/api-helper'
import { registerFixture, before, after } from './utils/hooks'

require('dotenv').config()

registerFixture()

const userBRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .click(Selector('button').withText('Login to OpenReview'))
})

// #region long repeated selectors
const errorMessageSelector = Selector('#flash-message-container', { visibilityCheck: true }).find('span.important_message')
const editFirstNameInputSelector = Selector('input:not([readonly]).first_name')
const editLastNameInputSelector = Selector('input:not([readonly]).last_name')
const nameSectionPlusIconSelector = Selector('section').nth(0).find('.glyphicon-plus-sign')
const emailSectionPlusIconSelector = Selector('section').nth(2).find('.glyphicon-plus-sign')
const editEmailInputSelector = Selector('input:not([readonly]).email')
const emailConfirmButtons = Selector('section').nth(2).find('button').withText('Confirm')
const emailRemoveButtons = Selector('section').nth(2).find('button').withText('Remove')
const pageHeader = Selector('div.title-container').find('h1')
const profileViewEmail = Selector('section.emails').find('span')
const addDBLPPaperToProfileButton = Selector('button#show-dblp-import-modal')
const persistentUrlInput = Selector('div.persistent-url-input').find('input')
const showPapersButton = Selector('div.persistent-url-input').find('button').withText('Show Papers')
const dblpImportModalCancelButton = Selector('div.modal-footer').find('button').withText('Cancel')
const dblpImportModalAddToProfileBtn = Selector('div.modal-footer').find('button').withText('Add to Your Profile')
const dblpImportModalSelectCount = Selector('div.modal-footer').find('div.selected-count')
// #endregion

fixture`setup`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))
test('dummy test to run setup', async (t) => {})

fixture.only`profile page`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))
test('user open own profile', async (t) => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasTaskUser.email)
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
    .click(Selector('a.dropdown-toggle'))
    .click(Selector('a').withText('Profile'))
    .expect(Selector('#or-banner').find('a').innerText).eql('Edit Profile')
    // go to profile edit page
    .click(Selector('a').withText('Edit Profile'))
    .expect(Selector('h1').withText('Edit Profile').exists).ok()
    .expect(Selector('#or-banner').find('a').innerText).eql('Back to public profile')
    .expect(Selector('#show-dblp-import-modal').getAttribute('disabled')).eql('disabled')
    .expect(Selector('ul.submissions-list').find('.note').count).eql(1) // has 1 publication note
    .expect(Selector('button').withText('Save Profile Changes').exists).ok()
    // make some changes and save
    // add a name
    .click(nameSectionPlusIconSelector)
    .typeText(editFirstNameInputSelector, '111')
    .expect(errorMessageSelector.innerText).eql('Name is not allowed to contain digits')
    .typeText(editFirstNameInputSelector, '`', { replace: true })
    .expect(errorMessageSelector.innerText).eql('Name contains invalid characters: ~`_')
    .click(Selector('button.remove_button').filterVisible())
    // add a email
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@aa.')
    .expect(emailConfirmButtons.visible).notOk() // should have no visible buttons when email is invalid
    .expect(emailRemoveButtons.visible).notOk()
    .typeText(editEmailInputSelector, 'a@aa.com', { replace: true })
    .expect(emailConfirmButtons.nth(1).visible).ok() // should show buttons when added email(index 1) is valid
    .expect(emailRemoveButtons.nth(1).visible).ok()
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(errorMessageSelector.innerText).eql('A confirmation email has been sent to a@aa.com')
    .click(Selector('button').withText('Remove').filterVisible())

  const { api, superUserToken } = t.fixtureCtx
  const result = await api.get('/messages?to=a@aa.com&subject=OpenReview Account Linking', {}, { accessToken: superUserToken })
  await t.expect(result.messages[0].content.text).contains('Click on the link below to confirm that a@aa.com and a@a.com both belong to the same person')
    // personal links
    .expect(Selector('#show-dblp-import-modal').getAttribute('disabled')).eql('disabled')
    .typeText(Selector('#dblp_url'), 'test')
    .expect(Selector('#show-dblp-import-modal').getAttribute('disabled')).eql(undefined) // button is enabled
    // save
    .click(Selector('button').withText('Save Profile Changes'))
    .expect(errorMessageSelector.innerText).eql('test is not a valid URL')
    .selectText(Selector('#dblp_url'))
    .pressKey('delete')
    .click(Selector('button').withText('Save Profile Changes'))
    .expect(errorMessageSelector.innerText).eql('Your profile information has been successfully updated')
})
test('import paper from dblp', async (t) => {
  const testPersistentUrl = 'https://dblp.org/pid/95/7448-1'
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled')).ok()
    // put incorrect persistant url
    .typeText(Selector('input#dblp_url'), 'xxx')
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled')).notOk()
    .expect(Selector('#dblp-import-modal').visible).notOk()
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').visible).ok()
    .expect(Selector('#dblp-import-modal').find('div.body-message').innerText).contains('Visit your DBLP home page: xxx')
    // put persistent url of other people in modal
    .typeText(persistentUrlInput, testPersistentUrl)
    .click(showPapersButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body').innerText).eql('Please ensure that the DBLP URL provided is yours')
    .click(dblpImportModalCancelButton)
    // put persistent url of other people in page
    .typeText(Selector('input#dblp_url'), testPersistentUrl, { replace: true })
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body').innerText).eql('Please ensure that the DBLP URL provided is yours')
    .click(dblpImportModalCancelButton)
    // add name to skip validation error
    .click(nameSectionPlusIconSelector)
    .typeText(editFirstNameInputSelector, 'Di')
    .typeText(editLastNameInputSelector, 'Xu')
    .click(Selector('button').withText('Save Profile Changes'))
    .click(Selector('a').withText('Edit Profile'))
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body').innerText).contains('Please select the new publications of which you are actually an author.')
    // import 2 papers
    .expect(dblpImportModalAddToProfileBtn.hasAttribute('disabled')).ok()
    .click(Selector('#dblp-import-modal').find('tr').withAttribute('class', undefined).nth(0).find('input'))
    .expect(dblpImportModalSelectCount.innerText).eql('1 publication selected')
    .expect(dblpImportModalAddToProfileBtn.hasAttribute('disabled')).notOk()
    .click(Selector('#dblp-import-modal').find('tr').withAttribute('class', undefined).nth(1).find('input'))
    .expect(dblpImportModalSelectCount.innerText).eql('2 publications selected')
    .click(dblpImportModalAddToProfileBtn)
    // .expect(Selector('#dblp-import-modal').find('.modal-body').find('p').innerText).contains('2 publications were successfully imported.') // will fail till #87 is fixed
    .click(Selector('#dblp-import-modal').find('span').withExactText('×'))
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count).eql(2) // imported 2 papers are removable/unlinkable
})
test('unlink paper', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('ul.submissions-list').find('div.note').count).eql(2) // profile view has the 2 papers imported
    .click(Selector('a').withText('Edit Profile'))
    .click(Selector('ul.submissions-list').find('.glyphicon-minus-sign').nth(1)) // unlink 2nd paper
    .expect(Selector('ul.submissions-list').find('li.unlinked-publication').count).eql(1)
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count).eql(1)
    .expect(Selector('ul.submissions-list').find('.glyphicon-repeat').count).eql(1)
    .click(Selector('ul.submissions-list').find('.glyphicon-repeat').nth(0)) // relink
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count).eql(2) // still 2 papers removable
})

fixture`profile page different user`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))
test('open profile of other user by email', async (t) => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .click(Selector('button').withText('Login to OpenReview'))
    // access FirstA LastA's profile page by email
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?email=${hasTaskUser.email}`)
    .expect(Selector('a').withText('Edit Profile').exists).notOk()
    .expect(pageHeader.innerText).eql(`${hasTaskUser.first} ${hasTaskUser.last}`)
    .expect(profileViewEmail.innerText).contains('****') // email should be masked
})
test('open profile of other user by id', async (t) => {
  // access FirstA LastA's profile page by tildeId
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?id=${hasTaskUser.tildeId}`)
    .expect(Selector('a').withText('Edit Profile').exists).notOk()
    .expect(pageHeader.innerText).eql(`${hasTaskUser.first} ${hasTaskUser.last}`)
    .expect(profileViewEmail.innerText).contains('****')
})

fixture`issue related tests`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))
test('#83 email status is missing', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.emails').find('span').innerText).contains('Confirmed') // not sure how the status will be added so selector may need to be updated
    .expect(Selector('section.emails').find('span').innerText).contains('Preferred')
})
test('#84 merge profile feedback modal should fill in email', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@a.com')
    .click(Selector('button').withText('Confirm').filterVisible())
    .click(Selector('a').withText('Merge Profiles').filterVisible())
    .expect(Selector('#feedback-modal').find('input').withAttribute('type', 'email').value).eql(userB.email)
})
test('#85 confirm profile email message', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@a.com')
    .click(Selector('button').withText('Confirm').filterVisible())
    .typeText(editEmailInputSelector, 'x@x.com', { replace: true })
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(Selector('div.alert-content').innerText).eql('A confirmation email has been sent to x@x.com')
})
