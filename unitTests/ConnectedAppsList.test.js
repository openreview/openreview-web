import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConnectedAppsList from '../app/profile/password-security/ConnectedAppsList'
import api from '../lib/api-client'
import { formatDateTime } from '../lib/utils'
import '@testing-library/jest-dom'

window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/LoadingSpinner', () => () => <span>loading spinner</span>)

describe('ConnectedAppsList', () => {
  test('show empty message when there is no connected apps', async () => {
    api.get = jest.fn(() => Promise.resolve({ consents: [] }))

    render(<ConnectedAppsList />)

    expect(api.get).toHaveBeenCalledWith('/oidc/consents')
    await waitFor(() => {
      expect(
        screen.getByText('There are no connected third-party apps or services.')
      ).toBeInTheDocument()
    })
  })

  test('show connected apps', async () => {
    const cdate1 = Date.now() - 2 * 24 * 60 * 60 * 1000
    const cdate2 = Date.now() - 5 * 24 * 60 * 60 * 1000

    api.get = jest.fn(() =>
      Promise.resolve({
        consents: [
          {
            clientId: 'some-test-app',
            clientName: 'Test App One',
            scopes: ['openid', 'profile'],
            sharedData: ['OpenReview ID', 'Name'],
            tcdate: cdate1,
          },
          {
            clientId: 'some-other-app',
            clientName: 'Test App Two',
            scopes: ['openid', 'profile'],
            sharedData: ['OpenReview ID', 'Name'],
            tcdate: cdate2,
          },
        ],
      })
    )

    render(<ConnectedAppsList />)

    expect(api.get).toHaveBeenCalledWith('/oidc/consents')
    await waitFor(() => {
      expect(
        screen.queryByText('There is no connected third-party apps or services.')
      ).not.toBeInTheDocument()

      expect(screen.getByText('Test App One')).toBeInTheDocument()
      expect(screen.getByText('Test App Two')).toBeInTheDocument()
      expect(screen.getByText(`connected on ${formatDateTime(cdate1)}`)).toBeInTheDocument()
      expect(screen.getByText(`connected on ${formatDateTime(cdate2)}`)).toBeInTheDocument()

      expect(screen.getAllByRole('button')).toHaveLength(2)
    })
  })

  test('delete connected apps when delete button is clicked', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        consents: [
          {
            clientId: 'some-test-app',
            clientName: 'Test App',
            scopes: ['openid', 'profile'],
            sharedData: ['OpenReview ID', 'Name'],
            tcdate: Date.now(),
          },
        ],
      })
    )
    api.delete = jest.fn(() => Promise.resolve())
    global.promptMessage = jest.fn()
    window.confirm = jest.fn(() => true)

    render(<ConnectedAppsList />)

    await waitFor(() => {
      userEvent.click(screen.getByRole('button'))
      expect(api.delete).toHaveBeenCalledWith('/oidc/consents/some-test-app')
      expect(global.promptMessage).toHaveBeenCalledWith(
        'You are no longer connected to Test App.'
      )
    })
  })
})
