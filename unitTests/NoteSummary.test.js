import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import NoteSummary from '../components/webfield/NoteSummary'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('NoteSummary', () => {
  test('show author status correctly', () => {
    const props = {
      isV2Note: true,
      note: {
        content: {
          authors: {
            value: ['Email Author', 'Active Author', 'Blocked Author', 'Inactive Author'],
          },
          authorids: {
            value: [
              'test@email.com',
              '~Active_Author1',
              '~Blocked_Author1',
              '~Inactive_Author1',
            ],
          },
        },
      },
      profileMap: {
        '~Active_Author1': { active: true },
        '~Inactive_Author1': { active: false },
      },
    }
    render(<NoteSummary {...props} />)

    expect(screen.getByText('Email Author').nextSibling).toHaveClass('glyphicon-question-sign')
    expect(screen.getByText('Email Author').nextSibling).toHaveAttribute(
      'title',
      'Profile status is unknown'
    )

    screen.debug()
    expect(screen.getByText('Active Author').nextSibling).toHaveClass('glyphicon-ok-sign')
    expect(screen.getByText('Active Author').nextSibling).toHaveAttribute(
      'title',
      'Profile is active'
    )

    expect(screen.getByText('Blocked Author').nextSibling).toHaveClass('glyphicon-minus-sign')
    expect(screen.getByText('Blocked Author').nextSibling).toHaveAttribute(
      'title',
      'Profile status is not available'
    )

    expect(screen.getByText('Inactive Author').nextSibling).toHaveClass(
      'glyphicon-remove-sign'
    )
    expect(screen.getByText('Inactive Author').nextSibling).toHaveAttribute(
      'title',
      'Profile is not yet activated'
    )
  })
})
