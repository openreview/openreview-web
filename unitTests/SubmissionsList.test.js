import { render, waitFor } from '@testing-library/react'
import SubmissionsList from '../components/webfield/SubmissionsList'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
}))

beforeEach(() => {
  api.get = jest.fn()
})

describe('SubmissionsList', () => {
  test('not pass domain to notes call when it is v1 api', async () => {
    render(<SubmissionsList venueId="testVenue" apiVersion={1} />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/notes',
        expect.objectContaining({
          domain: undefined,
        }),
        expect.objectContaining({ version: 1 })
      )
    })
  })

  test('pass domain to notes call when it is v1 api and skipDomain is not set', async () => {
    render(<SubmissionsList venueId="testVenue" apiVersion={2} />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/notes',
        expect.objectContaining({
          domain: 'testVenue',
        }),
        expect.objectContaining({ version: 2 })
      )
    })
  })

  // when domain is passed, pc can't see deployed venues as api will filter out member by domain
  test('not to pass domain to notes call when it is v1 api and skipDomain is set to true', async () => {
    render(<SubmissionsList venueId="testVenue" apiVersion={2} skipDomain />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/notes',
        expect.objectContaining({
          domain: undefined,
        }),
        expect.objectContaining({ version: 2 })
      )
    })
  })
})
