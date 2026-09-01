import dayjs from 'dayjs'
import { Selector, ClientFunction, RequestLogger, Role } from 'testcafe'
import {
  inactiveUser,
  inActiveUserNoPassword,
  inActiveUserNoPasswordNoEmail,
  institutionEmailUser,
  getToken,
  getMessages,
  createPasswordResetRequest,
  hasTaskUser,
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

const messageSelector = Selector('.ant-notification-notice-content').nth(-1)
const notificationSelector = Selector('.ant-notification-notice')
const notificationCloseButton = Selector('.ant-notification-notice-close')
const nextSectiomButtonSelector = Selector('button').withText('Next Section')
const errorMessageLabel = Selector('.error-message') // server rendered error message
const nameConfirmationLabel = Selector('label[for="name-confirmation"]')

const dobMonthSelect = Selector('.ant-select')
const dobDayInput = Selector('input[placeholder="DD"]')
const dobYearInput = Selector('input[placeholder="YYYY"]')
const dobMonthOption = (monthLabel: string) =>
  Selector('.ant-select-item-option').withAttribute('title', monthLabel)
const monthLabels = [
  'January (1)',
  'February (2)',
  'March (3)',
  'April (4)',
  'May (5)',
  'June (6)',
  'July (7)',
  'August (8)',
  'September (9)',
  'October (10)',
  'November (11)',
  'December (12)',
]

const enterDob = (t: TestController, month = 'January (1)', day = '11', year = '1990') =>
  t
    .click(dobMonthSelect)
    .click(dobMonthOption(month))
    .typeText(dobDayInput, day, { replace: true })
    .typeText(dobYearInput, year, { replace: true })

const clickAllNotificationCloseButtons = ClientFunction(() => {
  document
    .querySelectorAll<HTMLElement>('.ant-notification-notice-close')
    .forEach((closeButton) => closeButton.click())
})

const dismissNotifications = async (t: TestController) => {
  await clickAllNotificationCloseButtons()
  await t.expect(notificationSelector.exists).notOk()
}

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
        'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff.'
      ).exists
    )
    .ok()
    .wait(500)
    .click(nameConfirmationLabel)
    .expect(emailAddressInputSelector.exists)
    .notOk()

  const currentYear = dayjs().year()

  await t
    .click(dobMonthSelect)
    .click(dobMonthOption('January (1)'))
    .typeText(dobDayInput, '1', { replace: true })
    .typeText(dobYearInput, `${currentYear - 12}`, { replace: true })
    .expect(messageSelector.innerText)
    .eql('Error: OpenReview profiles require an age of 13 or over.')
    .expect(emailAddressInputSelector.exists)
    .notOk()
  await dismissNotifications(t)

  await t
    .typeText(dobYearInput, `${currentYear - 101}`, { replace: true })
    .expect(messageSelector.innerText)
    .eql('Error: Please enter a valid date of birth.')
    .expect(emailAddressInputSelector.exists)
    .notOk()
  await dismissNotifications(t)

  // signup only prompts when the message changes, and Feb 31 repeats the message above,
  // so assert the form stays hidden rather than the notification text
  await t
    .click(dobMonthSelect)
    .click(dobMonthOption('February (2)'))
    .typeText(dobDayInput, '31', { replace: true })
    .typeText(dobYearInput, '1990', { replace: true })
    .expect(emailAddressInputSelector.exists)
    .notOk()
  await dismissNotifications(t)

  const thirteenToday = dayjs().subtract(13, 'year')
  await t
    .click(dobMonthSelect)
    .click(dobMonthOption(monthLabels[thirteenToday.month()]))
    .typeText(dobDayInput, `${thirteenToday.date()}`, { replace: true })
    .typeText(dobYearInput, `${thirteenToday.year()}`, { replace: true })
    .expect(emailAddressInputSelector.exists)
    .ok()
  await dismissNotifications(t)

  await t
    .click(dobMonthSelect)
    .click(dobMonthOption('January (1)'))
    .typeText(dobDayInput, '11', { replace: true })
    .typeText(dobYearInput, '1990', { replace: true })
    .typeText(emailAddressInputSelector, 'melisa@test.com')
    .expect(signupButtonSelector.hasAttribute('disabled'))
    .notOk('not enabled yet', { timeout: 5000 })
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .ok()
    .expect(confirmPasswordInputSelector.exists)
    .ok()
    .expect(
      Selector('span').withText(/Your email address could not be automatically verified/)
        .exists
    )
    .ok()
    // type another non institution email
    .selectText(emailAddressInputSelector)
    .pressKey('delete')
    .typeText(emailAddressInputSelector, 'non@institution.email')
    .click(signupButtonSelector)
    .expect(
      Selector('span').withText(/Your email address could not be automatically verified/)
        .exists
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
        'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff.'
      ).exists
    )
    .ok()
    .wait(500)
    .click(nameConfirmationLabel)
  await enterDob(t, 'March (3)', '5', '1985')
  await t
    .typeText(emailAddressInputSelector, 'peter@test.com')
    .expect(signupButtonSelector.hasAttribute('disabled'))
    .notOk('not enabled yet', { timeout: 5000 })
    .click(signupButtonSelector)
    .expect(newPasswordInputSelector.exists)
    .ok()
    .expect(confirmPasswordInputSelector.exists)
    .ok()
    .expect(
      Selector('span').withText(/Your email address could not be automatically verified/)
        .exists
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
        'I confirm that this name is typed exactly as it would appear as an author in my publications. I understand that any future changes to my name will require moderation by the OpenReview.net Staff.'
      ).exists
    )
    .ok()
    .wait(500)
    .click(nameConfirmationLabel)
  await enterDob(t, 'July (7)', '20', '1992')
  await t
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

