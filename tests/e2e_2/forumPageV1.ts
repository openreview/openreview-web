import fetch from 'node-fetch-cjs'
import { Selector, ClientFunction, Role } from 'testcafe'
import { getToken, getNotes, superUserName, strongPassword } from '../utils/api-helper'

const titleLabel = Selector('.note_content_title span')
const authorLabel = Selector('.meta_row a')
const signaturesLabel = Selector('.signatures')
const abstractLabel = Selector('.note_content_value')
const emailInput = Selector('#email-input')
const passwordInput = Selector('#password-input')
const loginButton = Selector('button').withText('Login to OpenReview')
const container = Selector('.forum-container')
const content = Selector('#content')
const errorMessageLabel = Selector('.error-message')
const privateAuthorLabel = Selector('.private-author-label')

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
})

const authorRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'a@a.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
})

const superUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(emailInput, 'openreview.net')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
})

fixture`Forum page v1`.page`http://localhost:${process.env.NEXT_PORT}`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('show a valid forum', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'TestVenue/2020/Conference/-/Submission' },
    superUserToken
  )
  const forum = notes[0].id
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists)
    .ok()
    .expect(Selector(`#note_${forum}`).exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('test title')
    .expect(authorLabel.innerText)
    .eql('FirstA LastA')
    .expect(abstractLabel.innerText)
    .eql('test abstract')
})

test('get a forbidden page for a nonreader', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'AnotherTestVenue/2020/Conference/-/Submission' },
    superUserToken
  )
  const forum = notes[0].id
  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(content.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql("You don't have permission to read this forum")

  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists)
    .ok()
    .expect(Selector(`#note_${forum}`).exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('this is á "paper" title')
    .expect(authorLabel.innerText)
    .eql('FirstA LastA')
    .expect(abstractLabel.innerText)
    .eql('The abstract of test paper 1')
})

test('get a forbidden error for a guest user', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'AnotherTestVenue/2020/Conference/-/Submission' },
    superUserToken
  )
  const forum = notes[0].id
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/login`, { timeout: 10000 })
    .typeText(emailInput, 'test@mail.com')
    .typeText(passwordInput, strongPassword)
    .wait(100)
    .click(loginButton)
    .expect(Selector('#content').exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql("You don't have permission to read this forum")
})

test('get a deleted forum and return an ok only for writers of the note', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    {
      invitation: 'AnotherTestVenue/2020/Conference/-/Submission',
      trash: true,
      sort: 'number:desc',
    },
    superUserToken
  )
  const forum = notes[0].id
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(content.exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('this is á "paper" title')
    .expect(signaturesLabel.innerText)
    .eql('[Deleted]')

  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(container.exists)
    .ok()
    .expect(Selector(`#note_${forum}`).exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('this is á "paper" title')
    .expect(signaturesLabel.innerText)
    .eql('[Deleted]')
})

test('get a non existent forum and return a not found', async (t) => {
  const forum = '12315sx'
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(content.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql('The Note 12315sx was not found')
})

test('get original note and redirect to the blinded note', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'ICLR.cc/2021/Conference/-/Blind_Submission' },
    superUserToken
  )
  const originalNote = notes[0].original
  const blindedNote = notes[0].id
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${originalNote}`)
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`, {
      timeout: 10000,
    })
    .expect(container.exists)
    .ok()
    .expect(Selector(`#note_${blindedNote}`).exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('ICLR submission title')
    .expect(signaturesLabel.innerText)
    .eql('Anonymous')
    .expect(abstractLabel.innerText)
    .eql('test iclr abstract abstract')
    .expect(privateAuthorLabel.exists)
    .ok()
})

test('get original note as a guest user and redirect to the blinded note', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'ICLR.cc/2021/Conference/-/Blind_Submission' },
    superUserToken
  )
  const originalNote = notes[0].original
  const blindedNote = notes[0].id
  const getPageUrl = ClientFunction(() => window.location.href.toString())

  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${originalNote}`)
    .expect(getPageUrl())
    .contains(`http://localhost:${process.env.NEXT_PORT}/forum?id=${blindedNote}`, {
      timeout: 10000,
    })
    .expect(container.exists)
    .ok()
    .expect(Selector(`#note_${blindedNote}`).exists)
    .ok()
    .expect(titleLabel.innerText)
    .eql('ICLR submission title')
    .expect(signaturesLabel.innerText)
    .eql('Anonymous')
    .expect(abstractLabel.innerText)
    .eql('test iclr abstract abstract')
    .expect(privateAuthorLabel.exists)
    .notOk()
})

