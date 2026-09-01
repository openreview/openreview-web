import { screen, render, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import VenuesTab from '../app/user/moderation/(VenueRequests)/VenuesTab'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

let venuesListProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../app/user/moderation/(VenueRequests)/VenuesList', () =>
  jest.fn((props) => {
    venuesListProps(props)
    return <div>Venues List</div>
  })
)

beforeEach(() => {
  venuesListProps = jest.fn()
})

describe('VenuestTab', () => {
  test('show VenuesList', async () => {
    api.getCombined = jest.fn(() => Promise.resolve({ notes: [] }))
    api.get = jest.fn(() => Promise.resolve({ notes: [] }))
    render(<VenuesTab />)

    await waitFor(() => {
      expect(api.getCombined).toHaveBeenCalled()
      expect(screen.getByText('Venues List')).toBeInTheDocument()
      expect(venuesListProps).toHaveBeenCalledWith(
        expect.objectContaining({ venueRequestNotes: [] })
      )
    })
  })

  test('show only deployed venues and sort correctly', async () => {
    const newest = dayjs().valueOf()
    const secondNewest = dayjs().subtract(1, 'day').valueOf()
    const thirdNewest = dayjs().subtract(2, 'day').valueOf()
    const fourthNewest = dayjs().subtract(3, 'day').valueOf()
    const betweenNewestAndSecondNewest = dayjs().subtract(12, 'hour').valueOf()
    const betweenThirdNewestAndFourthNewest = dayjs()
      .subtract(2, 'day')
      .subtract(12, 'hour')
      .valueOf()
    api.getCombined = jest.fn(() =>
      Promise.resolve({
        notes: [
          { id: 'v1 not deployed no comment', apiVersion: 1 },
          {
            id: 'v1 not deployed with comment',
            apiVersion: 1,
            details: {
              replies: [
                {
                  invitation: 'venue_request/Comment',
                  cdate: dayjs().valueOf(),
                },
              ],
            },
          },
          {
            id: 'v1 deployed no comment',
            content: { venue_id: 'v1_no_comment' },
            apiVersion: 1,
            cdate: secondNewest,
          },
          {
            id: 'v1 deployed with comment',
            content: { venue_id: 'v1_with_comment' },
            apiVersion: 1,
            details: {
              replies: [
                {
                  invitation: 'venue_request/Comment',
                  cdate: thirdNewest,
                },
              ],
            },
            cdate: dayjs().valueOf(), // does not matter
          },
          { id: 'v2 not deployed no comment', apiVersion: 2 },
          {
            id: 'v2 not deployed with comment',
            apiVersion: 2,
            details: {
              replies: [
                {
                  invitations: ['venue_request/Comment'],
                  cdate: dayjs().valueOf(),
                },
              ],
            },
          },
          {
            id: 'v2 deployed no comment',
            content: { venue_id: { value: 'v2_no_comment' } },
            apiVersion: 2,
            cdate: newest,
          },
          {
            id: 'v2 deployed with comment',
            content: { venue_id: { value: 'v2_with_comment' } },
            apiVersion: 2,
            details: {
              replies: [
                {
                  invitations: ['venue_request/Comment'],
                  cdate: fourthNewest,
                },
              ],
            },
            cdate: dayjs().valueOf(), // does not matter
          },
        ],
      })
    )
    api.get = jest.fn(() =>
      Promise.resolve({
        notes: [
          {
            id: 'journal not deployed',
            content: { venue_id: { value: undefined } },
          },
          {
            id: 'journal deployed no comment',
            content: { venue_id: { value: 'journal_no_comment' } },
            cdate: betweenNewestAndSecondNewest,
          },
          {
            id: 'journal deployed with comment',
            content: { venue_id: { value: 'journal_with_comment' } },
            details: {
              replies: [
                {
                  invitations: ['journal_request/Comment'],
                  cdate: betweenThirdNewestAndFourthNewest,
                },
              ],
            },
            cdate: dayjs().valueOf(), // does not matter
          },
        ],
      })
    )
    render(<VenuesTab />)

    await waitFor(() => {
      expect(api.getCombined).toHaveBeenCalled()
      expect(screen.getByText('Venues List')).toBeInTheDocument()
      expect(venuesListProps).toHaveBeenCalledWith(
        expect.objectContaining({
          venueRequestNotes: [
            // no comment request in front sorted by cdate desc
            // followed by with comment request sorted by cdate of latest comment
            expect.objectContaining({ id: 'v2 deployed no comment' }),
            expect.objectContaining({
              id: 'journal deployed no comment',
              journal: true,
              apiVersion: 2,
            }),
            expect.objectContaining({ id: 'v1 deployed no comment' }),
            expect.objectContaining({ id: 'v1 deployed with comment' }),
            expect.objectContaining({
              id: 'journal deployed with comment',
              journal: true,
              apiVersion: 2,
            }),
            expect.objectContaining({ id: 'v2 deployed with comment' }),
          ],
        })
      )
    })
  })
})
