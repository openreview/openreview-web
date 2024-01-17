import { isInstitutionEmail, stringToObject } from '../lib/utils'

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

  test('valid institution email in isInstitutionEmail', () => {
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
})
