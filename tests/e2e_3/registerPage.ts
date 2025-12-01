import { Selector, ClientFunction, RequestLogger } from 'testcafe'
import {
  inactiveUser,
  inActiveUserNoPassword,
  inActiveUserNoPasswordNoEmail,
  getToken,
  getMessages,
  superUserName,
  strongPassword,
} from '../utils/api-helper'


const fullNameInputSelector = Selector('#first-input')
const emailAddressInputSelector = Selector('input').withAttribute(
  'placeholder',
  'Email address'
)
const signupButtonSelector = Selector('button').withText('Sign Up')
const newPasswordInputSelector = Selector('input').withAttribute('placeholder', 'New password')
const confirmPasswordInputSelector = Selector('input').withAttribute(
  'placeholder',
  'Confirm new password'
)
const sendActivationLinkButtonSelector = Selector('button').withText('Send Activation Link')
const claimProfileButtonSelector = Selector('button').withText('Claim Profile')
const messageSelector = Selector('.rc-notification-notice-content').nth(-1)
const nextSectiomButtonSelector = Selector('button').withText('Next Section')
const errorMessageLabel = Selector('.error-message') // server rendered error message

fixture`Signup`.page`http://localhost:${process.env.NEXT_PORT}/signup`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('create new profile', async (t) => {
  await t
    .typeText(fullNameInputSelector, 'Melisa Bok')
    .expect(emailAddressInputSelector.exists)
    .notOk()
    .expect(
      Selector('label').withText(
        'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff, and may require two weeks processing time.'
      ).exists
    )
    .ok()
    .wait(500)
    .click(Selector('label.name-confirmation'))
    .typeText(emailAddressInputSelector, 'melisa@test.com')
    .expect(signupButtonSelector.hasAttribute('disabled'))
    .notOk('not enabled yet', { timeout: 5000 })
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .ok()
    .expect(confirmPasswordInputSelector.exists)
    .ok()
    .expect(
      Selector('span').withText(
        `test.com does not appear in our list of publishing institutions.`
      ).exists
    )
    .ok()
    // type another non institution email
    .selectText(emailAddressInputSelector)
    .pressKey('delete')
    .typeText(emailAddressInputSelector, 'non@institution.email')
    .click(signupButtonSelector)
    .expect(
      Selector('span').withText(
        `institution.email does not appear in our list of publishing institutions.`
      ).exists
    )
    .ok()
    // correct email to be institution email
    .selectText(emailAddressInputSelector)
    .pressKey('delete')
    .typeText(emailAddressInputSelector, 'validemail@umass.edu')
    .click(signupButtonSelector)
    .expect(Selector('div.activation-message-row').exists)
    .notOk() // no warning
    // change email to subdomain of institution email
    .selectText(emailAddressInputSelector)
    .pressKey('delete')
    .typeText(emailAddressInputSelector, 'validemail@test.umass.edu')
    .click(signupButtonSelector)
    .expect(Selector('div.activation-message-row').exists)
    .notOk() // no warning
    .selectText(emailAddressInputSelector)
    .pressKey('delete')
    .typeText(emailAddressInputSelector, 'melisa@test.com')
    .click(signupButtonSelector)
    .typeText(newPasswordInputSelector, strongPassword)
    .typeText(confirmPasswordInputSelector, strongPassword)
    .click(signupButtonSelector)
    .expect(Selector('.modal-title').withText('Confirm Full Name').exists)
    .ok()
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .ok()
    .click(Selector('#confirm-name-modal').find('input').withAttribute('type', 'checkbox'))
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .notOk({ timeout: 8000 })
    .click(Selector('#confirm-name-modal').find('.btn-primary'))
    .expect(Selector('h1').withText('Thank You for Signing Up').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText)
    .eql('melisa@test.com')

  const messages = await getMessages({ to: 'melisa@test.com' }, t.fixtureCtx.superUserToken)
  await t
    .expect(messages[0].content.text)
    .contains('http://localhost:3030/profile/activate?token=')
})

