import { render, screen, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import PaymentsConfirmation from '../app/payments/confirmation/page'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

let mockSessionId

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => mockSessionId,
  }),
  notFound: () => {
    throw new Error('notFoundToBeHanldedByNextjs')
  },
}))
jest.mock('../hooks/useUser')

beforeEach(() => {
  useUser.mockImplementation(() => ({
    isRefreshing: false,
  }))
  mockSessionId = 'some session id'
})

describe('Payments Confirmation page', () => {
  test('show not found when session_id is not passed', () => {
    mockSessionId = null

    expect(() => render(<PaymentsConfirmation />)).toThrow('notFoundToBeHanldedByNextjs')
  })

  test('show not found when session_id is invalid', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/payments':
          return Promise.resolve({ payments: [] }) // guest user, no payments
        case '/payments/confirmation':
          return Promise.resolve({ exists: false }) // invalid sessionId
      }
    })

    render(
      <ErrorBoundary fallbackRender={({ error }) => error.message}>
        <PaymentsConfirmation />
      </ErrorBoundary>
    )

    await waitFor(() =>
      expect(screen.getByText('notFoundToBeHanldedByNextjs')).toBeInTheDocument()
    )
  })

  test('show message with no detail for guest', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/payments':
          return Promise.resolve({ payments: [] }) // guest user, no payments
        case '/payments/confirmation':
          return Promise.resolve({ exists: true }) // valid sessionId
      }
    })

    render(<PaymentsConfirmation />)

    await waitFor(() => {
      expect(screen.getByText('Payment Submitted')).toBeInTheDocument()
      expect(
        screen.getByText(
          'The fee status will update once the payment is confirmed, usually within a few seconds. You can close this page.'
        )
      ).toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  test('show message with single paper detail for author', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/payments':
          return Promise.resolve({
            payments: [
              {
                note: 'someNoteId',
                domain: 'AAAI.org/2025/Conference',
              },
            ],
          })
        case '/notes':
          return Promise.resolve({ notes: [{ id: 'someNoteId', number: 2 }] })
      }
    })

    render(<PaymentsConfirmation />)

    await waitFor(() => {
      expect(screen.getByText('Payment Submitted')).toBeInTheDocument()
      expect(
        screen.getByText(
          'The fee status will update once the payment is confirmed, usually within a few seconds. You can close this page.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText('AAAI 2025 Conference Submission 2', { exact: false })
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Go to Submission' })).toHaveAttribute(
        'href',
        '/forum?id=someNoteId'
      )
    })
  })

  test('show message with multi paper detail for author', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/payments':
          return Promise.resolve({
            payments: [
              {
                note: 'someNoteId',
                domain: 'AAAI.org/2025/Conference',
              },
              {
                note: 'anotherNoteId',
                domain: 'AAAI.org/2025/Conference',
              },
            ],
          })
        case '/notes':
          return Promise.resolve({
            notes: [
              { id: 'someNoteId', number: 2 },
              { id: 'anotherNoteId', number: 3 },
            ],
          })
      }
    })

    render(<PaymentsConfirmation />)

    await waitFor(() => {
      expect(screen.getByText('Payment Submitted')).toBeInTheDocument()
      expect(
        screen.getByText(
          'The fee status will update once the payment is confirmed, usually within a few seconds. You can close this page.'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText('AAAI 2025 Conference Submissions 2 and 3', {
          exact: false,
        })
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Go to Payments' })).toHaveAttribute(
        'href',
        '/payments'
      )
    })
  })

  test('show message with no detail when notes fail to load', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/payments':
          return Promise.resolve({
            payments: [{ note: 'someNoteId', domain: 'AAAI.org/2025/Conference' }],
          })
        case '/notes':
          return Promise.reject(new Error('some error when getting the note detail'))
      }
    })

    render(<PaymentsConfirmation />)

    await waitFor(() => {
      expect(screen.getByText('Payment Submitted')).toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })
})