test('sign up with invalid name', async (t) => {
  await t.wait(100).typeText(fullNameInputSelector, '1').click(nameConfirmationLabel)
  await enterDob(t)
  await t
    .typeText(emailAddressInputSelector, 'testemailaaa@test.com')
    .click(signupButtonSelector)
    .typeText(newPasswordInputSelector, strongPassword)
    .typeText(confirmPasswordInputSelector, strongPassword)
    .click(signupButtonSelector)
    .click(Selector('#confirm-name-modal').find('input').withAttribute('type', 'checkbox'))
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .notOk({ timeout: 8000 })
    .click(Selector('#confirm-name-modal').find('.btn-primary'))
    .expect(messageSelector.innerText)
    .eql(
      'Error: The name 1 is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
})

test('sign up with another invalid name', async (t) => {
  await t.typeText(fullNameInputSelector, 'abc `', { speed: 0.8 }).click(nameConfirmationLabel)
  await enterDob(t)
  await t
    .typeText(emailAddressInputSelector, 'testemailaaa@test.com')
    .click(signupButtonSelector)
    .typeText(newPasswordInputSelector, strongPassword)
    .typeText(confirmPasswordInputSelector, strongPassword)
    .click(signupButtonSelector)
    .click(Selector('#confirm-name-modal').find('input').withAttribute('type', 'checkbox'))
    .expect(Selector('#confirm-name-modal').find('.btn-primary').hasAttribute('disabled'))
    .notOk({ timeout: 8000 })
    .click(Selector('#confirm-name-modal').find('.btn-primary'))
    .expect(messageSelector.innerText)
    .eql(
      'Error: The name Abc ` is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
})

test('enter valid name invalid email and change to valid email and register', async (t) => {
  const fullName = 'FirstNameaac LastNameaac' // must be new each test run
  const email = 'testemailaab@test.com' // must be new each test run
  await t
    .typeText(fullNameInputSelector, fullName) // must be new each test run
    .wait(500)
    .click(nameConfirmationLabel)
  await enterDob(t)
  await t
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

// oxlint-disable-next-line no-unused-expressions
fixture`Activate`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=melisa@test.com`

test('update profile', async (t) => {
  await t
    .click(nextSectiomButtonSelector)
    .click(nextSectiomButtonSelector)
    .expect(
      Selector('p').withText(/Your email address could not be automatically verified/).exists
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
      Selector('p').withText(/Your email address could not be automatically verified/).exists
    )
    .notOk()

    .click(nextSectiomButtonSelector) // links
    .typeText(Selector('#homepage_url'), 'http://homepage.do', { paste: true })
    .click(nextSectiomButtonSelector) // history
    .click(positionInputs.nth(0))
    .wait(300)
    .pressKey('M S space s t u d e n t tab')
    // the institution of the email of the profile must be in the history
    .click(historyDomainInputs.nth(0))
    .typeText(historyDomainInputs.nth(0), 'umass.edu')
    .click(visibleOptions.withExactText('umass.edu'))
    .pressKey('tab')
    // let the institution lookup commit before touching region, as it resets country/region
    .wait(300)
    // add mandatory region
    .click(regionInputs.nth(0))
    .click(visibleOptions.nth(3))

    .click(nextSectiomButtonSelector) // last section expertise
    .expect(Selector('p').withText('last updated September 24, 2024').exists)
    .ok()
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql('Your OpenReview profile has been successfully created')
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?id=~Melisa_Bok1`)
    .expect(Selector('h4.pronouns').nth(0).exists)
    .notOk()
})

// oxlint-disable-next-line no-unused-expressions
fixture`Activate`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=kevin@umass.edu`

test('register a profile with an institutional email', async (t) => {
  await t
    .click(nextSectiomButtonSelector) // personal
    .click(nextSectiomButtonSelector) // emails
    .expect(
      Selector('p').withText(/Your email address could not be automatically verified/).exists
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
    .eql('A confirmation email has been sent to kevin@test.com with confirmation instructions')
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
    .click(positionInputs.nth(0))
    .wait(300)
    .pressKey('M S space s t u d e n t tab')
    // the institution of the email of the profile must be in the history
    .click(historyDomainInputs.nth(0))
    .typeText(historyDomainInputs.nth(0), 'umass.edu')
    .click(visibleOptions.withExactText('umass.edu'))
    .pressKey('tab')
    // let the institution lookup commit before touching region, as it resets country/region
    .wait(300)
    // add mandatory region
    .click(regionInputs.nth(0))
    .click(visibleOptions.nth(3))

    .click(nextSectiomButtonSelector)
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql('Your OpenReview profile has been successfully created')
})

// the api requires the institution of an institutional email to be in the history
const institutionEmailDomain = 'umass.edu'
const otherInstitutionDomain = 'abc.com'
const otherInstitutionName = 'ABC Institution'

const institutionEmailUserRole = Role(
  `http://localhost:${process.env.NEXT_PORT}/login`,
  async (t) => {
    await t
      .typeText(Selector('#email-input'), institutionEmailUser.email)
      .typeText(Selector('#password-input'), institutionEmailUser.password)
      .click(Selector('button').withText('Login to OpenReview'))
  }
)
const positionInputs = Selector('div.history')
  .find('input')
  .withAttribute('aria-label', 'Position')