test('get a forum page and see meta tags with conference title', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'ICLR.cc/2021/Conference/-/Blind_Submission' },
    superUserToken
  )
  const forum = notes[0].id
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('title').innerText)
    .eql('ICLR submission title | OpenReview')
    .expect(
      Selector('meta')
        .withAttribute('name', 'citation_title')
        .withAttribute('content', 'ICLR submission title').exists
    )
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_online_date').exists)
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_publication_date').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_pdf_url').exists)
    .notOk() // pdf is hidden
    .expect(Selector('meta').withAttribute('name', 'citation_conference_title').exists)
    .ok()
    .expect(
      Selector('meta')
        .withAttribute('name', 'citation_author')
        .withAttribute('content', 'Anonymous').exists
    )
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_author').count)
    .eql(1)
    .expect(Selector('meta').withAttribute('name', 'citation_authors').count)
    .eql(0)
    .expect(
      Selector('meta')
        .withAttribute('name', 'citation_abstract')
        .withAttribute('content', 'test iclr abstract abstract').exists
    )
    .ok()

  const htmlResponse = await fetch(
    `http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`,
    { method: 'GET' }
  )
  await t.expect(htmlResponse.ok).eql(true)
  const text = await htmlResponse.text()
  await t
    .expect(text)
    .contains('<meta name="citation_title" content="ICLR submission title"/>')
  await t.expect(text).contains('<meta name="citation_online_date"')
  await t.expect(text).contains('<meta name="citation_author" content="Anonymous"/>')
  await t.expect(text).contains('<meta name="citation_abstract" content="test iclr abstract abstract"/>')
  await t.expect(text).notContains('<meta name="citation_pdf_url"')
  await t.expect(text).notContains('<meta name="citation_publication_date"')
  await t.expect(text).notContains('<h3 class="citation_author">Anonymous</h3')
})

test('get forum page and see all available meta tags', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'AnotherTestVenue/2020/Conference/-/Submission' },
    superUserToken
  )
  const forum = notes[0].id
  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('title').innerText)
    .eql('this is á "paper" title | OpenReview')
    .expect(
      Selector('meta')
        .withAttribute('name', 'citation_title')
        .withAttribute('content', 'this is á "paper" title').exists
    )
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_online_date').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_publication_date').exists)
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_pdf_url').exists)
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_conference_title').exists)
    .notOk()
    .expect(
      Selector('meta')
        .withAttribute('name', 'citation_author')
        .withAttribute('content', 'FirstA LastA').exists
    )
    .ok()
    .expect(Selector('meta').withAttribute('name', 'citation_author').count)
    .eql(2)
    .expect(Selector('meta').withAttribute('name', 'citation_authors').count)
    .eql(0)
    .expect(
      Selector('meta')
        .withAttribute('name', 'citation_abstract')
        .withAttribute('content', 'The abstract of test paper 1').exists
    )
    .ok()

  const htmlResponse = await fetch(
    `http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`,
    { method: 'GET', headers: { cookie: `openreview.accessToken=${superUserToken}` } }
  )
  await t.expect(htmlResponse.ok).eql(true)
  const text = await htmlResponse.text()
  await t
    .expect(text)
    .contains('<meta name="citation_title" content="this is á &quot;paper&quot; title"/>')
  await t.expect(text).contains('<meta name="citation_publication_date"')
  await t.expect(text).contains('<meta name="citation_pdf_url"')
  await t.expect(text).contains('<meta name="citation_author" content="FirstA LastA"/>')
  await t.expect(text).contains('<meta name="citation_author" content="Melisa Bok"/>')
  await t.expect(text).contains('<meta name="citation_abstract" content="The abstract of test paper 1"/>')
  await t.expect(text).notContains('<meta name="citation_online_date"')
  await t.expect(text).notContains('<h3 class="citation_author">FirstA LastA, Melisa Bok</h3>')
})

test('#139 no id param should show an error message', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum`)
    .expect(Selector('Header').innerText)
    .eql('Error')
    .expect(Selector('.error-message').innerText)
    .eql('Forum or note ID is required')
  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum`)
    .expect(Selector('Header').innerText)
    .eql('Error')
    .expect(Selector('.error-message').innerText)
    .eql('Forum or note ID is required')
})

test('get forum page from a request venue form and do not render any meta tag', async (t) => {
  const { superUserToken } = t.fixtureCtx
  const notes = await getNotes(
    { invitation: 'openreview.net/Support/-/Request_Form', sort: 'cdate' },
    superUserToken
  )
  const forum = notes[1].id
  await t
    .useRole(superUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('title').innerText)
    .eql('ICLR 2021 Conference | OpenReview')
    .expect(Selector('meta').withAttribute('name', 'citation_title').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_publication_date').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_online_date').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_pdf_url').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_conference_title').exists)
    .notOk()
    .expect(Selector('meta').withAttribute('name', 'citation_authors').exists)
    .notOk()

  const htmlResponse = await fetch(
    `http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`,
    { method: 'GET', headers: { cookie: `openreview.accessToken=${superUserToken}` } }
  )
  await t.expect(htmlResponse.ok).eql(true)
  const text = await htmlResponse.text()
  await t.expect(text).notContains('<meta name="citation_title"')
  await t.expect(text).notContains('<meta name="citation_publication_date"')
  await t.expect(text).notContains('<meta name="citation_online_date"')
  await t.expect(text).notContains('<meta name="citation_pdf_url"')
  await t.expect(text).notContains('<meta name="citation_authors"')
  await t.expect(text).notContains('<h3 class="citation_author">')
})
