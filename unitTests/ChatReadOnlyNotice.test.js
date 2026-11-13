import { render, screen } from '@testing-library/react'
import ChatReadOnlyNotice from '../components/forum/ChatReadOnlyNotice'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

const invitationId = 'CVPR.cc/2027/Conference/Submission2/Reviewer_orCc/-/LLM_Interaction'

describe('ChatReadOnlyNotice', () => {
  test('show who can read the chat', () => {
    render(
      <ChatReadOnlyNotice
        invitationId={invitationId}
        readers={[
          'CVPR.cc/2027/Conference',
          'CVPR.cc/2027/Conference/Submission2/Senior_Area_Chairs',
          'CVPR.cc/2027/Conference/Submission2/Area_Chairs',
          'CVPR.cc/2027/Conference/AI_Review_Assistant',
          'CVPR.cc/2027/Conference/Submission2/Reviewer_orCc',
        ]}
      />
    )

    expect(
      screen.getByText('You do not have permission to post in this chat.')
    ).toBeInTheDocument()
    expect(screen.getByText(/LLM Interaction replies are only visible to/)).toHaveTextContent(
      'Submission2 Senior Area Chairs'
    )
    expect(screen.getByText(/LLM Interaction replies are only visible to/)).toHaveTextContent(
      'Submission2 Reviewer orCc'
    )
  })

  test('show only the permission notice when the readers are unknown', () => {
    render(<ChatReadOnlyNotice invitationId={invitationId} readers={null} />)

    expect(
      screen.getByText('You do not have permission to post in this chat.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/replies are only visible to/)).not.toBeInTheDocument()
  })
})
