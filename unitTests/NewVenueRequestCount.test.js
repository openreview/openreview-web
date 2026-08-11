import { screen, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import NewVenueRequestCount from '../app/user/moderation/(VenueRequests)/NewVenueRequestCount'
import api from '../lib/api-client'

let badgeProps
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('antd', () => ({
  Badge: jest.fn((props) => {
    badgeProps(props)
    return <span>Badge</span>
  }),
}))

beforeEach(() => {
  badgeProps = jest.fn()
})

describe('NewVenueRequestCount', () => {
  test('show badge widget', async () => {
    // antd Badge handles 0 display automatically
    api.getCombined = jest.fn(() => Promise.resolve({ notes: [] }))
    render(<NewVenueRequestCount>tab title</NewVenueRequestCount>)

    await waitFor(() => {
      expect(api.getCombined).toHaveBeenCalled()
      expect(screen.getByText('Badge')).toBeInTheDocument()
      expect(badgeProps).toHaveBeenCalledWith(
        expect.objectContaining({ children: 'tab title', count: 0 })
      )
    })
  })

  test('filter out deployed venues', async () => {
    // antd Badge handles 0 display automatically
    api.getCombined = jest.fn(() =>
      Promise.resolve({
        notes: [
          { id: 'v1 deployed', content: { venue_id: 'v1' }, apiVersion: 1 },
          { id: 'v1 not deployed', content: { venue_id: undefined }, apiVersion: 1 },
          {
            id: 'v2 deployed',
            content: {
              venue_id: {
                value: 'v2',
              },
            },
            apiVersion: 2,
          },
          {
            id: 'v2 not deployed',
            content: {
              venue_id: {
                value: undefined,
              },
            },
            apiVersion: 2,
          },
        ],
      })
    )
    render(<NewVenueRequestCount>tab title</NewVenueRequestCount>)

    await waitFor(() => {
      expect(api.getCombined).toHaveBeenCalled()
      expect(screen.getByText('Badge')).toBeInTheDocument()
      expect(badgeProps).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }))
    })
  })
})
