import Donate from '../app/donate/page'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import api from '../lib/api-client'

let mockedUser

jest.mock('../hooks/useUser', () => () => mockedUser)
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => jest.fn(),
  }),
}))

beforeEach(() => {
  api.post = jest.fn()
  api.get = jest.fn()
  global.promptMessage = jest.fn()
  global.promptError = jest.fn()
  delete window.location
  window.location = { href: '' }
  mockedUser = {}
})

describe('Donation Page', () => {
  test('render all required buttons', () => {
    render(<Donate />)

    expect(screen.queryByRole('button', { name: 'Monthly' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'One-Time' })).not.toBeInTheDocument()

    expect(screen.getByText('$10')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('$500')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
    expect(screen.getByText('$10,000')).toBeInTheDocument()

    expect(screen.getByPlaceholderText('$ Other Amount')).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Make a Donation through Stripe' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Make a Donation through Stripe' })
    ).toBeDisabled()
  })

  test('update selection in button text', async () => {
    render(<Donate />)

    expect(
      screen.getByRole('button', { name: 'Make a Donation through Stripe' })
    ).toBeInTheDocument() // no change when no amount

    await userEvent.click(screen.getByText('$10'))
    expect(screen.getByText('Make a Donation of $10 through Stripe'))

    await userEvent.click(screen.getByText('$10,000'))
    expect(screen.getByText('Make a Donation of $10,000 through Stripe'))

    // enter custom amount
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '999')
    expect(screen.getByText('Make a Donation of $999 through Stripe'))
    await userEvent.clear(screen.getByPlaceholderText('$ Other Amount'))
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '666', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation of $666 through Stripe'))
  })

  test('handle max amount (custom amount)', async () => {
    render(<Donate />)

    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '12345', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation through Stripe')).toBeDisabled()
    expect(global.promptMessage).toHaveBeenCalled()
  })

  test('post correct amount (no user)', async () => {
    render(<Donate />)

    // fixed amount
    await userEvent.click(screen.getByText('$100'))
    await userEvent.click(screen.getByText('Make a Donation of $100 through Stripe'))
    expect(api.post).toHaveBeenCalledWith(
      // would fail though
      expect.anything(),
      {
        amount: 100,
        mode: 'payment',
        email: undefined,
        irsReceipt: false,
      }
    )
    expect(screen.getByText('Make a Donation of $100 through Stripe')).toBeDisabled() // button disabled after submit

    // custom amount
    await userEvent.clear(screen.getByPlaceholderText('$ Other Amount'))
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '10000', {
      replace: true,
    })
    await userEvent.click(screen.getByText('Make a Donation of $10,000 through Stripe'))
    expect(api.post).toHaveBeenLastCalledWith(expect.anything(), {
      amount: 10000,
      mode: 'payment',
      email: undefined,
      irsReceipt: true, // auto checked
    })
  })

  test('post correct amount (with user)', async () => {
    mockedUser = {
      user: { profile: { id: '~Test_User1' } },
    }
    api.get = jest.fn(() => ({
      profiles: [
        {
          id: '~Test_User1',
          content: {
            preferredEmail: 'test@email.com',
          },
        },
      ],
    }))

    render(<Donate />)

    // fixed amount
    await userEvent.click(screen.getByText('$100'))
    await userEvent.click(screen.getByText('Make a Donation of $100 through Stripe'))
    expect(api.get).toHaveBeenCalledWith('/profiles')
    expect(api.post).toHaveBeenCalledWith(expect.anything(), {
      amount: 100,
      mode: 'payment',
      email: 'test@email.com',
      irsReceipt: false,
    })

    // check IRS receipt
    await userEvent.click(screen.getByText('$10'))
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'Email me a charitable donation receipt for tax purposes.',
      })
    )
    await userEvent.click(screen.getByText('Make a Donation of $10 through Stripe'))
    expect(api.post).toHaveBeenLastCalledWith(expect.anything(), {
      amount: 10,
      mode: 'payment',
      email: 'test@email.com',
      irsReceipt: true,
    })

    // custom amount
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '123', {
      replace: true,
    })
    await userEvent.click(screen.getByText('Make a Donation of $123 through Stripe'))
    expect(api.post).toHaveBeenLastCalledWith(expect.anything(), {
      amount: 123,
      email: 'test@email.com',
      irsReceipt: true,
      mode: 'payment',
    })
  })
})
