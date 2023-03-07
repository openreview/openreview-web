import ProfileListWithBidWidget from '../components/ProfileListWithBidWidget'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

describe('ProfileListWithBidWidget', () => {
  test('show empty message if there are no profiles', () => {
    const props = {
      profiles: [],
      emptyMessage: 'some empty message',
    }
    render(<ProfileListWithBidWidget {...props} />)
    expect(screen.getByText('some empty message'))
  })

  test('show profile name,history,expertise,bid button and score', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ first: 'first1', last: 'last1', username: '~first_last1' }],
            history: [
              {
                position: 'student',
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
            ],
            expertise: [
              { keywords: ['nlp', 'machine learning'] },
              { keywords: ['deep learning'] },
            ],
          },
        },
      ],
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
      scoreEdges: [{ head: '~first_last1', weight: 0.123 }],
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.getByText('first1 last1')).toHaveAttribute(
      'href',
      '/profile?id=~first_last1'
    )
    expect(screen.getByText('student at umass amherst (umass.edu)'))
    expect(screen.getByText('Expertise:').parentElement.textContent).toBe(
      'Expertise: nlp, machine learning, deep learning'
    )
    expect(screen.getAllByRole('radio').length).toEqual(5)
    expect(screen.getByText('0.123'))
  })

  test('show bid options as checked if bid edge exists', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ first: 'first1', last: 'last1', username: '~first_last1' }],
            history: [
              {
                position: 'student',
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
            ],
            expertise: [
              { keywords: ['nlp', 'machine learning'] },
              { keywords: ['deep learning'] },
            ],
          },
        },
      ],
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
      scoreEdges: [{ head: '~first_last1', weight: 0.123 }],
    }

    render(<ProfileListWithBidWidget {...props} />)
  })
})
