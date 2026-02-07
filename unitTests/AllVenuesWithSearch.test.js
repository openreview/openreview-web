import { screen, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import AllVenuesWithSearch from '../app/(Home)/AllVenuesWithSearch'
import userEvent from '@testing-library/user-event'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('AllVenuesWithSearch', () => {
  test('show search input', async () => {
    render(<AllVenuesWithSearch />)
    expect(
      screen.getByRole('textbox', { placeholder: 'Type to search for venues...' })
    ).toBeInTheDocument()
  })

  test('show empty message when search return nothing', async () => {
    api.get = jest.fn(() => ({ venues: [] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByRole('textbox'), 'non existing venue')

    await waitFor(() => {
      expect(screen.getByText('Your search did not return any results.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View All Venues' })).toHaveAttribute(
        'href',
        '/venues'
      )
    })
  })

  test('show search results', async () => {
    api.get = jest.fn(() => ({ venues: [{ id: 'AAAA' }, { id: 'AAAB' }, { id: 'AAAC' }] }))
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByRole('textbox'), 'AAA')

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ term: 'AAA' })
      )
      expect(
        screen.queryByText('Your search did not return any results.')
      ).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'AAAA' })).toHaveAttribute(
        'href',
        '/group?id=AAAA'
      )
      expect(screen.getByRole('link', { name: 'AAAB' })).toHaveAttribute(
        'href',
        '/group?id=AAAB'
      )
      expect(screen.getByRole('link', { name: 'AAAC' })).toHaveAttribute(
        'href',
        '/group?id=AAAC'
      )
    })
  })

  test('show error when search fail', async () => {
    api.get = jest.fn(() => Promise.reject(new Error('some error')))
    global.promptError = jest.fn()
    render(<AllVenuesWithSearch />)

    await userEvent.type(screen.getByRole('textbox'), 'non existing venue')

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith('some error')
    })
  })
})
