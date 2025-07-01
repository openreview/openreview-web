import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import SearchFilterForm from '../app/search/FilterForm'
import api from '../lib/api-client'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('SearchFilterForm', () => {
  test('render search group options', async () => {
    api.get = jest.fn(() => ({ groups: [{ id: 'host', members: ['ICLR.cc', 'ICML.cc'] }] }))

    render(<SearchFilterForm searchQuery={{}} sourceOptions={[]} />)
    expect(api.get).toHaveBeenCalledWith('/groups', { id: 'host' })

    await userEvent.click(screen.getByText('all of OpenReview'))
    expect(screen.getByRole('option', { name: 'all of OpenReview' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ICLR' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ICML' })).toBeInTheDocument()
  })
})
