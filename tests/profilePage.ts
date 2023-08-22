/* eslint-disable newline-per-chained-call */
// note: existing es index may cause this test to fail. better to empty notes index
import { Selector, Role } from 'testcafe'
import {
  hasTaskUser,
  hasNoTaskUser as userB,
  getToken,
  getMessages,
  getNotes,
  getReferences,
  superUserName,
  strongPassword,
} from './utils/api-helper'

const userBRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .click(Selector('button').withText('Login to OpenReview'))
})

const userBAlternateId = '~Di_Xu1'

// #region long repeated selectors
const errorMessageSelector = Selector('#flash-message-container', {
  visibilityCheck: true,
}).find('span.important_message')
const editFirstNameInputSelector = Selector('input:not([readonly]).first-name')
const editMiddleNameInputSelector = Selector('input:not([readonly]).middle-name')
const editLastNameInputSelector = Selector('input:not([readonly]).last-name')
const nameSectionPlusIconSelector = Selector('section').nth(0).find('.glyphicon-plus-sign')
const emailSectionPlusIconSelector = Selector('section').nth(3).find('.glyphicon-plus-sign')
const editEmailInputSelector = Selector('input:not([readonly]).email')
const emailConfirmButtons = Selector('section').nth(3).find('button').withText('Confirm')
const emailRemoveButtons = Selector('section').nth(3).find('button').withText('Remove')
const pageHeader = Selector('div.title-container').find('h1')
const profileViewEmail = Selector('section.emails').find('span')
const addDBLPPaperToProfileButton = Selector('button.personal-links__adddblpbtn')
const persistentUrlInput = Selector('div.persistent-url-input').find('input')
const showPapersButton = Selector('div.persistent-url-input')
  .find('button')
  .withText('Show Papers')
const dblpImportModalCancelButton = Selector('#dblp-import-modal')
  .find('button')
  .withText('Cancel')
const dblpImportModalAddToProfileBtn = Selector('#dblp-import-modal')
  .find('button')
  .withText('Add to Your Profile')
const dblpImportModalSelectCount = Selector('#dblp-import-modal').find('div.selected-count')
const saveProfileButton = Selector('button').withText('Save Profile Changes')
const nameMakePreferredButton = Selector('div.container.names')
  .find('button.preferred_button')
  .filterVisible()
  .nth(0)
const dblpUrlInput = Selector('#dblp_url')
const homepageUrlInput = Selector('#homepage_url')
const yearOfBirthInput = Selector('section').nth(2).find('input')
// #endregion

fixture`Profile page`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('user open own profile', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasTaskUser.email)
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
    .click(Selector('a.dropdown-toggle'))
    .click(Selector('a').withText('Profile'))
    .expect(Selector('#edit-banner').find('a').innerText)
    .eql('Edit Profile')
    // go to profile edit page
    .click(Selector('a').withText('Edit Profile'))
    .expect(Selector('h1').withText('Edit Profile').exists)
    .ok()
    .expect(Selector('#edit-banner').find('a').innerText)
    .eql('View Profile')
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .ok()
    .expect(Selector('ul.submissions-list').exists)
    .notOk() // show imported papers only
    .expect(saveProfileButton.exists)
    .ok()
    // make some changes and save
    // add a name
    .click(nameSectionPlusIconSelector)
    .typeText(editFirstNameInputSelector, '111', { paste: true })
    .expect(errorMessageSelector.innerText)
    .eql(
      'The name 111 is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
    .typeText(editFirstNameInputSelector, '`', { replace: true })
    .expect(errorMessageSelector.innerText)
    .eql(
      'The name ` is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
    .click(Selector('button.remove_button').filterVisible())
    // add a email
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@aa.')
    .expect(emailConfirmButtons.exists)
    .notOk() // should have no buttons when email is invalid
    .expect(emailRemoveButtons.exists)
    .notOk()
    .typeText(editEmailInputSelector, 'a@aa.com', { replace: true })
    .expect(emailConfirmButtons.nth(0).visible)
    .ok() // should show buttons when added email is valid
    .expect(emailRemoveButtons.nth(0).visible)
    .ok()
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(errorMessageSelector.innerText)
    .eql('A confirmation email has been sent to a@aa.com')
    .click(Selector('button').withText('Remove').filterVisible())
    // add empty homepage link
    .typeText(homepageUrlInput, ' ', { replace: true })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('You must enter at least one personal link')

  const { superUserToken } = t.fixtureCtx
  const messages = await getMessages(
    { to: 'a@aa.com', subject: 'OpenReview Account Linking' },
    superUserToken
  )
  await t
    .expect(messages[0].content.text)
    .contains(
      'Click on the link below to confirm that a@aa.com and a@a.com both belong to the same person'
    )
    // personal links
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .ok()
    .typeText(dblpUrlInput, 'http://test.com', { replace: true, paste: true })
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .notOk() // button is enabled
    // save
    .typeText(homepageUrlInput, 'http://google.com', { replace: true, paste: true })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql(
      'The value http://test.com in dblp is invalid. Expected value: should include https://dblp.org, https://dblp.uni-trier.de, https://dblp2.uni-trier.de, https://dblp.dagstuhl.de, uni-trier.de'
    )
    .selectText(dblpUrlInput)
    .pressKey('delete')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')
})

