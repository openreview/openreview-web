import { screen, render, waitFor } from '@testing-library/react'
import VenueRequestTab from '../app/user/moderation/(VenueRequests)/VenueRequestTab'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

let venueRequestListProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../app/user/moderation/(VenueRequests)/VenueRequestList', () =>
  jest.fn((props) => {
    venueRequestListProps(props)
    return <div>Venue Request List</div>
  })
)

beforeEach(() => {
  venueRequestListProps = jest.fn()
})

describe('VenueRequestTab', () => {
  test('show VenueRequestList', async () => {
    api.getCombined = jest.fn(() => Promise.resolve({ notes: [] }))
    api.get = jest.fn(() => Promise.resolve({ notes: [] })) // journal
    render(<VenueRequestTab />)

    await waitFor(() => {
      expect(api.getCombined).toHaveBeenCalled()
      expect(api.get).toHaveBeenCalled()
      expect(screen.getByText('Venue Request List')).toBeInTheDocument()
      expect(venueRequestListProps).toHaveBeenCalledWith(
        expect.objectContaining({ newRequestNotes: [] })
      )
    })
  })

  test('filter out deployed venues', async () => {
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
    api.get = jest.fn(() =>
      Promise.resolve({
        notes: [
          {
            id: 'journal deployed',
            content: {
              venue_id: {
                value: 'journal',
              },
            },
          },
          {
            id: 'journal not deployed',
            content: {
              venue_id: {
                value: undefined,
              },
            },
          },
        ],
      })
    )
    render(<VenueRequestTab />)

    await waitFor(() => {
      expect(venueRequestListProps).toHaveBeenCalledWith(
        expect.objectContaining({
          newRequestNotes: expect.arrayContaining([
            { id: 'v1 not deployed', apiVersion: 1 },
            { id: 'v2 not deployed', apiVersion: 2 },
            { id: 'journal not deployed', apiVersion: 2, journal: true },
          ]),
        })
      )
    })
  })
})