test('create another new profile', async (t) => {
  await t
    .typeText(fullNameInputSelector, 'Peter Pan')
    .expect(emailAddressInputSelector.exists)
    .notOk()
    .expect(
      Selector('label').withText(
        'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff, and may require two weeks processing time.'
      ).exists
    )
    .ok()
    .wait(500)
    .click(Selector('label.name-confirmation'))
    .typeText(emailAddressInputSelector, 'peter@test.com')
    .expect(signupButtonSelector.hasAttribute('disabled'))
    .notOk('not enabled yet', { timeout: 5000 })
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .ok()
    .expect(confirmPasswordInputSelector.exists)
    .ok()
    .expect(
      Selector('span').withText(
        `test.com does not appear in our list of publishing institutions.`
      ).exists
    )
    .ok()

    .typeText(newPasswordInputSelector, strongPassword)
    .typeText(confirmPasswordInputSelector, strongPassword)
    .click(signupButtonSelector)
    .expect(Selector('.modal-title').withText('Confirm Full Name').exists)
    .ok()
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .ok()
    .click(Selector('#confirm-name-modal').find('input').withAttribute('type', 'checkbox'))
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .notOk({ timeout: 8000 })
    .click(Selector('#confirm-name-modal').find('.btn-primary'))
    .expect(Selector('h1').withText('Thank You for Signing Up').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText)
    .eql('peter@test.com')

  const messages = await getMessages({ to: 'peter@test.com' }, t.fixtureCtx.superUserToken)
  await t
    .expect(messages[0].content.text)
    .contains('http://localhost:3030/profile/activate?token=')
})

test('create a new profile with an institutional email', async (t) => {
  await t
    .typeText(fullNameInputSelector, 'Kevin Malone')
    .expect(emailAddressInputSelector.exists)
    .notOk()
    .expect(
      Selector('label').withText(
        'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff, and may require two weeks processing time.'
      ).exists
    )
    .ok()
    .wait(500)
    .click(Selector('label.name-confirmation'))
    .typeText(emailAddressInputSelector, 'kevin@umass.edu')
    .expect(signupButtonSelector.hasAttribute('disabled'))
    .notOk('not enabled yet', { timeout: 5000 })
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .ok()
    .expect(confirmPasswordInputSelector.exists)
    .ok()

    .typeText(newPasswordInputSelector, strongPassword)
    .typeText(confirmPasswordInputSelector, strongPassword)
    .click(signupButtonSelector)
    .expect(Selector('.modal-title').withText('Confirm Full Name').exists)
    .ok()
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .ok()
    .click(Selector('#confirm-name-modal').find('input').withAttribute('type', 'checkbox'))
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .notOk({ timeout: 8000 })
    .click(Selector('#confirm-name-modal').find('.btn-primary'))
    .expect(Selector('h1').withText('Thank You for Signing Up').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText)
    .eql('kevin@umass.edu')

  const messages = await getMessages({ to: 'kevin@umass.edu' }, t.fixtureCtx.superUserToken)
  await t
    .expect(messages[0].content.text)
    .contains('http://localhost:3030/profile/activate?token=')
})

