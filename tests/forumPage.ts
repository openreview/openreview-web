import { Selector, ClientFunction, Role } from 'testcafe'
import { registerFixture, before, after } from './utils/hooks'

registerFixture()

const titleLabel = Selector('.note_content_title a')
const authorLabel = Selector('.meta_row a')
const abstractLabel = Selector('.note_content_value')
const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
})

const authorRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(emailInput, 'a@a.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
})

const superUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(emailInput, 'openreview.net')
    .typeText(passwordInput, '1234')
    .click(loginButton)
})

fixture`Forum page`
  .page`http://localhost:${process.env.NEXT_PORT}`
  .before(async ctx => before(ctx))
  .after(async ctx => after(ctx))

test('show a valid forum', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.testVenue.forums[0]
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('test title')
    .expect(Selector(authorLabel).innerText).eql('test author')
    .expect(Selector(abstractLabel).innerText).eql('test abstract')
})

test('get a forbidden page for a nonreader', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[0]
  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 403')
    .expect(Selector('.error-message').innerText).eql('You don\'t have permission to read this forum')

  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('this is á "paper" title')
    .expect(Selector(authorLabel).innerText).eql('FirstA LastA')
    .expect(Selector(abstractLabel).innerText).eql('The abstract of test paper 1')
})

test('get a deleted forum and return an ok only for super user', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[1]
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 404')
    .expect(Selector('.error-message').innerText).eql('Not Found')

  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('this is á "paper" title')
    .expect(Selector('.signatures').innerText).eql('[Deleted]')
})

test('get a non existent forum and return a not found', async (t) => {
  const forum = '12315sx'
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 404')
    .expect(Selector('.error-message').innerText).eql('Not Found')
})

test('get original note and redirect to the blinded note', async (t) => {
  const { data } = t.fixtureCtx
  const originalNote = data.iclr.forums[0]
  const blindedNote = data.iclr.forums[1]
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${originalNote}`)
    .expect(getPageUrl()).contains(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`, { timeout: 10000 })
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${blindedNote}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('ICLR submission title')
    .expect(Selector('.signatures').innerText).eql('Anonymous')
    .expect(Selector(abstractLabel).innerText).eql('test iclr abstract abstract')
    .expect(Selector('.private-author-label').exists).ok()
})

test('get original note as a guest user and redirect to the blinded note', async (t) => {
  const { data } = t.fixtureCtx
  const originalNote = data.iclr.forums[0]
  const blindedNote = data.iclr.forums[1]
  const getPageUrl = ClientFunction(() => window.location.href.toString())

  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${originalNote}`)
    .expect(getPageUrl()).contains(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`, { timeout: 10000 })
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${blindedNote}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('ICLR submission title')
    .expect(Selector('.signatures').innerText).eql('Anonymous')
    .expect(Selector(abstractLabel).innerText).eql('test iclr abstract abstract')
    .expect(Selector('.private-author-label').exists).notOk()
})

test('get blinded note as an author and see revealed data', async (t) => {
  const { data } = t.fixtureCtx
  const blindedNote = data.iclr.forums[1]
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`)
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${blindedNote}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('ICLR submission title')
    .expect(Selector('.signatures').innerText).eql('Anonymous')
    .expect(Selector(abstractLabel).innerText).eql('test iclr abstract abstract')
    .expect(Selector('.private-author-label').exists).ok()
    .click(Selector('a.note_content_pdf'))
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 404')
    .expect(Selector('.error-message').innerText).eql('Page not found')
})

test('get blinded note as a guest and do not see revealed data', async (t) => {
  const { data } = t.fixtureCtx
  const blindedNote = data.iclr.forums[1]
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`)
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${blindedNote}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('ICLR submission title')
    .expect(Selector('.signatures').innerText).eql('Anonymous')
    .expect(Selector(abstractLabel).innerText).eql('test iclr abstract abstract')
    .expect(Selector('.private-author-label').exists).notOk()
    .click(Selector('a.note_content_pdf'))
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 404')
    .expect(Selector('.error-message').innerText).eql('Page not found')
})

test.skip('get forum page and see all available meta tags', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[0]
  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('title').innerText).eql('this is á "paper" title | OpenReview')
    .expect(Selector('meta').withAttribute('name', 'citation_title').exists).ok()
})