test('add and delete year of birth', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    // add invalid year of birth
    .typeText(yearOfBirthInput, '0000')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .contains('The value 0 in yearOfBirth is invalid')
    // add valid year of birth
    .typeText(yearOfBirthInput, '2000')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')

  await t
    // remove year of birth
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .expect(yearOfBirthInput.value)
    .eql('2000')
    .selectText(yearOfBirthInput)
    .pressKey('delete')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')

  await t
    // verify year of birth has been removed
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .expect(yearOfBirthInput.value)
    .eql('')
})

test('import paper from dblp', async (t) => {
  const testPersistentUrl = 'https://dblp.org/pid/95/7448-1'
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .ok()
    // put incorrect persistant url
    .typeText(dblpUrlInput, 'xxx', { paste: true })
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .notOk()
    .expect(Selector('#dblp-import-modal').visible)
    .notOk()
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').visible)
    .ok()
    .expect(Selector('#dblp-import-modal').find('div.body-message').innerText)
    .contains('Visit your DBLP home page: xxx')
    // put persistent url of other people in modal
    .typeText(persistentUrlInput, testPersistentUrl)
    .click(showPapersButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body>p').nth(0).innerText)
    .contains('Your OpenReview profile must contain the EXACT name used in your DBLP papers.', undefined, { timeout: 5000 })
    .click(dblpImportModalCancelButton)
    // put persistent url of other people in page
    .typeText(dblpUrlInput, testPersistentUrl, { replace: true, paste: true })
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body>p').nth(0).innerText)
    .contains('Your OpenReview profile must contain the EXACT name used in your DBLP papers.', undefined, { timeout: 5000 })
    .click(dblpImportModalCancelButton)
    // add name to skip validation error
    .click(nameSectionPlusIconSelector)
    .typeText(editFirstNameInputSelector, 'Di')
    .typeText(editLastNameInputSelector, 'Xu')
    .click(saveProfileButton)
    .click(Selector('a').withText('Edit Profile'))
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body').innerText)
    .contains('Please select the new publications of which you are actually an author.')
    // import 2 papers
    .expect(dblpImportModalAddToProfileBtn.hasAttribute('disabled'))
    .ok()
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(0)
        .find('input')
    )
    .expect(dblpImportModalSelectCount.innerText)
    .eql('1 publication selected')
    .expect(dblpImportModalAddToProfileBtn.hasAttribute('disabled'))
    .notOk()
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(1)
        .find('input')
    )
    .expect(dblpImportModalSelectCount.innerText)
    .eql('2 publications selected')
    // test year checkbox
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(0)
        .find('input')
    )
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(1)
        .find('input')
    )
    .click(
      Selector('#dblp-import-modal')
        .find('h4.panel-title')
        .nth(0)
        .find('input')
        .withAttribute('class', 'year-checkbox')
    )
    .expect(dblpImportModalSelectCount.innerText)
    .eql('3 publications selected')
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(2)
        .find('input')
    )

    .click(dblpImportModalAddToProfileBtn)
    .expect(Selector('#dblp-import-modal').find('.modal-body').find('p').innerText)
    .contains('2 publications were successfully imported.')
    .click(Selector('#dblp-import-modal').find('span').withExactText('×'))
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count)
    .eql(2) // imported 2 papers are removable/unlinkable
})