test('enter invalid name', async (t) => {
  await t
    .typeText(fullNameInputSelector, '1', { speed: 0.8 })
    .expect(messageSelector.innerText)
    .eql(
      'Error: The name 1 is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
    .typeText(fullNameInputSelector, 'abc', { replace: true })
    .expect(messageSelector.exists).notOk() // page calls clearMessage
    .typeText(fullNameInputSelector, 'abc `', { replace: true })
    .expect(messageSelector.innerText)
    .eql(
      'Error: The name Abc ` is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
    .click(Selector('.rc-notification-notice-close')) // close message
    .expect(messageSelector.exists).notOk()
})

test('enter valid name invalid email and change to valid email and register', async (t) => {
  const fullName = 'FirstNameaac LastNameaac' // must be new each test run
  const email = 'testemailaac@test.com' // must be new each test run
  await t
    .typeText(fullNameInputSelector, fullName) // must be new each test run
    .wait(500)
    .click(Selector('label.name-confirmation'))
    .typeText(emailAddressInputSelector, `${email}@test.com`)
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .notOk() // password input should not show when email is invalid
  await t
    .typeText(emailAddressInputSelector, email, { replace: true }) // enter a valid email
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .ok()
    .expect(confirmPasswordInputSelector.exists)
    .ok()
    .typeText(newPasswordInputSelector, strongPassword)
    .typeText(confirmPasswordInputSelector, strongPassword)
    .click(signupButtonSelector)
    .click(Selector('#confirm-name-modal').find('input').withAttribute('type', 'checkbox'))
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .notOk({ timeout: 8000 })
    .click(Selector('#confirm-name-modal').find('.btn-primary'))
    .expect(Selector('h1').withText('Thank You for Signing Up').exists)
    .ok()
    .expect(Selector('span').withAttribute('class', 'email').innerText)
    .eql(email)
})

fixture`Resend Activation link`.page`http://localhost:${process.env.NEXT_PORT}/login`.before(
  async (ctx) => {
    ctx.superUserToken = await getToken(superUserName, strongPassword)
    return ctx
  }
)

test('request a new activation link', async (t) => {
  await t
    .typeText(Selector('input').withAttribute('placeholder', 'Email'), 'melisa@test.com')
    .click(Selector('a').withText("Didn't receive email confirmation?"))
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email with the subject "OpenReview signup confirmation" has been sent to melisa@test.com. Please click the link in this email to confirm your email address and complete registration.'
    )
    .wait(1000)

  const messages = await getMessages(
    { to: 'melisa@test.com', subject: 'OpenReview signup confirmation' },
    t.fixtureCtx.superUserToken
  )
  await t
    .expect(messages[0].content.text)
    .contains('http://localhost:3030/profile/activate?token=')
    .expect(messages[1].content.text)
    .contains('http://localhost:3030/profile/activate?token=')
})

test('request a reset password with no active profile', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .typeText(Selector('input').withAttribute('placeholder', 'Email'), 'melisa@test.com')
    .click(Selector('a').withText('Forgot your password?'))
    .expect(getPageUrl())
    .contains('http://localhost:3030/reset', { timeout: 10000 })
})

// eslint-disable-next-line no-unused-expressions
fixture`Activate`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=melisa@test.com`

test('update profile', async (t) => {
  await t
    .click(nextSectiomButtonSelector)
    .click(nextSectiomButtonSelector)
    .expect(
      Selector('p').withText(
        'Your profile does not contain any company/institution email and it can take up to 2 weeks for your profile to be activated.'
      ).exists
    )
    .ok()
    // add alternate email while registering
    .click(Selector('span.glyphicon.glyphicon-plus-sign')) // add button
    .expect(Selector('div.container.emails').child('div.row').count)
    .eql(2)
    .typeText(
      Selector('div.container.emails').child('div.row').nth(1).find('input'),
      'melisa@umass.edu'
    )
    .click(Selector('div.container.emails').find('button.confirm-button'))
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email has been sent to melisa@umass.edu with confirmation instructions'
    )
    .wait(500)
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('Error: token must NOT have fewer than 1 characters')
    .typeText(Selector('input[placeholder="Enter Verification Token"]'), '000000')
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('melisa@umass.edu has been verified')
    // check if buttons disappeared
    .expect(Selector('button').withText('Verify').nth(0).exists)
    .notOk()
    .expect(Selector('button').withText('Confirm').nth(0).exists)
    .notOk()
    .expect(Selector('div').withText('(Confirmed)').nth(0).exists)
    .ok()
    .expect(Selector('button').withText('Make Preferred').nth(0).exists)
    .ok()
    .expect(
      Selector('p').withText(
        'Your profile does not contain any company/institution email and it can take up to 2 weeks for your profile to be activated.'
      ).exists
    )
    .notOk()

    .click(nextSectiomButtonSelector) // links
    .typeText(Selector('#homepage_url'), 'http://homepage.do', { paste: true })
    .click(nextSectiomButtonSelector) // history
    .click(Selector('input.position-dropdown__placeholder').nth(0))
    .wait(300)
    .pressKey('M S space s t u d e n t tab')
    .click(Selector('input.institution-dropdown__placeholder').nth(0))
    .click(Selector('div.institution-dropdown__option').nth(0))
    .pressKey('tab')
    // add mandatory region
    .click(Selector('input.region-dropdown__placeholder'))
    .click(Selector('div.country-dropdown__option').nth(3))

    .click(nextSectiomButtonSelector) // relation
    .click(nextSectiomButtonSelector) // last section expertise
    .expect(Selector('p').withText("last updated September 24, 2024").exists).ok()
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql('Your OpenReview profile has been successfully created')
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?id=~Melisa_Bok1`)
    .expect(Selector('h4.pronouns').nth(0).exists)
    .notOk()
})

