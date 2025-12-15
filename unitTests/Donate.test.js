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
  global.promptMessage = jest.fn()
  global.promptError = jest.fn()
  delete window.location
  window.location = { href: '' }
  mockedUser = {}
})

describe('Donation Page', () => {
  test('render all required buttons', () => {
    render(<Donate />)

    expect(screen.getByRole('button', { name: 'Monthly' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Monthly' })).toHaveClass('active') // default selection
    expect(screen.getByRole('button', { name: 'One-Time' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'One-Time' })).not.toHaveClass('active')

    expect(screen.getByText('$10')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('$500')).toBeInTheDocument()
    expect(screen.getByText('$1k')).toBeInTheDocument()
    expect(screen.getByText('$5k')).toBeInTheDocument()
    expect(screen.getByText('> $10k')).toBeInTheDocument()

    expect(screen.getByPlaceholderText('$ Other Amount')).toBeInTheDocument()

    expect(
      screen.queryByRole('checkbox', { name: 'I would like to cover the transaction fees' })
    ).not.toBeInTheDocument() // only show after amount selection/input

    expect(screen.getByRole('button', { name: 'Make a Donation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Make a Donation' })).toBeDisabled()
  })

  test('update selection in button text', async () => {
    render(<Donate />)

    await userEvent.click(screen.getByRole('button', { name: 'One-Time' }))
    expect(screen.getByRole('button', { name: 'Make a Donation' })).toBeInTheDocument() // no change when no amount

    await userEvent.click(screen.getByText('$10'))
    expect(screen.getByText('Make a Donation of $10.00')) // no month

    await userEvent.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(screen.getByText('Make a Donation of $10.00 /month')) // show / month

    await userEvent.click(screen.getByText('$5k'))
    expect(screen.getByText('Make a Donation of $5000.00 /month'))

    await userEvent.click(screen.getByRole('button', { name: 'One-Time' }))
    expect(screen.getByText('Make a Donation of $5000.00'))

    // enter custom amount
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '999')
    expect(screen.getByText('Make a Donation of $999.00'))
    await userEvent.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(screen.getByText('Make a Donation of $999.00 /month'))

    await userEvent.clear(screen.getByPlaceholderText('$ Other Amount'))
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '666', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation of $666.00 /month'))
  })

  test('handle transaction fee', async () => {
    render(<Donate />)

    await userEvent.click(screen.getByText('$100'))
    expect(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.00 to cover the transaction fees',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Make a Donation of $100.00 /month'))

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.00 to cover the transaction fees',
      })
    ) // check to add fee
    expect(screen.getByText('Make a Donation of $103.00 /month'))

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.00 to cover the transaction fees',
      })
    ) // uncheck to remove fee
    expect(screen.getByText('Make a Donation of $100.00 /month'))

    // enter custom amount
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '123', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation of $123.00 /month'))
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.69 to cover the transaction fees',
      })
    ) // check to add fee
    expect(screen.getByText('Make a Donation of $126.69 /month'))

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.69 to cover the transaction fees',
      })
    ) // uncheck to remove fee
    expect(screen.getByText('Make a Donation of $123.00 /month'))
  })

  test('handle max amount (custom amount)', async () => {
    render(<Donate />)

    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '12345', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation')).toBeDisabled()
    expect(global.promptMessage).toHaveBeenCalled()
  })

  test('handle max amount (custom amount with transaction fee)', async () => {
    render(<Donate />)

    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '9999', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation of $9999.00 /month'))
    expect(global.promptMessage).not.toHaveBeenCalled()

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $299.97 to cover the transaction fees',
      })
    ) // check to add fee
    expect(screen.getByText('Make a Donation')).toBeDisabled()
    expect(global.promptMessage).toHaveBeenCalled()
  })

  test('handle max amount (transaction fee then custom amount)', async () => {
    render(<Donate />)

    await userEvent.click(screen.getByText('$100'))
    expect(screen.getByText('Make a Donation of $100.00 /month'))
    expect(global.promptMessage).not.toHaveBeenCalled()

    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.00 to cover the transaction fees',
      })
    ) // check to add fee
    expect(screen.getByText('Make a Donation of $103.00 /month'))
    expect(global.promptMessage).not.toHaveBeenCalled()

    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '9999', {
      replace: true,
    })
    expect(screen.getByText('Make a Donation')).toBeDisabled()
    expect(global.promptMessage).toHaveBeenCalled()
  })

  test('post correct amount and mode (monthly no user)', async () => {
    render(<Donate />)

    // fixed amount
    await userEvent.click(screen.getByText('$100'))
    await userEvent.click(screen.getByText('Make a Donation of $100.00 /month'))
    expect(api.post).toHaveBeenCalledWith(
      // would fail though
      expect.anything(),
      {
        amount: 100,
        mode: 'subscription',
        email: undefined,
      },
      expect.anything()
    )
    expect(screen.getByText('Make a Donation of $100.00 /month')).toBeDisabled() // button disabled after submit

    // fixed amount with transaction fee
    await userEvent.click(screen.getByText('$100'))
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.00 to cover the transaction fees',
      })
    )
    await userEvent.click(screen.getByText('Make a Donation of $103.00 /month'))
    expect(api.post).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        amount: 103,
        mode: 'subscription',
        email: undefined,
      },
      expect.anything()
    )

    // custom amount with transactio fee(already checked)
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '123', {
      replace: true,
    })
    await userEvent.click(screen.getByText('Make a Donation of $126.69 /month'))
    expect(api.post).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        amount: 126.69,
        mode: 'subscription',
        email: undefined,
      },
      expect.anything()
    )

    // custom amount with no transaction fee
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.69 to cover the transaction fees',
      })
    ) // uncheck to remove fee
    await userEvent.click(screen.getByText('Make a Donation of $123.00 /month'))
    expect(api.post).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        amount: 123,
        mode: 'subscription',
        email: undefined,
      },
      expect.anything()
    )
  })

  test('post correct amount and mode (one-time with user)', async () => {
    mockedUser = {
      user: { profile: { preferredEmail: 'test@email.com' } },
    }

    render(<Donate />)

    await userEvent.click(screen.getByRole('button', { name: 'One-Time' }))
    // fixed amount
    await userEvent.click(screen.getByText('$100'))
    await userEvent.click(screen.getByText('Make a Donation of $100.00'))
    expect(api.post).toHaveBeenCalledWith(
      expect.anything(),
      {
        amount: 100,
        mode: 'payment',
        email: 'test@email.com',
      },
      expect.anything()
    )

    // fixed amount with transaction fee
    await userEvent.click(screen.getByText('$100'))
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.00 to cover the transaction fees',
      })
    )
    await userEvent.click(screen.getByText('Make a Donation of $103.00'))
    expect(api.post).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        amount: 103,
        mode: 'payment',
        email: 'test@email.com',
      },
      expect.anything()
    )

    // custom amount with transactio fee(already checked)
    await userEvent.type(screen.getByPlaceholderText('$ Other Amount'), '123', {
      replace: true,
    })
    await userEvent.click(screen.getByText('Make a Donation of $126.69'))
    expect(api.post).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        amount: 126.69,
        mode: 'payment',
        email: 'test@email.com',
      },
      expect.anything()
    )

    // custom amount with no transaction fee
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'I would like to add $3.69 to cover the transaction fees',
      })
    ) // uncheck to remove fee
    await userEvent.click(screen.getByText('Make a Donation of $123.00'))
    expect(api.post).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        amount: 123,
        mode: 'payment',
        email: 'test@email.com',
      },
      expect.anything()
    )
  })
})
