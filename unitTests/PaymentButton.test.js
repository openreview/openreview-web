import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaymentButton from '../components/forum/PaymentButton'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

beforeEach(() => {
  api.get = jest.fn() // invitation+payments
  api.getGroupById = jest.fn() // domain group
  api.post = jest.fn() // cancel/checkout
})

describe('PaymentButton', () => {
  test('show nothing when there is no payment invitation', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() => Promise.resolve({ invitations: [] }))

    const { container } = render(<PaymentButton forumNote={forumNote} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('show nothing when invitation is expired', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() - 1000,
            content: {
              amount: { value: 100 },
            },
            details: { repliedPayments: [] },
          },
        ],
      })
    )

    const { container } = render(<PaymentButton forumNote={forumNote} />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  test('show nothing when paper is not active', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Desk_Rejected_Submission' },
      },
    }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() + 1000,
            content: {
              amount: { value: 100 },
            },
            details: { repliedPayments: [] },
          },
        ],
      })
    )
    api.getGroupById = jest.fn(() =>
      Promise.resolve({ content: { submission_venue_id: { value: 'Venue/2026/Submission' } } })
    )

    const { container } = render(<PaymentButton forumNote={forumNote} />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    expect(container).toBeEmptyDOMElement()
  })

  test('show payment button', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() + 1000,
            content: {
              amount: { value: 123 },
            },
            details: { repliedPayments: [] }, // no past payments
          },
        ],
      })
    )

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Pay Submission Fee ($1.23)' })
      ).toBeInTheDocument()
    )
  })

  test('get payment link when button is clicked', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() + 1000,
            content: {
              amount: { value: 123 },
            },
            details: { repliedPayments: [] }, // no past payments
          },
        ],
      })
    )
    api.post = jest.fn(() => Promise.resolve({ url: '#checkout-url' }))

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(async () => {
      const paymentButton = await screen.getByRole('button', {
        name: 'Pay Submission Fee ($1.23)',
      })
      userEvent.click(paymentButton)

      expect(api.post).toHaveBeenCalled()
      expect(window.location.href).toBe('http://localhost/#checkout-url')
    })
  })

  test('show cancel payment button when there is a payment pending', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() + 1000,
            content: {
              amount: { value: 123 },
            },
            details: { repliedPayments: [{ id: 'somePaymentId', status: 'pending' }] },
          },
        ],
      })
    )
    api.post = jest.fn()

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(async () => {
      const cancelPaymentButton = await screen.getByRole('button', {
        name: 'Cancel Payment',
      })
      userEvent.click(cancelPaymentButton)

      expect(api.post).toHaveBeenCalledWith('/payments/somePaymentId/cancel')
    })
  })

  test('show paid tag when there is a settled payment', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() + 1000,
            content: {
              amount: { value: 123 },
            },
            details: { repliedPayments: [{ id: 'somePaymentId', status: 'paid' }] },
          },
        ],
      })
    )

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(async () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByText('Fee paid')).toBeInTheDocument()
    })
  })

  test('show waived tag when there is a waived payment', async () => {
    const forumNote = { id: 'someForumNoteId' }
    api.get = jest.fn(() =>
      Promise.resolve({
        invitations: [
          {
            id: 'some payment invitation',
            expdate: Date.now() + 1000,
            content: {
              amount: { value: 123 },
            },
            details: { repliedPayments: [{ id: 'somePaymentId', status: 'waived' }] },
          },
        ],
      })
    )

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(async () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByText('Fee waived')).toBeInTheDocument()
    })
  })
})
