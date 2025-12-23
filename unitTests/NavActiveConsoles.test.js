import { screen, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import NavActiveConsoles from '../app/(Home)/NavActiveConsoles'
import api from '../lib/api-client'
import userEvent from '@testing-library/user-event'

let mockedUser

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => mockedUser)

beforeEach(() => {
  mockedUser = { user: { id: '~Test_Id1' }, accessToken: 'some token', isRefreshing: false }
})

describe('NavActiveConsoles', () => {
  test('render nothing when refreshing token', () => {
    mockedUser = { user: undefined, accessToken: undefined, isRefreshing: true }

    const { container } = render(<NavActiveConsoles />)

    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing when user is not logged in', () => {
    mockedUser = { user: undefined, accessToken: undefined, isRefreshing: false }

    const { container } = render(<NavActiveConsoles />)

    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing when there is no active console', () => {
    api.get = jest.fn((path, queryParam) => {
      if (path === '/invitations') {
        // open venues
        return Promise.resolve({ invitations: [] })
      }
      if (queryParam.id) {
        // active venues
        return Promise.resolve({ groups: [{ id: 'active_venues', members: [] }] })
      }
      // user consoles
      return Promise.resolve({ groups: [] })
    })

    const { container } = render(<NavActiveConsoles />)

    expect(container).toBeEmptyDOMElement()
  })

  test('render active venues', async () => {
    api.get = jest.fn((path, queryParam) => {
      if (path === '/invitations') {
        // open venues
        return Promise.resolve({
          invitations: [{ id: 'Venue.Two/2024/conference/-/submission' }],
        })
      }
      if (queryParam.id) {
        // active venues
        return Promise.resolve({
          groups: [
            {
              members: [
                'Venue.One',
                'Venue.Two/2024/conference',
                'Venue.Two/2024/Workshop/ABC',
              ],
            },
          ],
        })
      }
      // user consoles
      return Promise.resolve({
        groups: [
          { id: 'Venue.Two/2024/conference/Authors' },
          { id: 'Venue.Two/2024/conference/Reviewers' },
          { id: 'Venue.Closed/1999/conference/Reviewers' },
        ],
      })
    })

    render(<NavActiveConsoles />)

    await waitFor(() => {
      expect(screen.getByText('Active Consoles')).toHaveClass('hidden-sm hidden-md')
      expect(screen.getByText('Consoles')).toHaveClass('visible-sm-inline visible-md-inline')
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Active Consoles'))

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(3) // dropdown itself + 2 options
      expect(screen.getByRole('link', { name: 'Venue 2024 Authors' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Venue 2024 Reviewers' })).toBeInTheDocument()
    })
  })
})
