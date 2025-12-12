import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import Signup from '../app/signup/Signup'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))

beforeEach(() => {
  api.get = jest.fn()
})

describe('Signup', () => {
  test('show fullname input and confirm name checkbox (disabled)', () => {
    render(<Signup />)

    expect(
      screen.getByText('Enter your full name as you would write it as the author of a paper')
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { placeholder: 'Full Name' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeDisabled()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('enable checkbox after full name is entered', async () => {
    render(<Signup />)

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    await userEvent.type(fullNameInput, 'Valid Name')

    expect(screen.getByRole('checkbox')).toBeEnabled()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('show new profile form when name is confirmed', async () => {
    render(<Signup />)

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    const confirmNameCheckbox = screen.getByRole('checkbox')

    await userEvent.type(fullNameInput, 'Valid Name')
    await userEvent.click(confirmNameCheckbox)

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(1) // get institutional domains
    expect(api.get).toHaveBeenCalledWith('/settings/institutionDomains')
  })
})
