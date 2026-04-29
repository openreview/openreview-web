import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AllVenuesWithSearch from '../app/(Home)/AllVenuesWithSearch'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

// required by autocomplete component
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
global.MessageChannel =
  global.MessageChannel ||
  class {
    constructor() {
      this.port1 = { postMessage: () => {}, close: () => {}, onmessage: null }
      this.port2 = { postMessage: () => {}, close: () => {}, onmessage: null }
    }
  }
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AllVenuesWithSearch', () => {
  beforeEach(() => {
    pushMock.mockReset()
    global.promptError = jest.fn()
  })

  test('show search input', () => {
    render(<AllVenuesWithSearch />)
    expect(screen.getByPlaceholderText('Type to search for venues...')).toBeInTheDocument()
  })

  test('does not call api when typing fewer than 3 characters', async () => {
    api.get = jest.fn(() => ({ venues: [] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AA')

    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(api.get).not.toHaveBeenCalled()
  })

  test('calls api and renders results when typing 3+ characters', async () => {
    api.get = jest.fn(() => ({ venues: [{ id: 'AAAA' }, { id: 'AAAB' }, { id: 'AAAC' }] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAA')

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/venues/search',
        expect.objectContaining({ term: 'AAA', limit: 10 })
      )
    })
  })

  test('call api when trimmed but untokenized term', async () => {
    api.get = jest.fn(() => ({ venues: [] }))
    render(<AllVenuesWithSearch />)

    const url = '   https://cvpr.thecvf.com/Conferences/2026  '
    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), url)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/venues/search',
        expect.objectContaining({ term: 'https://cvpr.thecvf.com/Conferences/2026' })
      )
    })
  })

  test('navigates to /group when a result is selected', async () => {
    api.get = jest.fn(() => Promise.resolve({ venues: [{ id: 'AAAA' }] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAA')

    const options = await screen.findAllByRole('option')
    await userEvent.click(options[0])

    expect(pushMock).toHaveBeenCalledWith('/group?id=AAAA')
  })

  test('shows empty-state message when server returns no results', async () => {
    api.get = jest.fn(() => Promise.resolve({ venues: [] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(
      screen.getByPlaceholderText('Type to search for venues...'),
      'nonexistent'
    )

    await waitFor(() => {
      expect(screen.getByText('No venues match your search.')).toBeInTheDocument()
    })
  })

  test('shows search unavailable message when es is down', async () => {
    api.get = jest.fn(() => Promise.resolve({ venues: [], count: 0, searchUnavailable: true }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(
        screen.getByText(
          'OpenReview is experiencing degraded performance in search functionality. Please try again later.'
        )
      ).toBeInTheDocument()
    })
  })

  test('shows "View All Venues" link in the dropdown footer', async () => {
    api.get = jest.fn(() => Promise.resolve({ venues: [{ id: 'AAAA' }] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAA')

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /View All Venues/ })).toHaveAttribute(
        'href',
        '/all-venues'
      )
    })
  })

  test('calls promptError when the search request fails', async () => {
    api.get = jest.fn(() => Promise.reject(new Error('some error')))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith('some error')
    })
  })

  test('show matching domain when it is domain instead of id match', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({ venues: [{ id: 'AAAA', domain: 'some_test_domain' }] })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        'Domain - some_test_domain'
      )
    })
  })

  test('show matching title when it is title instead of id match', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        venues: [{ id: 'AAAA', content: { title: { value: 'some test title' } } }],
      })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        'Title - some test title'
      )
    })
  })

  test('show matching subtitle when it is subtitle instead of id match', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        venues: [
          {
            id: 'AAAA',
            content: {
              title: { value: 'irrelevant title' },
              subtitle: { value: 'some test subtitle' },
            },
          },
        ],
      })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        'Subtitle - some test subtitle'
      )
    })
  })

  test('show matching location when it is location instead of id match', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        venues: [
          {
            id: 'AAAA',
            content: {
              title: { value: 'irrelevant title' },
              subtitle: { value: 'irrelevant subtitle' },
              location: { value: 'some test location' },
            },
          },
        ],
      })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        'Location - some test location'
      )
    })
  })

  test('show matching website when it is website instead of id match', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        venues: [
          {
            id: 'AAAA',
            content: {
              title: { value: 'irrelevant title' },
              subtitle: { value: 'irrelevant subtitle' },
              location: { value: 'irrelevant location' },
              website: { value: 'some test website' },
            },
          },
        ],
      })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        'Website - some test website'
      )
    })
  })

  test('not to show fields when id match', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        venues: [
          {
            id: 'AAAA',
            content: {
              title: { value: 'AAAA title' },
              subtitle: { value: 'AAAA subtitle' },
              location: { value: 'AAAA location' },
              website: { value: 'AAAA website' },
            },
          },
        ],
      })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAAA')

    await waitFor(() => {
      expect(screen.getByText('AAAA')).toBeInTheDocument()
      expect(screen.getByText('AAAA').nextSibling).toBeNull()
    })
  })

  // when matching text is very long, it's possible that highlighted text is not visible
  // so need to truncate the text
  test('truncate text when matching text is in middle of long text', async () => {
    const dummyText = 'X'.repeat(40)
    api.get = jest.fn(() =>
      Promise.resolve({
        venues: [
          {
            id: 'AAAA',
            content: {
              location: { value: `${dummyText}test location${dummyText}` },
            },
          },
        ],
      })
    )
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'test')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        /^Location - …X+test locationX+…$/
      )
    })
  })

  test('show active and open tag', async () => {
    api.get = jest.fn(() => ({ venues: [{ id: 'AAAA' }] }))
    render(
      <AllVenuesWithSearch
        activeVenues={[{ groupId: 'AAAA' }]}
        openVenues={[{ groupId: 'AAAA' }]}
      />
    )

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAAA')

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent('Active')
      expect(screen.getByText('AAAA').parentElement.nextSibling.nextSibling).toHaveTextContent(
        'Open for Submission'
      )
    })
  })

  test('match immediate search term before tokenized term', async () => {
    api.get = jest.fn(() => ({
      venues: [
        {
          id: 'AAAA',
          domain: 'someterm',
          content: { website: { value: 'https://someterm.com' } },
        },
      ],
    }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(
      screen.getByPlaceholderText('Type to search for venues...'),
      'https://someterm.com' // should match website instead of domain
    )

    await waitFor(() => {
      expect(screen.getByText('AAAA').parentElement.nextSibling).toHaveTextContent(
        'Website - https://someterm.com'
      )
    })
  })
})