const regionInputs = Selector('div.history')
  .find('input')
  .withAttribute('aria-label', 'Institution Country/Region')
const visibleOptions = Selector('.ant-select-item-option').filterVisible()
const historyDomainInputs = Selector('div.history')
  .find('input')
  .withAttribute('aria-label', 'Institution Domain')
const historyNameInputs = Selector('div.history')
  .find('input')
  .withAttribute('aria-label', 'Institution Name')
const historyStartInputs = Selector('div.history')
  .find('input')
  .withAttribute('aria-label', 'start year')
const historyEndInputs = Selector('div.history')
  .find('input')
  .withAttribute('aria-label', 'end year')
const historySection = Selector('div.history')
const historySectionError = Selector('.ant-alert-error')
const historyRowErrors = Selector('div.history').find('.history__error')
const historyStep = Selector('.ant-steps-item').withText('History')

// oxlint-disable-next-line no-unused-expressions
fixture`Activate with an institution which is not the one of the email`
  .page`http://localhost:${process.env.NEXT_PORT}/profile/activate?token=${institutionEmailUser.email}`

test('register a profile with an institution which is not the one of the email', async (t) => {
  await t
    .click(nextSectiomButtonSelector) // personal
    .click(nextSectiomButtonSelector) // emails
    .click(nextSectiomButtonSelector) // links
    .typeText(Selector('#homepage_url'), 'http://test.com', { paste: true })
    .click(nextSectiomButtonSelector) // history
    .click(nextSectiomButtonSelector) // expertise
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(notificationSelector.exists)
    .notOk()
    // user is taken back to the first step with error
    .expect(historySection.exists)
    .ok()
    .expect(historyStep.hasClass('ant-steps-item-error'))
    .ok()
    .expect(historySectionError.innerText)
    .contains("Career & Education History can't be empty.")

    .click(positionInputs.nth(0))
    .wait(300)
    .pressKey('M S space s t u d e n t tab')
    // custom domains are committed on blur (tab), then the failed lookup clears the name
    .typeText(historyDomainInputs.nth(0), otherInstitutionDomain)
    .pressKey('tab')
    .wait(300)
    .typeText(historyDomainInputs.nth(1), otherInstitutionDomain)
    .pressKey('tab')
    .wait(300)
    .typeText(historyNameInputs.nth(1), otherInstitutionName)
    .typeText(historyStartInputs.nth(1), '2020', { paste: true })
    .typeText(historyEndInputs.nth(1), '2015', { paste: true })
    .click(nextSectiomButtonSelector) // expertise
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql('Error: There are errors in your Career & Education History.')
    .click(notificationCloseButton)
    .expect(notificationSelector.exists)
    .notOk()
    .expect(historySection.exists)
    .ok()
    .expect(historyRowErrors.count)
    .eql(2)
    .expect(historyRowErrors.nth(0).innerText)
    .contains('Institution name is required')
    .expect(historyRowErrors.nth(0).innerText)
    .contains('Country/Region is required for current positions')
    .expect(historyRowErrors.nth(1).innerText)
    .contains('Position is required')
    .expect(historyRowErrors.nth(1).innerText)
    .contains('End date should be higher than start date')
    // the empty history block is replaced by the per record errors
    .expect(historySectionError.exists)
    .notOk()

    // drop the second record and complete the first one
    .click(historyDomainInputs.nth(1).parent('div.row').find('[aria-label="remove history"]'))
    .typeText(historyNameInputs.nth(0), otherInstitutionName)
    // add mandatory region
    .click(regionInputs.nth(0))
    .click(visibleOptions.nth(3))

    .click(nextSectiomButtonSelector)
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql(
      `Error: The institution of your email ${institutionEmailUser.email} must be added to the history`
    )

    // the error notification is an 80vw banner fixed at the top of the viewport,
    // so it swallows the click on the History step; dismiss it first
    .click(notificationCloseButton)
    .expect(notificationSelector.exists)
    .notOk()

    // the profile is created once the institution of the email is in the history
    .click(Selector('.ant-steps-item').withText('History'))
    .click(historyDomainInputs.nth(0))
    .typeText(historyDomainInputs.nth(0), institutionEmailDomain, { replace: true })
    .click(visibleOptions.withExactText(institutionEmailDomain))
    .pressKey('tab')
    // let the institution lookup commit before touching region, as it resets country/region
    .wait(300)
    // add mandatory region again as selecting an institution resets country/region
    .click(regionInputs.nth(0))
    .click(visibleOptions.nth(3))
    .click(nextSectiomButtonSelector)
    .click(Selector('button').withText('Register for OpenReview'))
    .expect(messageSelector.innerText)
    .eql('Your OpenReview profile has been successfully created')
})

