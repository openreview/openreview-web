import { screen, render, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaymentButton from '../components/forum/PaymentButton'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

let getPaymentStatusReturn

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({
  user: { profile: { id: '~Test_User1' } },
  isRefreshing: false,
}))
jest.mock('../lib/utils', () => ({
  ...jest.requireActual('../lib/utils'),
  getPaymentStatus: jest.fn(() => getPaymentStatusReturn),
}))

beforeEach(() => {
  api.get = jest.fn(() => Promise.resolve({ invitations: [] })) // invitation+payments; not needed for code not to fail but is not what this file is testing
  api.getGroupById = jest.fn() // domain group
  api.post = jest.fn() // cancel/checkout
  global.promptError = jest.fn()
  window.location.hash = ''
  getPaymentStatusReturn = undefined
})

describe('PaymentButton', () => {
  test('show payment button when payment status is payable', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = { amount: '123', status: 'payable' }

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Pay Submission Fee ($1.23)' })
      ).toBeInTheDocument()
    )
  })

  test('get payment link when button is clicked', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'payable',
    }
    api.post = jest.fn(() => Promise.resolve({ url: '#checkout-url' }))
    const forumUrl = window.location.href

    render(<PaymentButton forumNote={forumNote} />)

    await userEvent.click(
      await screen.findByRole('button', { name: 'Pay Submission Fee ($1.23)' })
    )

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/payments/checkout', {
      invitation: 'some payment invitation',
      payment: { note: 'someForumNoteId' },
      cancelUrl: forumUrl,
    })
    expect(window.location.href).toBe('http://localhost/#checkout-url')
  })

  test('reload latest payment status when get payment link fails', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'payable',
    }
    api.post = jest.fn(() =>
      Promise.reject(new Error('A checkout for session is already in progress'))
    )

    render(<PaymentButton forumNote={forumNote} />)

    const payButton = await screen.findByRole('button', { name: 'Pay Submission Fee ($1.23)' })
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'inProgressCancelable',
      payment: { id: 'somePaymentId', signature: '~Another_Author1' },
    }
    await userEvent.click(payButton)

    expect(global.promptError).toHaveBeenCalledWith(
      'A checkout for session is already in progress'
    )
    expect(await screen.findByRole('button', { name: 'Cancel Payment' })).toBeInTheDocument()
  })

  test('show paid tag when payment status is paid', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'paid',
      payment: { id: 'some payment obj' },
    }
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

  test('show paid tag when payment status is waived', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'waived',
      payment: { id: 'some payment obj' },
    }

    render(<PaymentButton forumNote={forumNote} />)

    await waitFor(async () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByText('Fee waived')).toBeInTheDocument()
    })
  })

  test('show cancel payment button when payment status is inProgressCancelable and payment is initiated by another author', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'inProgressCancelable',
      payment: { id: 'somePaymentId', signature: '~Another_Author1' }, // cdate omitted for consistent output in test
    }
    api.post = jest.fn()

    render(<PaymentButton forumNote={forumNote} />)

    const cancelButton = await screen.findByRole('button', { name: 'Cancel Payment' })
    expect(screen.queryByRole('button', { name: 'Continue Payment' })).not.toBeInTheDocument()
    await userEvent.hover(cancelButton)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Payment initiated by Another Author a few seconds ago'
    )

    await userEvent.click(cancelButton)

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/payments/somePaymentId/cancel')
  })

  test('show continue payment button when payment status is inProgressCancelable and payment is initiated by the user', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'inProgressCancelable',
      payment: { id: 'somePaymentId', signature: '~Test_User1' }, // cdate omitted for consistent output in test
    }
    api.post = jest.fn(() => Promise.resolve({ url: '#checkout-url' }))
    const forumUrl = window.location.href

    render(<PaymentButton forumNote={forumNote} />)

    const continueButton = await screen.findByRole('button', { name: 'Continue Payment' })
    expect(screen.queryByRole('button', { name: 'Cancel Payment' })).not.toBeInTheDocument()

    await userEvent.click(continueButton)

    expect(api.post).toHaveBeenCalledTimes(2)
    expect(api.post).toHaveBeenNthCalledWith(1, '/payments/somePaymentId/cancel')
    expect(api.post).toHaveBeenNthCalledWith(2, '/payments/checkout', {
      invitation: 'some payment invitation',
      payment: { note: 'someForumNoteId' },
      cancelUrl: forumUrl,
    })
    expect(window.location.href).toBe('http://localhost/#checkout-url')
  })

  test('do not get payment link when continue payment fails to cancel the payment in progress', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'inProgressCancelable',
      payment: { id: 'somePaymentId', signature: '~Test_User1' }, // cdate omitted for consistent output in test
    }
    api.post = jest.fn(() =>
      Promise.reject(
        new Error('Could not expire the Stripe checkout session because it is not open')
      )
    )

    render(<PaymentButton forumNote={forumNote} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Continue Payment' }))

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/payments/somePaymentId/cancel')
    expect(global.promptError).toHaveBeenCalledWith(
      'Could not expire the Stripe checkout session because it is not open'
    )
    expect(api.get).toHaveBeenCalledTimes(2) // initial load + reload after failure
  })

  test('show disabled payment in progress button when payment status is inProgressNotCancelable', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'inProgressNotCancelable',
      payment: { id: 'somePaymentId', signature: '~Another_Author1' }, // cdate omitted for consistent output in test
    }

    render(<PaymentButton forumNote={forumNote} />)

    const cancelButton = await screen.findByRole('button', { name: 'Payment in Progress' })
    await userEvent.hover(cancelButton)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Payment initiated by Another Author a few seconds ago'
    )
    expect(cancelButton).toBeDisabled()
  })

  test('show payment failed button when payment status is inProgressNotCancelable', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      invitationId: 'some payment invitation',
      amount: '123',
      status: 'failed',
    }

    render(<PaymentButton forumNote={forumNote} />)

    expect(await screen.findByRole('button', { name: 'Payment Failed' })).toBeDisabled()
  })

  test('show nothing when payment status is null', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = null

    const { container } = await act(async () =>
      render(<PaymentButton forumNote={forumNote} />)
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('show nothing when payment status is paidInvitationDeleted', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      id: 'someForumNoteId',
      amount: '123',
      status: 'paidInvitationDeleted',
      payment: { id: 'somePaymentId' },
    }

    const { container } = await act(async () =>
      render(<PaymentButton forumNote={forumNote} />)
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('show nothing when payment status is waivedInvitationDeleted', async () => {
    const forumNote = {
      id: 'someForumNoteId',
      content: {
        venueid: { value: 'Venue/2026/Submission' },
      },
    }
    getPaymentStatusReturn = {
      id: 'someForumNoteId',
      amount: '123',
      status: 'waivedInvitationDeleted',
      payment: { id: 'somePaymentId' },
    }

    const { container } = await act(async () =>
      render(<PaymentButton forumNote={forumNote} />)
    )

    expect(container).toBeEmptyDOMElement()
  })
})
