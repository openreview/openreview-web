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

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
      expect(options[0]).toHaveTextContent('AAAA')
      expect(options[1]).toHaveTextContent('AAAB')
      expect(options[2]).toHaveTextContent('AAAC')
    })
  })

  test('navigates to /group when a result is selected', async () => {
    api.get = jest.fn(() => ({ venues: [{ id: 'AAAA' }] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAA')

    const options = await screen.findAllByRole('option')
    await userEvent.click(options[0])

    expect(pushMock).toHaveBeenCalledWith('/group?id=AAAA')
  })

  test('shows empty-state message when server returns no results', async () => {
    api.get = jest.fn(() => ({ venues: [] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(
      screen.getByPlaceholderText('Type to search for venues...'),
      'nonexistent'
    )

    await waitFor(() => {
      expect(screen.getByText('No venues match your search.')).toBeInTheDocument()
    })
  })

  test('shows "View All Venues" link in the dropdown footer', async () => {
    api.get = jest.fn(() => ({ venues: [{ id: 'AAAA' }] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByPlaceholderText('Type to search for venues...'), 'AAA')

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /View All Venues/ })).toHaveAttribute(
        'href',
        '/venues'
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
})