// oxlint-disable-next-line no-unused-expressions
fixture`Edit the history of the institution of the email`

test('replace the institution of the email in the history', async (t) => {
  await t
    .useRole(institutionEmailUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(Selector('.ant-steps-item').withText('History'))
    .expect(historyDomainInputs.count)
    .eql(1)
    .expect(historyDomainInputs.nth(0).value)
    .eql(institutionEmailDomain)
    // add the history of another institution
    .click(Selector('[aria-label="add another history"]'))
    .click(positionInputs.nth(1))
    .wait(300)
    .pressKey('M S space s t u d e n t tab')
    // custom domains are committed on blur (tab), then the failed lookup clears the name
    .typeText(historyDomainInputs.nth(1), otherInstitutionDomain)
    .pressKey('tab')
    .wait(300)
    .typeText(historyNameInputs.nth(1), otherInstitutionName)
    .click(regionInputs.nth(1))
    .click(visibleOptions.nth(3))
    // remove the history of the institution of the email
    .click(historyDomainInputs.nth(0).parent('div.row').find('[aria-label="remove history"]'))
    .expect(historyDomainInputs.count)
    .eql(1)
    .expect(historyDomainInputs.nth(0).value)
    .eql(otherInstitutionDomain)
    .click(Selector('button').withText('Save Profile Changes'))
    .expect(messageSelector.innerText)
    .eql(
      `Error: The institution of your email ${institutionEmailUser.email} must be added to the history`
    )
})

// oxlint-disable-next-line no-unused-expressions
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

fixture`Reset password`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
})

test('reset password of active profile', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/reset`)
    .wait(1000)
    .typeText(Selector('#email-input'), 'melisa@test.com')
    .expect(Selector('button').withText('Reset Password').hasAttribute('disabled'))
    .notOk({ timeout: 5000 })
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

test('complete password reset for logged-out user redirects to login with new-session message', async (t) => {
  const baseUrl = `http://localhost:${process.env.NEXT_PORT}`
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  await createPasswordResetRequest(hasTaskUser.email)

  await t
    .useRole(Role.anonymous())
    .navigateTo(`${baseUrl}/user/password?token=${hasTaskUser.email}`)
    .expect(Selector('input[type="checkbox"]').exists)
    .notOk()
    .typeText(Selector('input[type="password"]').nth(0), strongPassword, { replace: true })
    .typeText(Selector('input[type="password"]').nth(1), strongPassword, { replace: true })
    .click(Selector('button').withText('Reset Password'))
    .expect(messageSelector.innerText)
    .eql('Your password has been updated. Please log in with your new password to continue.')
    .expect(getPageUrl())
    .contains('/login', { timeout: 10000 })
})

