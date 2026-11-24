import { render, screen } from '@testing-library/react'
import FilterTabs from '../components/forum/FilterTabs'
import { expandForumViews } from '../lib/forum-utils'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

const forumId = 'NeurIPS.cc/2026/Conference/Submission1'

describe('FilterTabs', () => {
  test('renders tab when expandedInvitations uses exact invitation id', () => {
    const forumViews = [
      {
        id: 'llm_interaction',
        label: 'LLM Interaction Chat',
        layout: 'chat',
        expandedInvitations: [
          'NeurIPS.cc/2026/Conference/Submission1/Reviewer_ABC123/-/LLM_Interaction',
        ],
      },
    ]
    const replyInvitations = [
      { id: 'NeurIPS.cc/2026/Conference/Submission1/Reviewer_ABC123/-/LLM_Interaction' },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={replyInvitations}
      />
    )

    expect(screen.getByText('LLM Interaction Chat')).toBeInTheDocument()
  })

  test('renders tab when expandedInvitations uses a regex pattern with .*', () => {
    const forumViews = [
      {
        id: 'llm_interaction',
        label: 'LLM Interaction Chat',
        layout: 'chat',
        expandedInvitations: [
          'NeurIPS.cc/2026/Conference/Submission1/Reviewer_.*/-/LLM_Interaction',
        ],
      },
    ]
    const replyInvitations = [
      { id: 'NeurIPS.cc/2026/Conference/Submission1/Reviewer_ABC123/-/LLM_Interaction' },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={replyInvitations}
      />
    )

    expect(screen.getByText('LLM Interaction Chat')).toBeInTheDocument()
  })

  test('hides tab when regex pattern does not match any reply invitation', () => {
    const forumViews = [
      {
        id: 'llm_interaction',
        label: 'LLM Interaction Chat',
        layout: 'chat',
        expandedInvitations: [
          'NeurIPS.cc/2026/Conference/Submission1/Reviewer_.*/-/LLM_Interaction',
        ],
      },
    ]
    const replyInvitations = [
      { id: 'NeurIPS.cc/2026/Conference/Submission1/Reviewer_ABC123/-/Official_Review' },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={replyInvitations}
      />
    )

    expect(screen.queryByText('LLM Interaction Chat')).not.toBeInTheDocument()
  })

  test('hides tab when the reply invitation id does not match the regex in expandedInvitations', () => {
    const forumViews = [
      {
        id: 'llm_interaction',
        label: 'LLM Interaction Chat',
        layout: 'chat',
        expandedInvitations: [
          'NeurIPS.cc/2026/Conference/Submission1/Reviewer_.*/-/LLM_Interaction',
        ],
      },
    ]
    const replyInvitations = [
      { id: 'NeurIPS.cc/2026/Conference/Submission2/Reviewer_ABC123/-/LLM_Interaction' },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={replyInvitations}
      />
    )

    expect(screen.queryByText('LLM Interaction Chat')).not.toBeInTheDocument()
  })

  test('hides tab when an exact invitation id is only a prefix of a reply invitation id', () => {
    const forumViews = [
      {
        id: 'chat-Chat_A',
        label: 'Chat (Chat A)',
        layout: 'chat',
        expandedInvitations: ['NeurIPS.cc/2026/Conference/Submission1/-/Chat_A'],
      },
    ]
    const replyInvitations = [{ id: 'NeurIPS.cc/2026/Conference/Submission1/-/Chat_AB' }]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={replyInvitations}
      />
    )

    expect(screen.queryByText('Chat (Chat A)')).not.toBeInTheDocument()
  })

  test('shows the new message count of a tab whose expandedInvitations is a regex pattern', () => {
    const chatPattern = 'NeurIPS.cc/2026/Conference/Submission1/Reviewer_.*/-/LLM_Interaction'
    const forumViews = [
      {
        id: 'llm_interaction',
        label: 'LLM Interaction Chat',
        layout: 'chat',
        expandedInvitations: [chatPattern],
      },
    ]
    const replyInvitations = [
      { id: 'NeurIPS.cc/2026/Conference/Submission1/Reviewer_ABC123/-/LLM_Interaction' },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{ [chatPattern]: 2 }}
        replyInvitations={replyInvitations}
      />
    )

    expect(screen.getByText('2')).toHaveClass('badge')
  })

  test('renders tab without expandedInvitations regardless of replyInvitations', () => {
    const forumViews = [
      {
        id: 'discussion',
        label: 'Discussion',
        layout: 'default',
      },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={[]}
      />
    )

    expect(screen.getByText('Discussion')).toBeInTheDocument()
  })

  test('renders a read-only tab without a reply invitation to post to', () => {
    const forumViews = [
      {
        id: 'reviewer_chat-Reviewer_ABC123',
        label: 'Reviewer AI Chat (Reviewer ABC123)',
        layout: 'chat',
        readOnly: true,
        expandedInvitations: [
          'NeurIPS.cc/2026/Conference/Submission1/Reviewer_ABC123/-/LLM_Interaction',
        ],
      },
    ]

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={[]}
      />
    )

    expect(screen.getByText('Reviewer AI Chat (Reviewer ABC123)')).toBeInTheDocument()
  })

  test('highlights the tab of a chat whose invitation id is percent-encoded in the url hash', () => {
    const pattern = 'NeurIPS.cc/2026/Conference/Submission1/-/Chat_.*'
    const forumViews = expandForumViews(
      [
        {
          id: 'chat',
          label: 'Chat',
          layout: 'chat',
          tabPerInvitation: true,
          filter: `invitations:${pattern}`,
          expandedInvitations: [pattern],
        },
      ],
      [],
      [{ id: 'note', invitations: ['NeurIPS.cc/2026/Conference/Submission1/-/Chat_提交'] }]
    )
    window.location.hash = 'chat-Chat_提交'

    render(
      <FilterTabs
        forumId={forumId}
        forumViews={forumViews}
        newMessageCounts={{}}
        replyInvitations={[]}
      />
    )

    expect(window.location.hash).toBe('#chat-Chat_%E6%8F%90%E4%BA%A4')
    expect(screen.getByText('Chat (Chat 提交)').closest('li')).toHaveClass('active')
    window.location.hash = ''
  })
})
