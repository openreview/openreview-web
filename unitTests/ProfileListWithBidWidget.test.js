import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileListWithBidWidget from '../components/ProfileListWithBidWidget'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('ProfileListWithBidWidget', () => {
  test('show only empty message if there are no profiles', () => {
    const props = {
      profiles: [],
      emptyMessage: 'some empty message',
    }
    render(<ProfileListWithBidWidget {...props} />)
    expect(screen.getByText('some empty message')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  test('show profile name, history, expertise, bid button and score', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ fullname: 'first last1', username: '~first_last1' }],
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

    expect(screen.getByText('first last1')).toHaveAttribute('href', '/profile?id=~first_last1')
    expect(screen.getByText('student at umass amherst (umass.edu)')).toBeInTheDocument()
    expect(screen.getByText('Expertise:').parentElement.textContent).toBe(
      'Expertise: nlp, machine learning, deep learning'
    )
    expect(screen.getAllByRole('radio').length).toEqual(5)
    expect(screen.getByText('0.123')).toBeInTheDocument()
  })

  test('show preferred name in profile', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [
              { fullname: 'first last', username: '~first_last1' },
              { fullname: 'second name', username: '~second_name1', preferred: true },
            ],
          },
        },
      ],
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.getByText('second name')).toBeInTheDocument()
    expect(screen.queryByText('first last')).not.toBeInTheDocument()
  })

  test('show only institution if profile history has no position', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ fullname: 'first last1', username: '~first_last1' }],
            history: [
              {
                position: undefined,
                start: 1999,
                end: 2000,
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
            ],
          },
        },
      ],
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.queryByText('umass amherst (umass.edu)')).toBeInTheDocument()
  })

  test('show latest history of a profile', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ fullname: 'first1 last1', username: '~first_last1' }],
            history: [
              {
                position: 'student',
                start: 1999,
                end: 2000,
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
              {
                position: 'engineer',
                start: 1999,
                end: 2001, // greatest end
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
            ],
          },
        },
        {
          id: '~first_last2',
          content: {
            names: [{ fullname: 'first2 last2', username: '~first_last2' }],
            history: [
              {
                position: 'phd',
                start: 2010,
                end: 2011,
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
              {
                position: 'professor',
                start: 2010,
                end: undefined, // till present
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
            ],
          },
        },
        {
          id: '~first_last3',
          content: {
            names: [{ fullname: 'first3 last3', username: '~first_last3' }],
            history: [
              {
                position: 'waiter',
                start: 2010,
                end: 2011,
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
              {
                position: 'cook',
                start: 2010,
                end: undefined, // first of tillpresent
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
              {
                position: 'chef',
                start: 2010,
                end: undefined,
                institution: {
                  domain: 'umass.edu',
                  name: 'umass amherst',
                },
              },
            ],
          },
        },
      ],
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.getByText('engineer at umass amherst (umass.edu)')).toBeInTheDocument()
    expect(screen.getByText('professor at umass amherst (umass.edu)')).toBeInTheDocument()
    expect(screen.getByText('cook at umass amherst (umass.edu)')).toBeInTheDocument()
    expect(screen.queryByText('student', { exact: false })).not.toBeInTheDocument()
    expect(screen.queryByText('phd', { exact: false })).not.toBeInTheDocument()
    expect(screen.queryByText('waiter', { exact: false })).not.toBeInTheDocument()
    expect(screen.queryByText('chef', { exact: false })).not.toBeInTheDocument()
  })

  test('show bid options as checked if bid edge exists', () => {
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ fullname: 'first1 last1', username: '~first_last1' }],
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
      bidEdges: [{ head: '~first_last1', label: 'Low' }],
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.getByText('Low')).toHaveClass('active')
    expect(screen.getByText('Very High')).not.toHaveClass('active')
    expect(screen.getByText('High')).not.toHaveClass('active')
    expect(screen.getByText('Neutral')).not.toHaveClass('active')
    expect(screen.getByText('Very Low')).not.toHaveClass('active')
  })

  test('show multiple profiles', () => {
    const profiles = Array.from(new Array(5), (_, index) => ({
      id: `~first_last${index}`,
      content: {
        names: [{ fullname: `first${index} last${index}`, username: `~first_last${index}` }],
        history: [
          {
            position: 'student',
            institution: {
              domain: 'umass.edu',
              name: 'umass amherst',
            },
          },
        ],
      },
    }))
    const props = {
      profiles,
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.getAllByRole('link').length).toEqual(5)
  })

  test('show multiple profiles as virtual list if specified', () => {
    const profiles = Array.from(new Array(5), (_, index) => ({
      id: `~first_last${index}`,
      content: {
        names: [{ fullname: `first${index} last${index}`, username: `~first_last${index}` }],
        history: [
          {
            position: 'student',
            institution: {
              domain: 'umass.edu',
              name: 'umass amherst',
            },
          },
        ],
      },
    }))
    const props = {
      profiles,
      bidOptions: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
      virtualList: true,
    }

    render(<ProfileListWithBidWidget {...props} />)

    expect(screen.getByRole('list').firstChild).toHaveClass('rc-virtual-list')
  })

  test('call update bid option when bid option is clicked', async () => {
    const updateBidOption = jest.fn()
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ fullname: 'first1 last1', username: '~first_last1' }],
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
      updateBidOption,
    }

    render(<ProfileListWithBidWidget {...props} />)

    await userEvent.click(screen.getByText('Very High'))
    expect(updateBidOption).toHaveBeenCalledWith(
      expect.objectContaining({ id: '~first_last1' }),
      'Very High'
    )

    await userEvent.click(screen.getByText('Very Low'))
    expect(updateBidOption).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: '~first_last1' }),
      'Very Low'
    )
  })

  test('search by expertise when expertise is clicked', async () => {
    const setSearchTerm = jest.fn()
    const props = {
      profiles: [
        {
          id: '~first_last1',
          content: {
            names: [{ fullname: 'first1 last1', username: '~first_last1' }],
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
      setSearchTerm,
    }

    render(<ProfileListWithBidWidget {...props} />)

    await userEvent.click(screen.getByText('machine learning'))
    expect(setSearchTerm).toHaveBeenCalledWith('machine learning')

    await userEvent.click(screen.getByText('nlp'))
    expect(setSearchTerm).toHaveBeenLastCalledWith('nlp')
  })
})
