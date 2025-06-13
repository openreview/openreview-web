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

fixture`Forum page`.page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
  const superUserToken = await getToken(superUserName, strongPassword)
  const notes = await getNotes(
    { invitation: 'TestVenue/2023/Conference/-/Submission' },
    superUserToken,
    2
  )
  ctx.forumId = notes[0].id

  const replyNotes = await getNotes(
    { invitation: 'TestVenue/2023/Conference/Submission1/-/Official_Review' },
    superUserToken,
    2
  )
  ctx.reviewId = replyNotes[0].id
  return ctx
})

test('show a valid forum', async (t) => {
  const { forumId } = t.fixtureCtx
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forumId}`)
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

test('view forum bibtex', async (t) => {
  const { forumId } = t.fixtureCtx
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forumId}`)
    .click(Selector('a').withText('BibTeX'))
    .expect(Selector('#bibtex-modal.in').exists)
    .ok()
})

test('delete the forum note and restore it', async (t) => {
  const { forumId } = t.fixtureCtx

  await t
    .useRole(pcRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forumId}`)
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
  const { forumId } = t.fixtureCtx

  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forumId}`)
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

test.skip('delete and restore an edit on the revisions page', async (t) => {
  const { reviewId } = t.fixtureCtx

  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/revisions?id=${reviewId}`)
    .expect(Selector('.references-list').exists)
    .ok()
    .expect(Selector('.references-list > div').count)
    .gte(3)
    .expect(Selector('.references-list > div').nth(0).find('.edit > h4').textContent)
    .contains('Official Review Edit of Submission1 by Reviewer')
    .click(Selector('.references-list > div').nth(0).find('.meta-actions > button').nth(1))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Delete'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.references-list > div').nth(0).find('.edit').hasClass('edit-trashed'))
    .ok()
    .click(Selector('.references-list > div').nth(0).find('.meta-actions > button').nth(0))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Restore'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.references-list > div').nth(0).find('.edit').hasClass('edit-trashed'))
    .notOk()
})
