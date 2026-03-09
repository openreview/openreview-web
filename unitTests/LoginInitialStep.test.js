import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LoginInitialStep from '../app/login/LoginInitialStep'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('LoginInitialStep', () => {
  test('show login form and reset password link and resend confirmation link', async () => {
    render(<LoginInitialStep />)

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login to OpenReview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: "Didn't receive email confirmation?" })
    ).toBeInTheDocument()
  })

  test('enable login button only when email and password are filled', async () => {
    render(<LoginInitialStep />)

    const emailInput = screen.getByRole('textbox', { name: 'Email' })
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByRole('button', { name: 'Login to OpenReview' })

    expect(loginButton).toBeDisabled()

    await userEvent.type(emailInput, 'test@example.com')
    expect(loginButton).toBeDisabled()

    await userEvent.type(passwordInput, 'password123')
    expect(loginButton).toBeEnabled()

    await userEvent.clear(emailInput)
    expect(loginButton).toBeDisabled()

    await userEvent.type(emailInput, 'invalid email')
    expect(loginButton).toBeDisabled()

    await userEvent.type(emailInput, 'test@example.com', { replace: true })
    expect(loginButton).toBeEnabled()
  })

  test('call handleInitialSubmit when login button is clicked', async () => {
    const handleInitialSubmit = jest.fn()
    render(<LoginInitialStep handleInitialSubmit={handleInitialSubmit} />)

    const emailInput = screen.getByRole('textbox', { name: 'Email' })
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByRole('button', { name: 'Login to OpenReview' })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(loginButton)

    expect(handleInitialSubmit).toHaveBeenCalledWith('test@example.com', 'password123')
  })
})
