import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MultiFactorAuthenticationSetup from '../app/profile/password-security/MultiFactorAuthenticationSetup'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/LoadingSpinner', () => () => <span>loading spinner</span>)
jest.mock('../app/profile/password-security/MultiFactorAuthenticationForms', () => ({
  TOTPCard: jest.fn(() => <div>totp card</div>),
  Passkey2FACard: jest.fn(() => <div>passkey card</div>),
  EmailOtpCard: jest.fn(() => <div>email otp card</div>),
  TOTPSetup: jest.fn(() => <div>totp setup</div>),
  EmailSetupDelete: jest.fn(() => <div>email setup delete</div>),
  PasskeySetup: jest.fn(() => <div>passkey setup</div>),
  RecoveryCodeCard: jest.fn(() => <div>recovery code card</div>),
}))

describe('MultiFactorAuthenticationSetup', () => {
  test('load mfa status on initial rendering', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        enabled: false,
        methods: [],
        preferredMethod: null,
        recoveryCodesRemaining: 0,
        trustedDevicesCount: 0,
      })
    )

    render(<MultiFactorAuthenticationSetup />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/mfa/status')
      expect(
        screen.getByText(
          'Multi-Factor Authentication is currently disabled. Please configure below.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('totp card')).toBeInTheDocument()
      expect(screen.getByText('passkey card')).toBeInTheDocument()
      expect(screen.getByText('email otp card')).toBeInTheDocument()
    })
  })

  test('show recovery code card when mfa is enabled', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        enabled: true,
        methods: ['totp', 'passkey', 'email'],
        preferredMethod: 'totp',
        recoveryCodesRemaining: 10,
        trustedDevicesCount: 0,
      })
    )

    render(<MultiFactorAuthenticationSetup />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/mfa/status')
      expect(
        screen.queryByText(
          'Multi-Factor Authentication is currently disabled. Please configure below.'
        )
      ).not.toBeInTheDocument()

      expect(screen.getByText('totp card')).toBeInTheDocument()
      expect(screen.getByText('passkey card')).toBeInTheDocument()
      expect(screen.getByText('email otp card')).toBeInTheDocument()
      expect(screen.getByText('recovery code card')).toBeInTheDocument()
    })
  })
})