const resetPasswordLogger = RequestLogger({ url: `${process.env.API_V2_URL}/resettable`, method: 'post' }, { logRequestBody: true })
fixture`Sign up`.page`http://localhost:${process.env.NEXT_PORT}/signup`.requestHooks(resetPasswordLogger)
test('reset password should have turnstile token', async (t) => {
  await t
    .typeText(fullNameInputSelector, "Melisa Bok")
    .wait(500)
    .click(Selector('label.name-confirmation'))
    .click(Selector('button').withText('Reset Password'))
    .expect(Selector('button').withText('Reset Password').hasAttribute('disabled')).ok()
    .typeText(Selector('input').withAttribute('placeholder', 'Full email for ****@test.com'), 'melisa@test.com')
    .expect(Selector('button').withText('Reset Password').hasAttribute('disabled')).notOk()
    .click(Selector('button').withText('Reset Password'))
  // token is passed to reset call
  await t.expect(resetPasswordLogger.contains((record) => record.request.body.includes('token'))).ok()
})

// eslint-disable-next-line no-unused-expressions
fixture`Activate`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=kevin@umass.edu`

test('register a profile with an institutional email', async (t) => {
  await t
    .click(nextSectiomButtonSelector)
    .click(nextSectiomButtonSelector)
    .expect(
      Selector('p').withText(
        'Your profile does not contain any company/institution email and it can take up to 2 weeks for your profile to be activated.'
      ).exists
    )
    .notOk()
    // add alternate email while registering
    .click(Selector('span.glyphicon.glyphicon-plus-sign')) // add button
    .expect(Selector('div.container.emails').child('div.row').count)
    .eql(2)
    .typeText(
      Selector('div.container.emails').child('div.row').nth(1).find('input'),
      'kevin@test.com'
    )
    .click(Selector('div.container.emails').find('button.confirm-button'))
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email has been sent to kevin@test.com with confirmation instructions'
    )
    .wait(500)
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('Error: token must NOT have fewer than 1 characters')
    .typeText(Selector('input[placeholder="Enter Verification Token"]'), '000000')
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('kevin@test.com has been verified')
    // check if buttons disappeared
    .expect(Selector('button').withText('Verify').nth(0).exists)
    .notOk()
    .expect(Selector('button').withText('Confirm').nth(0).exists)
    .notOk()
    .expect(Selector('div').withText('(Confirmed)').nth(0).exists)
    .ok()
    .expect(Selector('button').withText('Make Preferred').nth(0).exists)
    .ok()

    .click(nextSectiomButtonSelector) // links
    .typeText(Selector('#homepage_url'), 'http://kevinmalone.com', { paste: true })
    .click(nextSectiomButtonSelector) // history
    .click(Selector('input.position-dropdown__placeholder').nth(0))
    .wait(300)
    .pressKey('M S space s t u d e n t tab')
    .click(Selector('input.institution-dropdown__placeholder').nth(0))
    .click(Selector('div.institution-dropdown__option').nth(0))
    .pressKey('tab')
    // add mandatory region
    .click(Selector('input.region-dropdown__placeholder'))
    .click(Selector('div.country-dropdown__option').nth(3))

    .click(nextSectiomButtonSelector)
    .click(nextSectiomButtonSelector)
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql('Your OpenReview profile has been successfully created')
})

// eslint-disable-next-line no-unused-expressions
fixture`Activate with errors`

test('try to activate a profile with no token and get an error', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/activate`)
    .expect(errorMessageLabel.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql('Invalid profile activation link. Please check your email and try again.')
}).skipJsErrors()

