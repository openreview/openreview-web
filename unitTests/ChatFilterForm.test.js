import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatFilterForm from '../components/forum/ChatFilterForm'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

const reviewerChatId = 'CVPR.cc/2027/Conference/Submission2/Reviewer_orCc/-/LLM_Interaction'
const areaChairChatId = 'CVPR.cc/2027/Conference/Submission2/Area_Chair_8uU5/-/LLM_Interaction'

const replyNotes = [
  {
    id: 'question',
    invitations: [reviewerChatId],
    signatures: ['CVPR.cc/2027/Conference/Submission2/Reviewer_orCc'],
    readers: ['CVPR.cc/2027/Conference'],
    searchText: 'what are the main contributions',
  },
  {
    id: 'answer',
    invitations: [reviewerChatId],
    signatures: ['CVPR.cc/2027/Conference/AI_Review_Assistant'],
    readers: ['CVPR.cc/2027/Conference'],
    searchText: 'the main contributions are',
  },
  {
    id: 'area_chair_question',
    invitations: [areaChairChatId],
    signatures: ['CVPR.cc/2027/Conference/Submission2/Area_Chair_8uU5'],
    readers: ['CVPR.cc/2027/Conference'],
    searchText: 'which review should weigh the most',
  },
  {
    id: 'review',
    invitations: ['CVPR.cc/2027/Conference/Submission2/-/Official_Review'],
    signatures: ['CVPR.cc/2027/Conference/Submission2/Reviewer_Geuu'],
    readers: ['CVPR.cc/2027/Conference'],
    searchText: 'summary of the paper',
  },
]

const filterOptions = {
  invitations: replyNotes.map((note) => note.invitations[0]),
  signatures: replyNotes.map((note) => note.signatures[0]),
  readers: ['CVPR.cc/2027/Conference'],
}

const tabFilters = (invitations) => ({
  invitations,
  excludedInvitations: null,
  signatures: null,
  readers: null,
  excludedReaders: null,
  keywords: null,
})

const renderForm = (props) => {
  const filters = tabFilters([reviewerChatId])
  return render(
    <ChatFilterForm
      defaultFilters={filters}
      selectedFilters={filters}
      setSelectedFilters={jest.fn()}
      filterOptions={filterOptions}
      replyNotes={replyNotes}
      {...props}
    />
  )
}

describe('ChatFilterForm', () => {
  test('list as authors only the signatures of the messages of the tab', async () => {
    renderForm()

    await userEvent.click(screen.getByText('Filter by author...'))

    expect(screen.getByText('Reviewer orCc')).toBeInTheDocument()
    expect(screen.getByText('AI Review Assistant')).toBeInTheDocument()
    expect(screen.queryByText('Area Chair 8uU5')).not.toBeInTheDocument()
    expect(screen.queryByText('Reviewer Geuu')).not.toBeInTheDocument()
  })

  test('hide the message type filter when the tab shows a single invitation', () => {
    renderForm()

    expect(screen.queryByText('All Message Types')).not.toBeInTheDocument()
    expect(screen.queryByText('LLM Interaction')).not.toBeInTheDocument()
  })

  test('show the message type filter when the tab shows several invitations', () => {
    const filters = tabFilters([reviewerChatId, areaChairChatId])
    renderForm({ defaultFilters: filters, selectedFilters: filters })

    expect(screen.getByText('All Message Types')).toBeInTheDocument()
  })

  test('keep the tab active when the messages are filtered', async () => {
    const setSelectedFilters = jest.fn()
    render(
      <ul className="filter-tabs">
        <li className="active">Reviewer AI Chat (Reviewer orCc)</li>
      </ul>
    )
    renderForm({ setSelectedFilters })

    await userEvent.type(screen.getByPlaceholderText('Search keywords...'), 'main')

    expect(setSelectedFilters).toHaveBeenLastCalledWith(
      expect.objectContaining({ keywords: ['main'] })
    )
    expect(screen.getByText('Reviewer AI Chat (Reviewer orCc)')).toHaveClass('active')
  })

  test('show the keywords of the selected filters when another tab resets them', () => {
    const { rerender } = renderForm({
      selectedFilters: { ...tabFilters([reviewerChatId]), keywords: ['main'] },
    })
    expect(screen.getByPlaceholderText('Search keywords...')).toHaveValue('main')

    rerender(
      <ChatFilterForm
        defaultFilters={tabFilters([areaChairChatId])}
        selectedFilters={tabFilters([areaChairChatId])}
        setSelectedFilters={jest.fn()}
        filterOptions={filterOptions}
        replyNotes={replyNotes}
      />
    )

    expect(screen.getByPlaceholderText('Search keywords...')).toHaveValue('')
  })

  test('keep the keywords as typed while they filter the messages', async () => {
    const setSelectedFilters = jest.fn()
    const { rerender } = renderForm({ setSelectedFilters })

    await userEvent.type(screen.getByPlaceholderText('Search keywords...'), 'Main ')
    rerender(
      <ChatFilterForm
        defaultFilters={tabFilters([reviewerChatId])}
        selectedFilters={{ ...tabFilters([reviewerChatId]), keywords: ['main'] }}
        setSelectedFilters={setSelectedFilters}
        filterOptions={filterOptions}
        replyNotes={replyNotes}
      />
    )

    expect(screen.getByPlaceholderText('Search keywords...')).toHaveValue('Main ')
  })
})