test('unlink paper', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('ul.submissions-list').find('div.note').count)
    .eql(2) // profile view has the 2 papers imported
    .click(Selector('a').withText('Edit Profile'))
    .click(Selector('ul.submissions-list').find('.glyphicon-minus-sign').nth(1)) // unlink 2nd paper
    .expect(Selector('ul.submissions-list').find('div.unlinked-publication').count)
    .eql(1)
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count)
    .eql(1)
    .expect(Selector('ul.submissions-list').find('.glyphicon-repeat').count)
    .eql(1)
    .click(Selector('ul.submissions-list').find('.glyphicon-repeat').nth(0)) // relink
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count)
    .eql(2) // still 2 papers removable
    // keep 1 publication to check history
    .click(Selector('ul.submissions-list').find('.glyphicon-minus-sign').nth(1)) // unlink 2nd paper
    .click(saveProfileButton)
})

test('check import history', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes({ 'content.authorids': `${userB.tildeId}` }, superUserToken)
  // should have only 1 note
  await t.expect(notes.length).eql(1)
  const importedPaperId = notes[0].id
  const references = await getReferences(
    { referent: `${importedPaperId}`, sort: 'mdate' },
    superUserToken
  )
  // shoud have 2 references: add paper and update authorid
  await t
    .expect(references.length)
    .eql(2)
    // eslint-disable-next-line max-len
    .expect(references[1].content.authorids.includes(userBAlternateId))
    .notOk() // 1st post of paper has all dblp authorid
    .expect(references[0].content.authorids.includes(userBAlternateId))
    .ok() // authorid is updated
})

test('reimport unlinked paper and import all', async (t) => {
  // to trigger only authorid reference update
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(addDBLPPaperToProfileButton)
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(0)
        .find('input')
    )
    .click(dblpImportModalAddToProfileBtn)
    .click(dblpImportModalCancelButton)
    // import all
    .click(addDBLPPaperToProfileButton)
    .click(
      Selector('#dblp-import-modal').find('input').withAttribute('type', 'checkbox').nth(0)
    ) // check import all
    .click(dblpImportModalAddToProfileBtn)
    .wait(3000)
    .expect(Selector('#dblp-import-modal').visible)
    .notOk() // after import all modal is auto hidden
    .click(addDBLPPaperToProfileButton)
    // select all checkbox should be selected and disabled
    .expect(
      Selector('#dblp-import-modal')
        .find('input')
        .withAttribute('type', 'checkbox')
        .nth(0)
        .hasAttribute('disabled')
    )
    .ok()
    .expect(
      Selector('#dblp-import-modal')
        .find('input')
        .withAttribute('type', 'checkbox')
        .nth(0)
        .hasAttribute('checked')
    )
    .ok()
    // coauthors should have values now
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.coauthors').find('li').count)
    .gt(0)
})

// eslint-disable-next-line no-unused-expressions
fixture`Profile page different user`

test('open profile of other user by email', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .click(Selector('button').withText('Login to OpenReview'))
    // access FirstA LastA's profile page by email
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?email=${hasTaskUser.email}`)
    .expect(Selector('a').withText('Edit Profile').exists)
    .notOk()
    .expect(pageHeader.innerText)
    .eql(`${hasTaskUser.first} ${hasTaskUser.last}`)
    .expect(profileViewEmail.innerText)
    .contains('****') // email should be masked
})

test('open profile of other user by id', async (t) => {
  // access FirstA LastA's profile page by tildeId
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?id=${hasTaskUser.tildeId}`)
    .expect(Selector('a').withText('Edit Profile').exists)
    .notOk()
    .expect(pageHeader.innerText)
    .eql(`${hasTaskUser.first} ${hasTaskUser.last}`)
    .expect(profileViewEmail.innerText)
    .contains('****')
})

// eslint-disable-next-line no-unused-expressions
fixture`Issue related tests`

