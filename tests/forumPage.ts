import fetch from 'node-fetch-cjs'
import { Selector, ClientFunction, Role } from 'testcafe'
import { getToken, getNotes, superUserName, strongPassword } from './utils/api-helper'

const titleLabel = Selector('.forum-title h2')
const authorLabel = Selector('.forum-authors span')
const signaturesLabel = Selector('.signatures')
const abstractLabel = Selector('.note-content-value p')
const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const container = Selector('.forum-container')
const content = Selector('#content')
const errorCodeLabel = Selector('#content h1')
const errorMessageLabel = Selector('.error-message')
const privateAuthorLabel = Selector('.private-author-label')

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

const superUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'openreview.net')
    .typeText(passwordInput, strongPassword)
    .click(loginButton)
})

fixture`Forum Page`.page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
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
    .eql('FirstA LastA')
    .expect(abstractLabel.innerText)
    .eql('Paper Abstract')
})

test('delete the note and restore it', async (t) => {
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
    .click(Selector('.invitation-buttons').find('button').withAttribute('type', 'button').nth(1))
    .expect(Selector('#confirm-delete-modal').exists)
    .ok()
    .click(Selector('.modal-footer').find('button').withText('Delete'))
    .expect(Selector('.invitation-buttons').find('button').withAttribute('type', 'button').withText('Restore').exists)
    .ok()
})



