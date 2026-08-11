import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LoginMFAStep from '../app/login/LoginMFAStep'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../app/login/VerificationForm', () => ({
  EmailVerificationForm: jest.fn(() => <div>EmailVerificationForm</div>),
  TOTPVerificationForm: jest.fn(() => <div>TOTPVerificationForm</div>),
  PasskeyVerificationForm: jest.fn(() => <div>PasskeyVerificationForm</div>),
  RecoveryCodeVerificationForm: jest.fn(() => <div>RecoveryCodeVerificationForm</div>),
}))

describe('LoginMFAStep', () => {
  test('show totp verification form', () => {
    const mfaStatus = {
      mfaMethods: ['totp', 'emailOtp', 'passkey'],
      mfaPending: true,
      mfaPendingToken: 'some token',
      preferredMethod: 'totp',
    }
    render(<LoginMFAStep mfaStatus={mfaStatus} />)

    expect(
      screen.getByText('Enter the 6-digit code from your authenticator app.')
    ).toBeInTheDocument() // description
    expect(screen.getByText('TOTPVerificationForm')).toBeInTheDocument() // form
    // alternative methods
    expect(screen.getByRole('button', { name: 'Log in using Email OTP' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in using Passkey' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Log in using Recovery Code' })
    ).toBeInTheDocument()
  })

  test('show email verification form', () => {
    const mfaStatus = {
      mfaMethods: ['emailOtp', 'passkey'],
      mfaPending: true,
      mfaPendingToken: 'some token',
      preferredMethod: 'emailOtp',
    }
    render(<LoginMFAStep mfaStatus={mfaStatus} />)

    expect(
      screen.getByText('Enter the 6-digit code sent to your email address.', { exact: false })
    ).toBeInTheDocument() // description
    expect(screen.getByText('EmailVerificationForm')).toBeInTheDocument() // form
    // alternative methods
    expect(
      screen.queryByRole('button', { name: 'Log in using Authenticator App' })
    ).not.toBeInTheDocument() // not available
    expect(
      screen.queryByRole('button', { name: 'Log in using Email OTP' })
    ).not.toBeInTheDocument() // already showing in form
    expect(screen.getByRole('button', { name: 'Log in using Passkey' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Log in using Recovery Code' })
    ).toBeInTheDocument()
  })

  test('show passkey verification form', () => {
    const mfaStatus = {
      mfaMethods: ['passkey'],
      mfaPending: true,
      mfaPendingToken: 'some token',
      preferredMethod: 'passkey',
    }
    render(<LoginMFAStep mfaStatus={mfaStatus} />)

    expect(
      screen.getByText('Verify using your passkey (Touch ID or Face ID).')
    ).toBeInTheDocument() // description
    expect(screen.getByText('PasskeyVerificationForm')).toBeInTheDocument() // form
    // alternative methods
    expect(
      screen.queryByRole('button', { name: 'Log in using Authenticator App' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Log in using Email OTP' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Log in using Passkey' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Log in using Recovery Code' })
    ).toBeInTheDocument()
  })

  test('switch form when switch login verification', async () => {
    const mfaStatus = {
      mfaMethods: ['totp', 'emailOtp', 'passkey'],
      mfaPending: true,
      mfaPendingToken: 'some token',
      preferredMethod: 'totp',
    }
    render(<LoginMFAStep mfaStatus={mfaStatus} />)

    expect(
      screen.getByText('Enter the 6-digit code from your authenticator app.')
    ).toBeInTheDocument()
    expect(screen.getByText('TOTPVerificationForm')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log in using Email OTP' }))
    expect(
      screen.getByText('Enter the 6-digit code sent to your email address.', { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByText('EmailVerificationForm')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log in using Passkey' }))
    expect(
      screen.getByText('Verify using your passkey (Touch ID or Face ID).')
    ).toBeInTheDocument()
    expect(screen.getByText('PasskeyVerificationForm')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log in using Recovery Code' }))
    expect(
      screen.getByText(
        'If you are unable to use your authenticator app or email OTP, enter one of your recovery codes.',
        { exact: false }
      )
    ).toBeInTheDocument()
    expect(screen.getByText('RecoveryCodeVerificationForm')).toBeInTheDocument()
  })
})