test('try to activate a profile with empty token and get an error', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=`)
    .expect(errorMessageLabel.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql('Invalid profile activation link. Please check your email and try again.')
}).skipJsErrors()

test('try to activate a profile with invalid token and get an error', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=fhtbsk`)
    .expect(errorMessageLabel.exists)
    .ok()
    .expect(errorMessageLabel.innerText)
    .eql('Activation token is not valid')
}).skipJsErrors()

fixture`Reset password`.before(
  async (ctx) => {
    ctx.superUserToken = await getToken(superUserName, strongPassword)
    return ctx
  }
)

test('reset password of active profile', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/reset`)
    .wait(1000)
    .typeText(Selector('#email-input'), 'melisa@test.com')
    .expect(Selector('button').withText('Reset Password').hasAttribute('disabled')).notOk({ timeout: 5000 })
    .click(Selector('button').withText('Reset Password'))
    .expect(Selector('div').withAttribute('role', 'alert').exists)
    .ok()

  const messages = await getMessages(
    { to: 'melisa@test.com', subject: 'OpenReview Password Reset' },
    t.fixtureCtx.superUserToken
  )

  await t
    .expect(messages[0].content.text)
    .contains('http://localhost:3030/user/password?token=')
}).skipJsErrors()

fixture`Edit profile`.page`http://localhost:${process.env.NEXT_PORT}/login`.before(
  async (ctx) => {
    ctx.superUserToken = await getToken(superUserName, strongPassword)
    return ctx
  }
)

test('add alternate email', async (t) => {
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await t
    .typeText(Selector('#email-input'), 'melisa@test.com')
    .typeText(Selector('#password-input'), strongPassword)
    .wait(100)
    .click(Selector('button').withText('Login to OpenReview'))
    .expect(getPageUrl())
    .contains('http://localhost:3030', { timeout: 10000 })
    .expect(Selector('#user-menu').exists)
    .ok()
    .click(Selector('#user-menu'))
    .expect(Selector('ul').withAttribute('class', 'dropdown-menu').exists)
    .ok()
    .click(Selector('a').withText('Profile'))
    .click(Selector('a').withAttribute('href', '/profile/edit'))
    .click(Selector('div[step="2"]').find('div[role="button"]')) // go to email section
    .expect(Selector('h4').withText('Emails').exists)
    .ok()
    .click(Selector('section').find('.glyphicon-plus-sign')) // add button
    .expect(Selector('div.container.emails').child('div.row').count)
    .eql(3)
    .typeText(
      Selector('div.container.emails').child('div.row').nth(2).find('input'),
      'melisa@alternate.com'
    )
    .click(Selector('div.container.emails').find('button.confirm-button'))
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email has been sent to melisa@alternate.com with confirmation instructions'
    )
    // text box to enter code should be displayed
    .expect(Selector('button').withText('Verify').nth(0).visible)
    .ok()
    .expect(Selector('input[placeholder="Enter Verification Token"]').visible)
    .ok()
    .typeText(Selector('input[placeholder="Enter Verification Token"]'), '000000')
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('melisa@alternate.com has been verified')

  const messages = await getMessages(
    { to: 'melisa@alternate.com', subject: 'OpenReview Email Confirmation' },
    t.fixtureCtx.superUserToken
  )
  await t
    .expect(messages[0].content.text)
    .contains(
      'to confirm an alternate email address melisa@alternate.com. If you would like to confirm this email, please use the verification token mentioned below'
    )
})

// eslint-disable-next-line no-unused-expressions
fixture`Issue related tests`

test('#160 allow user to overwrite last/middle/first name to be lowercase', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/signup`)
    .click(fullNameInputSelector)
    .pressKey('f i r s t', { speed: 0.8 })
    .expect(fullNameInputSelector.value)
    .eql('First')
    .pressKey('left left left left left delete f tab')
    .expect(fullNameInputSelector.value)
    .eql('first')
})
