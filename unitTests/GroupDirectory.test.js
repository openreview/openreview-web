import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import { renderWithWebFieldContext } from './util'
import GroupDirectory from '../components/webfield/GroupDirectory'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))
jest.mock('../components/LoadingSpinner', () => () => <span>loading spinner</span>)
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => jest.fn(),
  }),
}))

describe('GroupDirectory', () => {
  test('show loading spinner when loading child groups', async () => {
    const providerProps = { value: { entity: { id: 'testId' } } }
    api.get = jest.fn(() => ({
      groups: [],
    }))

    renderWithWebFieldContext(
      <GroupDirectory appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.get).toHaveBeenCalled()
    expect(screen.getByText('loading spinner')).toBeInTheDocument()
  })

  test('not to show loading spinner when links are specified in config', async () => {
    const providerProps = {
      value: { entity: { id: 'testId' }, links: ['testId1', 'testId2'] },
    }
    api.get = jest.fn(() => ({
      groups: [],
    }))

    renderWithWebFieldContext(
      <GroupDirectory appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.get).not.toHaveBeenCalled()
    expect(screen.queryByText('loading spinner')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'testId1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'testId2' })).toBeInTheDocument()
  })
})
