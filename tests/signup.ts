import { Selector } from 'testcafe'

const firstNameInputSelector = Selector('#first-input')
const lastNameInputSelector = Selector('#last-input')
const emailAddressInputSelector = Selector('input').withAttribute('placeholder', 'Email address')
const signupButtonSelector = Selector('button').withText('Sign Up')
const passwordInputSelector = Selector('input').withAttribute('placeholder', 'Password')
const sendActivationLinkButtonSelector = Selector('button').withText('Send Activation Link')
const claimProfileButtonSelector = Selector('button').withText('Claim Profile')

fixture`new profile`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
test('enter invalid name', async t => {
  await t
    .typeText(firstNameInputSelector, 'abc')
    .typeText(lastNameInputSelector, '1')
    .expect(Selector('.important_message').exists).ok()
    .expect(Selector('.important_message').textContent).eql('Name is not allowed to contain digits')
})
test('enter valid name invalid email and change to valid email and register', async t => {
  const firstName = 'testFirstNameaac' //must be new each test run
  const lastName = 'testLastNameaac' //must be new each test run
  const email = 'testemailaac@test.com' //must be new each test run
  await t
    .typeText(firstNameInputSelector, firstName) //must be new each test run
    .typeText(lastNameInputSelector, lastName) //must be new each test run
    .typeText(emailAddressInputSelector, `${email}@test.com`)
    .click(signupButtonSelector)
    .expect(passwordInputSelector.exists).notOk() // password input should not show when email is invalid
  await t
    //enter a valid email
    .typeText(emailAddressInputSelector, email, { replace: true })
    .click(signupButtonSelector)
    .expect(passwordInputSelector.exists).ok()
    .typeText(passwordInputSelector, '1234')
    .click(signupButtonSelector)
    .expect(Selector('h1').withText('Thank You for Signing Up').exists).ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText).eql(email)
})

fixture`Send Activation Link`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
test('Send Activation Link', async t => {
  const firstName = 'testFirstNameaaa' //must be existing inactivate acct
  const lastName = 'testLastNameaaa'
  const email = 'testemailaaa@test.com'
  await t
    .typeText(firstNameInputSelector, firstName.toLowerCase())
    .typeText(lastNameInputSelector, lastName.toLowerCase())
  const existingTildeId = await Selector('.new-username.hint').nth(0).innerText
  const newTildeId = await Selector('.new-username.hint').nth(1).innerText
  await t
    .expect(newTildeId.substring(2)).notEql(existingTildeId.substring(3,)) // new sign up shoud have different tildeid
    .expect(sendActivationLinkButtonSelector.exists).ok() // existing acct so should find associated email
    .click(sendActivationLinkButtonSelector)
    .typeText(Selector('.password-row').find('input'), `${email}abc`) // type wrong email should not trigger email sending
    .click(sendActivationLinkButtonSelector)
  await t
    .selectText(Selector('.password-row').find('input'))
    .pressKey('delete')
    .typeText(Selector('.password-row').find('input'), email)
    .click(sendActivationLinkButtonSelector)
    .expect(Selector('h1').withText('Thank You for Signing Up').exists).ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText).eql(email)
})

fixture`Claim Profile`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
test('enter invalid name', async t => {
  const firstName = 'Andrew' //no email no password not active
  const lastName = 'Naish'
  await t
    .typeText(firstNameInputSelector, firstName)
    .typeText(lastNameInputSelector, lastName)
    .expect(Selector('.submissions-list').find('.note').count).lte(3) // at most 3 recent publications
    .expect(claimProfileButtonSelector.exists).ok()
    .expect(claimProfileButtonSelector.hasAttribute('disabled')).ok()
    .expect(signupButtonSelector.exists).ok()
    .expect(signupButtonSelector.hasAttribute('disabled')).ok()
})

fixture`Sign up`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
test('email address should be masked', async t => {
  const firstName = 'Evan' //has email no password not active
  const lastName = 'Sparks'
  const email = 'testemailaaa@test.com'
  await t
    .typeText(firstNameInputSelector, firstName)
    .typeText(lastNameInputSelector, lastName)
    .expect(Selector('input').withAttribute('type','email').nth(0).value).contains('****') //email should be masked
})

fixture`Reset Password·`
  .page`http://localhost:${process.env.NEXT_PORT}/signup`
test('email address should be masked', async t => {
  const firstName = 'Evan' //has email no password not active
  const lastName = 'Sparks'
  const email = 'testemailaaa@test.com'
  await t
    .typeText(firstNameInputSelector, firstName)
    .typeText(lastNameInputSelector, lastName)
    .expect(Selector('input').withAttribute('type','email').nth(0).value).contains('****') //email should be masked
})
