import fetch from 'node-fetch'
import { Selector, ClientFunction, Role } from 'testcafe'
import { registerFixture, before, after } from './utils/hooks'

registerFixture()

const titleLabel = Selector('.note_content_title a')
const authorLabel = Selector('.meta_row a')
const signaturesLabel = Selector('.signatures')
const abstractLabel = Selector('.note_content_value')
const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const container = Selector('.forum-container')
const content = Selector('#content')
const errorCodeLabel = Selector('#content h1')
const errorMessageLabel = Selector('.error-message')
const privateAuthorLabel = Selector('.private-author-label')

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
    .expect(container.exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(titleLabel.innerText).eql('test title')
    .expect(authorLabel.innerText).eql('test author')
    .expect(abstractLabel.innerText).eql('test abstract')
})

test('get a forbidden page for a nonreader', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[0]
  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(content.exists).ok()
    .expect(errorCodeLabel.innerText).eql('Error 403')
    .expect(errorMessageLabel.innerText).eql('You don\'t have permission to read this forum')

  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(titleLabel.innerText).eql('this is á "paper" title')
    .expect(authorLabel.innerText).eql('FirstA LastA')
    .expect(abstractLabel.innerText).eql('The abstract of test paper 1')
})

test('get a forbidden error for a guest user', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[0]
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(getPageUrl()).contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, '1234')
    .click(loginButton)
    .expect(Selector('#content').exists).ok()
    .expect(errorCodeLabel.innerText).eql('Error 403')
    .expect(errorMessageLabel.innerText).eql('You don\'t have permission to read this forum')
})

test('get a deleted forum and return an ok only for super user', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[1]
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(content.exists).ok()
    .expect(errorCodeLabel.innerText).eql('Error 404')
    .expect(errorMessageLabel.innerText).eql('Not Found')

  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(titleLabel.innerText).eql('this is á "paper" title')
    .expect(signaturesLabel.innerText).eql('[Deleted]')
})

test('get a non existent forum and return a not found', async (t) => {
  const forum = '12315sx'
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(content.exists).ok()
    .expect(errorCodeLabel.innerText).eql('Error 404')
    .expect(errorMessageLabel.innerText).eql('Not Found')
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
    .expect(container.exists).ok()
    .expect(Selector(`#note_${blindedNote}`).exists).ok()
    .expect(titleLabel.innerText).eql('ICLR submission title')
    .expect(signaturesLabel.innerText).eql('Anonymous')
    .expect(abstractLabel.innerText).eql('test iclr abstract abstract')
    .expect(privateAuthorLabel.exists).ok()
})

test('get original note as a guest user and redirect to the blinded note', async (t) => {
  const { data } = t.fixtureCtx
  const originalNote = data.iclr.forums[0]
  const blindedNote = data.iclr.forums[1]
  const getPageUrl = ClientFunction(() => window.location.href.toString())

  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${originalNote}`)
    .expect(getPageUrl()).contains(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`, { timeout: 10000 })
    .expect(container.exists).ok()
    .expect(Selector(`#note_${blindedNote}`).exists).ok()
    .expect(titleLabel.innerText).eql('ICLR submission title')
    .expect(signaturesLabel.innerText).eql('Anonymous')
    .expect(abstractLabel.innerText).eql('test iclr abstract abstract')
    .expect(privateAuthorLabel.exists).notOk()
})

test('get an forum page and see meta tags with conference title', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.iclr.forums[1]
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('title').innerText).eql('ICLR submission title | OpenReview')
    .expect(Selector('meta').withAttribute('name', 'citation_title').withAttribute('content', 'ICLR submission title').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_publication_date').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_online_date').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_pdf_url').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_conference_title').exists).ok()

  const htmlResponse = await fetch(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`, { method: 'GET' })
  await t.expect(htmlResponse.ok).eql(true)
  const text = await htmlResponse.text()
  await t.expect(text).contains('<meta name="citation_title" content="ICLR submission title"/>')
  await t.expect(text).contains('<meta name="citation_publication_date"')
  await t.expect(text).contains('<meta name="citation_online_date"')
  await t.expect(text).contains('<meta name="citation_pdf_url"')
  await t.expect(text).contains('<meta name="citation_conference_title" content="International Conference on Learning Representations"/>')
})

test('get forum page and see all available meta tags', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.anotherTestVenue.forums[0]
  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('title').innerText).eql('this is á "paper" title | OpenReview')
    .expect(Selector('meta').withAttribute('name', 'citation_title').withAttribute('content', 'this is á "paper" title').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_publication_date').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_online_date').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_pdf_url').exists).ok()
    .expect(Selector('meta').withAttribute('name', 'citation_conference_title').exists).notOk()

  const { superUserToken } = t.fixtureCtx
  const htmlResponse = await fetch(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`, { method: 'GET', headers: { cookie: `openreview.accessToken=${superUserToken}` } })
  await t.expect(htmlResponse.ok).eql(true)
  const text = await htmlResponse.text()
  await t.expect(text).contains('<meta name="citation_title" content="this is á &quot;paper&quot; title"/>')
  await t.expect(text).contains('<meta name="citation_publication_date"')
  await t.expect(text).contains('<meta name="citation_online_date"')
  await t.expect(text).contains('<meta name="citation_pdf_url"')
})