test('logged-in password reset with checkbox unchecked leaves other sessions intact', async (t) => {
  const baseUrl = `http://localhost:${process.env.NEXT_PORT}`
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  const otherSession = Role(`${baseUrl}/login`, async (roleT) => {
    await roleT
      .typeText(Selector('#email-input'), hasTaskUser.email)
      .typeText(Selector('#password-input'), hasTaskUser.password)
      .click(Selector('button').withText('Login to OpenReview'))
  })
  const currentSession = Role(`${baseUrl}/login`, async (roleT) => {
    await roleT
      .typeText(Selector('#email-input'), hasTaskUser.email)
      .typeText(Selector('#password-input'), hasTaskUser.password)
      .click(Selector('button').withText('Login to OpenReview'))
  })

  await t
    .useRole(otherSession)
    .navigateTo(`${baseUrl}/profile`)
    .expect(Selector('#user-menu').filterVisible().exists)
    .ok()

  await createPasswordResetRequest(hasTaskUser.email)

  await t
    .useRole(currentSession)
    .navigateTo(`${baseUrl}/user/password?token=${hasTaskUser.email}`)
    .expect(Selector('input[type="checkbox"]').exists)
    .ok({ timeout: 15000 })
    .click(Selector('input[type="checkbox"]'))
    .typeText(Selector('input[type="password"]').nth(0), strongPassword, { replace: true })
    .typeText(Selector('input[type="password"]').nth(1), strongPassword, { replace: true })
    .click(Selector('button').withText('Reset Password'))
    .expect(messageSelector.innerText)
    .eql('Your password has been updated.')
    .expect(getPageUrl())
    .notContains('/login', { timeout: 10000 })

  await t
    .useRole(otherSession)
    .navigateTo(`${baseUrl}/profile`)
    .expect(getPageUrl())
    .notContains('/login')
    .expect(Selector('#user-menu').filterVisible().exists)
    .ok()
})

test('logged-in password reset with checkbox checked invalidates other sessions', async (t) => {
  const baseUrl = `http://localhost:${process.env.NEXT_PORT}`
  const getPageUrl = ClientFunction(() => window.location.href.toString())
  const otherSession = Role(`${baseUrl}/login`, async (roleT) => {
    await roleT
      .typeText(Selector('#email-input'), hasTaskUser.email)
      .typeText(Selector('#password-input'), hasTaskUser.password)
      .click(Selector('button').withText('Login to OpenReview'))
  })
  const currentSession = Role(`${baseUrl}/login`, async (roleT) => {
    await roleT
      .typeText(Selector('#email-input'), hasTaskUser.email)
      .typeText(Selector('#password-input'), hasTaskUser.password)
      .click(Selector('button').withText('Login to OpenReview'))
  })

  await t
    .useRole(otherSession)
    .navigateTo(`${baseUrl}/profile`)
    .expect(Selector('#user-menu').filterVisible().exists)
    .ok()

  await createPasswordResetRequest(hasTaskUser.email)

  await t
    .useRole(currentSession)
    .navigateTo(`${baseUrl}/user/password?token=${hasTaskUser.email}`)
    .expect(Selector('input[type="checkbox"]').exists)
    .ok({ timeout: 15000 })
    .typeText(Selector('input[type="password"]').nth(0), strongPassword, { replace: true })
    .typeText(Selector('input[type="password"]').nth(1), strongPassword, { replace: true })
    .click(Selector('button').withText('Reset Password'))
    .expect(messageSelector.innerText)
    .eql('Your password has been updated and all other sessions have been logged out.')
    .expect(getPageUrl())
    .notContains('/login', { timeout: 10000 })

  await t
    .useRole(otherSession)
    .navigateTo(`${baseUrl}/profile`)
    .expect(Selector('div').withText('Profile not found').exists)
    .ok({ timeout: 10000 })
})

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
    .expect(Selector('#user-menu').filterVisible().exists)
    .ok()
    .wait(100)
    .click(Selector('#user-menu').filterVisible())
    .expect(Selector('ul.ant-dropdown-menu').filterVisible().exists)
    .ok()
    .click(Selector('a').withText('Profile'))
    .click(Selector('a').withAttribute('href', '/profile/edit'))
    .click(Selector('.ant-steps-item').withText('Emails')) // go to email section
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

// oxlint-disable-next-line no-unused-expressions
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
