import { Selector, ClientFunction, Role } from 'testcafe'
import { registerFixture, before, after } from './utils/hooks'

registerFixture()

const titleLabel = Selector('.note_content_title a')
const authorLabel = Selector('.meta_row a')
const abstractLabel = Selector('.note_content_value')

const testUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), 'test@mail.com')
    .typeText(Selector('#password-input'), '1234')
    .click(Selector('button').withText('Login to OpenReview'))
})

const authorRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t.click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), 'a@a.com')
    .typeText(Selector('#password-input'), '1234')
    .click(Selector('button').withText('Login to OpenReview'))
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

test('get a forbidden page', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.iclr.forums[0]
  await t
    .useRole(testUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 403')
    .expect(Selector('.error-message').innerText).eql('You don\'t have permission to read this forum')
})

test('get a valid page', async (t) => {
  const { data } = t.fixtureCtx
  const forum = data.iclr.forums[0]
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .useRole(authorRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/forum?id=${forum}`)
    .expect(Selector('.forum-container').exists).ok()
    .expect(Selector(`#note_${forum}`).exists).ok()
    .expect(Selector(titleLabel).innerText).eql('ICLR submission title')
    .expect(Selector(authorLabel).innerText).eql('FirstA LastA')
    .expect(Selector(abstractLabel).innerText).eql('test iclr abstract abstract')
    .click(Selector('a.note_content_pdf'))
    .expect(getPageUrl()).contains(`http://localhost:3030/pdf?id=${forum}`, { timeout: 10000 })
    .expect(Selector('#content').exists).ok()
    .expect(Selector('#content h1').innerText).eql('Error 404')
    .expect(Selector('.error-message').innerText).eql('Page not found')
})
