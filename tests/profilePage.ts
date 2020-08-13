/* eslint-disable newline-per-chained-call */
// note: existing es index may cause this test to fail. better to empty notes index
import { Selector, Role } from 'testcafe'
import {
  hasTaskUser, hasNoTaskUser as userB, getToken, getMessages, getNotes, getReferences,
} from './utils/api-helper'

const userBRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .click(Selector('button').withText('Login to OpenReview'))
})

// #region long repeated selectors
const errorMessageSelector = Selector('#flash-message-container', { visibilityCheck: true }).find('span.important_message')
const editFirstNameInputSelector = Selector('input:not([readonly]).first_name')
const editMiddleNameInputSelector = Selector('input:not([readonly]).middle_name')
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
const saveProfileButton = Selector('button').withText('Save Profile Changes')
const nameMakePreferredButton = Selector('#names_table').find('button.preferred_button').filterVisible().nth(0)
// #endregion

fixture`profile page`
  .before(async (ctx) => {
    ctx.superUserToken = await getToken('openreview.net', '1234')
    return ctx
  })
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
    .expect(Selector('#or-banner').find('a').innerText).eql('View Profile')
    .expect(Selector('#show-dblp-import-modal').getAttribute('disabled')).eql('disabled')
    .expect(Selector('ul.submissions-list').find('.note').count).eql(3) // has 1 publication note
    .expect(saveProfileButton.exists).ok()
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

  const { superUserToken } = t.fixtureCtx
  const messages = await getMessages({ to: 'a@aa.com', subject: 'OpenReview Account Linking' }, superUserToken)
  await t.expect(messages[0].content.text).contains('Click on the link below to confirm that a@aa.com and a@a.com both belong to the same person')
    // personal links
    .expect(Selector('#show-dblp-import-modal').getAttribute('disabled')).eql('disabled')
    .typeText(Selector('#dblp_url'), 'test')
    .expect(Selector('#show-dblp-import-modal').getAttribute('disabled')).eql(undefined) // button is enabled
    // save
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText).eql('test is not a valid URL')
    .selectText(Selector('#dblp_url'))
    .pressKey('delete')
    .click(saveProfileButton)
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
    .click(saveProfileButton)
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
    // keep 1 publication to check history
    .click(Selector('ul.submissions-list').find('.glyphicon-minus-sign').nth(1)) // unlink 2nd paper
    .click(saveProfileButton)
})
test('check import history', async (t) => {
  const { api, superUserToken } = t.fixtureCtx
  // let result = await api.get(`/notes/search?content=authors&term=${userB.tildeId}&cache=false}`, {}, { accessToken: superUserToken })
  const notes = await getNotes({ 'content.authorids': `${userB.tildeId}` }, superUserToken)
  // should have only 1 note
  await t.expect(notes.length).eql(1)
  const importedPaperId = notes[0].id
  const references = await getReferences({ referent: `${importedPaperId}` }, superUserToken)
  // shoud have 2 references: add paper and update authorid
  await t.expect(references.length).eql(2)
    .expect(references[1].content.authorids.includes(userB.tildeId)).notOk() // 1st post of paper has all dblp authorid
    .expect(references[0].content.authorids.includes(userB.tildeId)).ok() // authorid is updated
})
test('reimport unlinked paper and import all', async (t) => { // to trigger only authorid reference update
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(addDBLPPaperToProfileButton)
    .click(Selector('#dblp-import-modal').find('tr').withAttribute('class', undefined).nth(0).find('input'))
    .click(dblpImportModalAddToProfileBtn)
    .click(dblpImportModalCancelButton)
    // import all
    .click(addDBLPPaperToProfileButton)
    .click(Selector('#dblp-import-modal').find('input').withAttribute('type', 'checkbox').nth(0)) // check import all
    .click(dblpImportModalAddToProfileBtn)
    .wait(3000)
    .expect(Selector('#dblp-import-modal').visible).notOk() // after import all modal is auto hidden
    .click(addDBLPPaperToProfileButton)
    // select all checkbox should be selected and disabled
    .expect(Selector('#dblp-import-modal').find('input').withAttribute('type', 'checkbox').nth(0).hasAttribute('disabled')).ok()
    .expect(Selector('#dblp-import-modal').find('input').withAttribute('type', 'checkbox').nth(0).hasAttribute('checked')).ok()
    // coauthors should have values now
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.coauthors').find('li').count).gt(0)
})

// eslint-disable-next-line no-unused-expressions
fixture`profile page different user`
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

// eslint-disable-next-line no-unused-expressions
fixture`issue related tests`

test('#83 email status is missing', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.emails').find('div.list-compact').innerText).contains('Confirmed') // not sure how the status will be added so selector may need to be updated
    .expect(Selector('section.emails').find('div.list-compact').innerText).contains('Preferred')
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
    .expect(Selector('div.alert-content').innerText).contains('A confirmation email has been sent to x@x.com')
})
test.skip('#2143 date validation', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    // modify history start date with invalid value
    .typeText(Selector('#history_table').find('input.start').nth(0), '-2e-5', { replace: true, paste: true })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText).notEql('Your profile information has been successfully updated') // should not save successfully
})
test('#98 trailing slash error page', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/`) // trailing slash should redirect to url without /
    .expect(Selector('h1').withText('Error 404').exists).notOk()
    .expect(Selector('pre.error-message').exists).notOk()
})
test('#123 update name in nav when preferred name is updated ', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .expect(Selector('#user-menu').innerText).eql('FirstB LastB ')
    .click(nameMakePreferredButton)
    .click(saveProfileButton)
    .expect(Selector('#user-menu').innerText).eql('Di Xu ')
    .expect(Selector('div.title-container').find('h1').innerText).eql('Di Xu')
})
test('#160 allow user to overwrite last/middle/first name to be lowercase', async (t) => {
  await t.useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(nameSectionPlusIconSelector)
    .typeText(editFirstNameInputSelector, 'first', { speed: 0.3 }) // it will trigger call to generate ~ id so typing fast won't trigger capitalization
    .expect(editFirstNameInputSelector.value).eql('First')
    .pressKey('left left left left left delete f')
    .expect(editFirstNameInputSelector.value).eql('first')
    .typeText(editMiddleNameInputSelector, 'middle', { speed: 0.3 })
    .expect(editMiddleNameInputSelector.value).eql('Middle')
    .pressKey('left left left left left left delete m')
    .expect(editMiddleNameInputSelector.value).eql('middle')
    .typeText(editLastNameInputSelector, 'last', { speed: 0.3 })
    .expect(editLastNameInputSelector.value).eql('Last')
    .pressKey('left left left left delete l')
    .expect(editLastNameInputSelector.value).eql('last')
    .click(saveProfileButton)
    .expect(Selector('span').withText('first').exists).ok()
    .expect(Selector('span').withText('middle').exists).ok()
    .expect(Selector('span').withText('last').exists).ok()
})
