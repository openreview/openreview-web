import { Selector, Role } from 'testcafe'
import { getToken, getNotes, superUserName, strongPassword } from './utils/api-helper'

const titleLabel = Selector('.forum-title h2')
const authorLabel = Selector('.forum-authors span')
const abstractLabel = Selector('.note-content-value p')
const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const container = Selector('.forum-container')
const confirmDeleteModal = Selector('#confirm-delete-modal')

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})
const authorRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'a@a.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})
const pcRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'program_chair@mail.com')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})
const superUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'openreview.net')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})

fixture`Forum page`.page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('show a valid forum', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'TestVenue/2023/Conference/-/Submission' },
    superUserToken,
    2
  )
  const forum = notes[0].id
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists)
    .ok()
    .expect(Selector('.forum-note').exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('Paper Title 1')
    .expect(authorLabel.innerText)
    .eql('FirstA LastA ')
    .expect(abstractLabel.innerText)
    .eql('Paper Abstract')
})

test('delete the forum note and restore it', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'TestVenue/2023/Conference/-/Submission' },
    superUserToken,
    2
  )
  const forum = notes[0].id

  await t
    .useRole(pcRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists)
    .ok()
    .expect(Selector('.forum-note').exists)
    .ok()
    // Delete the note
    .click(Selector('.invitation-buttons').find('button').withAttribute('type', 'button').nth(1))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(Selector('.dropdown-select'))
    .click(Selector('.dropdown-select').find('.dropdown-select__menu-list > div').nth(1))
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Delete'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.forum-note').hasClass('trashed'))
    .ok()
    // Restore the note
    .click(Selector('.invitation-buttons').find('button').withAttribute('type', 'button').nth(0))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(Selector('.dropdown-select'))
    .click(Selector('.dropdown-select').find('.dropdown-select__menu-list > div').nth(1))
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Restore'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.forum-note').hasClass('trashed'))
    .notOk()
})

test('delete the forum reply note and restore it', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'TestVenue/2023/Conference/-/Submission' },
    superUserToken,
    2
  )
  const forum = notes[0].id

  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists)
    .ok()
    .expect(Selector('#forum-replies').exists)
    .ok()
    // Delete the note
    .click(Selector('#forum-replies').find('button').withAttribute('type', 'button').nth(5))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Delete'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.note').hasClass('deleted'))
    .ok()
    // Restore the note
    .click(Selector('#forum-replies').find('button').withAttribute('type', 'button').nth(4))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Restore'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.note').hasClass('deleted'))
    .notOk()
})



