import {
  checkExReadersMatch,
  expandForumViews,
  getUniqueInstitutions,
} from '../lib/forum-utils'

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

describe('expandForumViews', () => {
  const submission = 'NeurIPS.cc/2026/Conference/Submission1'
  const chatPattern = `${submission}/Reviewer_.*/-/LLM_Interaction`
  const chatView = {
    id: 'reviewer_chat',
    label: 'Reviewer AI Chat',
    filter: `invitations:${chatPattern}`,
    layout: 'chat',
    tabPerInvitation: true,
    expandedInvitations: [chatPattern],
  }
  const chatId = (anonId) => `${submission}/Reviewer_${anonId}/-/LLM_Interaction`
  const message = (anonId) => ({ id: `note_${anonId}`, invitations: [chatId(anonId)] })

  test('keep the view of a user who can post to a single matching invitation', () => {
    const views = expandForumViews([chatView], [{ id: chatId('ABC') }], [message('ABC')])
    expect(views).toEqual([chatView])
  })

  test('make one read-only tab per invitation of the replies the user can read', () => {
    const views = expandForumViews(
      [chatView],
      [{ id: `${submission}/-/Official_Comment` }],
      [
        message('XYZ'),
        message('ABC'),
        message('ABC'),
        { id: 'review', invitations: [`${submission}/-/Official_Review`] },
      ]
    )
    expect(views).toEqual([
      {
        ...chatView,
        id: 'reviewer_chat-Reviewer_ABC',
        label: 'Reviewer AI Chat (Reviewer ABC)',
        filter: `invitations:${chatId('ABC')}`,
        expandedInvitations: [chatId('ABC')],
        readOnly: true,
      },
      {
        ...chatView,
        id: 'reviewer_chat-Reviewer_XYZ',
        label: 'Reviewer AI Chat (Reviewer XYZ)',
        filter: `invitations:${chatId('XYZ')}`,
        expandedInvitations: [chatId('XYZ')],
        readOnly: true,
      },
    ])
  })

  test('make one tab per invitation the user can post to, without replies yet', () => {
    const views = expandForumViews(
      [chatView],
      [{ id: chatId('ABC') }, { id: chatId('XYZ') }],
      []
    )
    expect(views.map((view) => [view.id, view.readOnly])).toEqual([
      ['reviewer_chat-Reviewer_ABC', false],
      ['reviewer_chat-Reviewer_XYZ', false],
    ])
  })

  test('make no tab when the user can neither post to nor read a matching invitation', () => {
    expect(expandForumViews([chatView], [], [])).toEqual([])
  })

  test('keep the other filters of the view', () => {
    const view = {
      ...chatView,
      filter: `invitations:${chatPattern} -readers:${submission}/Authors`,
    }
    const [tab] = expandForumViews([view], [], [message('ABC')])
    expect(tab.filter).toBe(`invitations:${chatId('ABC')} -readers:${submission}/Authors`)
  })

  test('keep the views without tabPerInvitation', () => {
    const views = [
      { ...chatView, tabPerInvitation: undefined },
      { id: 'discussion', label: 'Discussion' },
    ]
    expect(expandForumViews(views, [], [message('ABC'), message('XYZ')])).toEqual(views)
    expect(expandForumViews(null, [], [])).toBe(null)
  })
})
