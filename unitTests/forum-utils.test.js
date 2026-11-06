import { checkExReadersMatch, getUniqueInstitutions } from '../lib/forum-utils'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('getUniqueInstitutions', () => {
  test('dedup author institutions by domain and drop institutions without domain', () => {
    const authors = [
      {
        fullname: 'Author One',
        institutions: [
          { domain: 'umass.edu', name: 'UMASS' },
          { name: 'No Domain Institution' },
        ],
      },
      {
        fullname: 'Author Two',
        institutions: [{ domain: 'umass.edu', name: 'UMass Amherst' }],
      },
      { fullname: 'Author Three', institutions: null },
    ]
    expect(getUniqueInstitutions(authors)).toEqual([{ domain: 'umass.edu', name: 'UMASS' }])
  })

  test('return empty list for missing or string authors', () => {
    expect(getUniqueInstitutions(undefined)).toEqual([])
    expect(getUniqueInstitutions(['First Last'])).toEqual([])
  })
})

describe('checkExReadersMatch', () => {
  test('match invitation ids against an excluded .* pattern', () => {
    const excludedInvitations = ['NeurIPS.cc/2026/Conference/Submission1/.*/-/LLM_Interaction']
    expect(
      checkExReadersMatch(excludedInvitations, [
        'NeurIPS.cc/2026/Conference/Submission1/Reviewer_abc1/-/LLM_Interaction',
      ])
    ).toBe(true)
    expect(
      checkExReadersMatch(excludedInvitations, [
        'NeurIPS.cc/2026/Conference/Submission1/Area_Chair_xyz2/-/LLM_Interaction',
      ])
    ).toBe(true)
    expect(
      checkExReadersMatch(excludedInvitations, [
        'NeurIPS.cc/2026/Conference/Submission1/-/Official_Comment',
      ])
    ).toBe(false)
  })

  test('match ids without .* exactly', () => {
    const excludedInvitations = ['NeurIPS.cc/2026/Conference/Submission1/-/Chat']
    expect(
      checkExReadersMatch(excludedInvitations, [
        'NeurIPS.cc/2026/Conference/Submission1/-/Chat',
      ])
    ).toBe(true)
    expect(
      checkExReadersMatch(excludedInvitations, [
        'NeurIPS.cc/2026/Conference/Submission1/-/Chat_Reaction',
      ])
    ).toBe(false)
  })
})