test('#83 email status is missing', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.emails').find('div.list-compact').innerText)
    .contains('Confirmed') // not sure how the status will be added so selector may need to be updated
    .expect(Selector('section.emails').find('div.list-compact').innerText)
    .contains('Preferred')
})
test('#84 merge profile modal should fill in id', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@a.com')
    .click(Selector('button').withText('Confirm').filterVisible())
    .click(Selector('a').withText('Merge Profiles').filterVisible())
    .expect(
      Selector('#profile-merge-modal').find('input').withAttribute('type', 'email').exists
    )
    .notOk()
    .expect(
      Selector('#profile-merge-modal')
        .find('input')
        .withAttribute('value', '~FirstB_LastB1,~FirstA_LastA1').exists
    )
    .ok()
    .expect(
      Selector('#profile-merge-modal')
        .find('input')
        .withAttribute('value', '~FirstB_LastB1,~FirstA_LastA1')
        .hasAttribute('readonly')
    )
    .ok()
    .expect(
      Selector('#profile-merge-modal')
        .find('button')
        .withText('Submit')
        .hasAttribute('disabled')
    )
    .ok()
    .typeText(
      Selector('#profile-merge-modal').find('textarea').withAttribute('id', 'comment'),
      'some comment'
    )
    .expect(
      Selector('#profile-merge-modal')
        .find('button')
        .withText('Submit')
        .hasAttribute('disabled')
    )
    .notOk()
})
test('#85 confirm profile email message', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@a.com')
    .click(Selector('button').withText('Confirm').filterVisible())
    .typeText(editEmailInputSelector, 'x@x.com', { replace: true })
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(Selector('#flash-message-container').find('div.alert-content').innerText)
    .contains('A confirmation email has been sent to x@x.com')
})
test.skip('#2143 date validation', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    // modify history start date with invalid value
    .typeText(Selector('div.history').find('input.start').nth(0), '-2e-5', {
      replace: true,
      paste: true,
    })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .notEql('Your profile information has been successfully updated') // should not save successfully
})
test('#98 trailing slash error page', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/`) // trailing slash should redirect to url without /
    .expect(Selector('h1').withText('Error 404').exists)
    .notOk()
    .expect(Selector('pre.error-message').exists)
    .notOk()
})
test('#123 update name in nav when preferred name is updated ', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .expect(Selector('#user-menu').innerText)
    .eql('FirstB LastB ')
    .click(nameMakePreferredButton)
    .click(saveProfileButton)
    .expect(Selector('#user-menu').innerText)
    .eql('Di Xu ')
    .expect(Selector('div.title-container').find('h1').innerText)
    .eql('Di Xu')
})
test('#160 allow user to overwrite last/middle/first name to be lowercase', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(nameSectionPlusIconSelector)
    .typeText(editFirstNameInputSelector, 'first', { speed: 0.3 }) // it will trigger call to generate ~ id so typing fast won't trigger capitalization
    .expect(editFirstNameInputSelector.value)
    .eql('First')
    .pressKey('left left left left left delete f')
    .expect(editFirstNameInputSelector.value)
    .eql('first')
    .typeText(editMiddleNameInputSelector, 'middle', { speed: 0.3 })
    .expect(editMiddleNameInputSelector.value)
    .eql('Middle')
    .pressKey('left left left left left left delete m')
    .expect(editMiddleNameInputSelector.value)
    .eql('middle')
    .typeText(editLastNameInputSelector, 'last', { speed: 0.3 })
    .expect(editLastNameInputSelector.value)
    .eql('Last')
    .pressKey('left left left left delete l')
    .expect(editLastNameInputSelector.value)
    .eql('last')
    .click(saveProfileButton)
    .expect(Selector('span').withText('first').exists)
    .ok()
    .expect(Selector('span').withText('middle').exists)
    .ok()
    .expect(Selector('span').withText('last').exists)
    .ok()
})
test('fail before 2099', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .typeText(
      Selector('div.history').find('input').nth(2),
      `${new Date().getFullYear() + 10}`,
      { replace: true }
    ) // to fail in 2090, update validation regex
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated', undefined, { timeout: 5000 })
})
test('#1011 remove space in personal links', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .click(nameSectionPlusIconSelector)
    .typeText(homepageUrlInput, '   https://github.com/xkOpenReview    ', {
      replace: true,
      paste: true,
    })
    .pressKey('tab')
    .click(saveProfileButton)
    .expect(
      Selector('a')
        .withText('Homepage')
        .withAttribute('href', 'https://github.com/xkOpenReview').exists
    )
    .ok()
})
