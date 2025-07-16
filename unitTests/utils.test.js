import {
  getDefaultTimezone,
  getTagDispayText,
  isInstitutionEmail,
  parseNumberField,
  prettyInvitationId,
  stringToObject,
} from '../lib/utils'

describe('utils', () => {
  test('convert string to object in stringToObject', () => {
    let prefilledValues = {}
    expect(stringToObject(prefilledValues)).toEqual(undefined)

    prefilledValues = { 'edit.note.content.title': 'some prefilled title' }
    expect(stringToObject(prefilledValues)).toEqual({
      content: { title: { value: 'some prefilled title' } },
    })

    // query has duplicated key to pass array type
    prefilledValues = {
      'edit.note.content.reject_reason': [
        'Other',
        'Other',
        'Reviewer never submitted their review',
      ],
    }
    expect(stringToObject(prefilledValues)).toEqual({
      content: {
        reject_reason: { value: ['Other', 'Reviewer never submitted their review'] },
      },
    })

    // fill multiple fields
    prefilledValues = {
      'edit.note.content.title': 'some prefilled title',
      'edit.note.content.reject_reason': [
        'Other',
        'Other',
        'Reviewer never submitted their review',
      ],
      'edit.note.content.comment': 'some prefilled comment',
    }
    expect(stringToObject(prefilledValues)).toEqual({
      content: {
        title: { value: 'some prefilled title' },
        reject_reason: { value: ['Other', 'Reviewer never submitted their review'] },
        comment: { value: 'some prefilled comment' },
      },
    })
  })

  test('validate institution email in isInstitutionEmail', () => {
    const institutionDomains = ['umass.edu', 'cs.umass.edu']

    let validEmail = 'test@umass.edu'
    expect(isInstitutionEmail(validEmail, institutionDomains)).toEqual(true)

    validEmail = 'test@cs.umass.edu'
    expect(isInstitutionEmail(validEmail, institutionDomains)).toEqual(true)

    let validSubdomainEmail = 'test@test.umass.edu'
    expect(isInstitutionEmail(validSubdomainEmail, institutionDomains)).toEqual(true)

    validSubdomainEmail = 'test@a.long.sub.domain.cs.umass.edu'
    expect(isInstitutionEmail(validSubdomainEmail, institutionDomains)).toEqual(true)

    let invalidEmail = 'test@umass.com'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)

    invalidEmail = 'test@fakeumass.com'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)

    invalidEmail = 'test@fakeumass.edu'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)

    invalidEmail = 'test@cs.edu'
    expect(isInstitutionEmail(invalidEmail, institutionDomains)).toEqual(false)
  })

  test('return timezone label and value in getDefaultTimezone if there is a match', () => {
    // #region no offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 0,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT)')).toEqual(true)
    // #endregion

    // #region positive offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 60,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -1:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 120,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -2:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 180,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -3:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 210,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -3:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 240,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -4:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 270,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -4:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 300,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -5:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 360,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -6:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 420,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -7:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 480,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -8:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 540,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -9:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 600,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -10:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 660,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -11:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 720,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT -12:00)')).toEqual(true)
    // #endregion

    // #region negative offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -60,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +1:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -120,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +2:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -180,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +3:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -210,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +3:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -240,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +4:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -270,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +4:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -300,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +5:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -330,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +5:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -345,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +5:45)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -360,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +6:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -390,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +6:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -420,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +7:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -480,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +8:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -525,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +8:45)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -540,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +9:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -570,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +9:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -600,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +10:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -630,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +10:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -660,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +11:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -690,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +11:30)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -720,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +12:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -765,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +12:45)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -780,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +13:00)')).toEqual(true)

    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => -840,
    }))
    expect(getDefaultTimezone().label.startsWith('(GMT +14:00)')).toEqual(true)
    // #endregion

    // #region non-matching offset
    global.Date = jest.fn(() => ({
      getTimezoneOffset: () => 123,
    }))
    expect(getDefaultTimezone()).toEqual(null)
    // #endregion
  })

  test('return human readable invitation id in prettyInvitationId', () => {
    let invitationId = 'TestVenue/Conference/-/Submission'
    let expectedValue = 'Submission'

    expect(prettyInvitationId(invitationId)).toEqual(expectedValue)

    // do not remove token ending with digits
    invitationId = 'ICML.cc/2025/Conference/Reviewers/-/robust_affinity_Q75'
    expectedValue = 'robust affinity Q75'
    expect(prettyInvitationId(invitationId)).toEqual(expectedValue)

    // take last two tokens
    invitationId = 'TestVenue/Reviewers/-/~First_Last1/Responsibility/Acknowledgement'
    expectedValue = 'Responsibility Acknowledgement'
    expect(prettyInvitationId(invitationId)).toEqual(expectedValue)

    // pretty print tilde id
    invitationId = 'TestVenue/Paper1/-/~First_Last1_Volunteer_to_Review_Approval'
    expectedValue = 'First Last  Volunteer to Review Approval'
    expect(prettyInvitationId(invitationId)).toEqual(expectedValue)
  })

  test('return confidence number in parseNumberField', () => {
    let confidenceString = '1 - Not Confident: not confident at all'
    let expectedValue = 1

    expect(parseNumberField(confidenceString)).toEqual(expectedValue)

    confidenceString = '4 - High Confidence - Reviewer is Highly familiar with the topic' // no colon
    expectedValue = 4

    expect(parseNumberField(confidenceString)).toEqual(expectedValue)
  })

  test('return display text for label', () => {
    process.env.SUPER_USER = 'OpenReview.net'
    // not to show invitation group when it's same as signature
    let tag = {
      invitation: 'OpenReview.net/Support/-/Profile_Moderation_Label',
      label: 'spam user',
      profile: '~Test_User1',
      readers: ['OpenReview.net/Support'],
      signature: 'OpenReview.net/Support',
    }

    let expectedValue = 'OpenReview Support Profile Moderation Label spam user'
    expect(getTagDispayText(tag, false)).toEqual(expectedValue)

    // show profile id when the param is true (for page other than profile/moderation)
    tag = {
      invitation: 'OpenReview.net/Support/-/Profile_Moderation_Label',
      label: 'spam user',
      profile: '~Test_User1',
      readers: ['OpenReview.net/Support'],
      signature: 'OpenReview.net/Support',
    }

    expectedValue = 'OpenReview Support Profile Moderation Label Test User spam user'
    expect(getTagDispayText(tag, true)).toEqual(expectedValue)

    // show label for vouch invitation (show profile id false)
    tag = {
      invitation: 'OpenReview.net/Support/-/Vouch',
      label: 'vouch',
      profile: '~Test_User1',
      readers: ['OpenReview.net/Support'],
      signature: '~Mentor_User1',
    }

    expectedValue = 'Vouched by ~Mentor_User1'
    expect(getTagDispayText(tag, false)).toEqual(expectedValue)

    // show label for vouch invitation (show profile id true)
    tag = {
      invitation: 'OpenReview.net/Support/-/Vouch',
      label: 'vouch',
      profile: '~Test_User1',
      readers: ['OpenReview.net/Support'],
      signature: '~Mentor_User1',
    }

    expectedValue = '~Mentor_User1 vouch ~Test_User1'
    expect(getTagDispayText(tag, true)).toEqual(expectedValue)
  })
})
