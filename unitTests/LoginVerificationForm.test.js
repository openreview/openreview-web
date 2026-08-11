import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {
  EmailVerificationForm,
  PasskeyVerificationForm,
  RecoveryCodeVerificationForm,
  TOTPVerificationForm,
} from '../app/login/VerificationForm'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../lib/utils', () => ({
  ...jest.requireActual('../lib/utils'),
  base64ToArrayBuffer: jest.fn(() => new ArrayBuffer(16)),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('TOTPVerificationForm', () => {
  test('show code input, remember device checkbox and verify button', () => {
    const completeLogin = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError: jest.fn(),
    }

    render(<TOTPVerificationForm {...props} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument()
  })

  test('call api when verify button is clicked', async () => {
    api.post = jest.fn(() => Promise.reject(new Error('Invalid code')))
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }

    render(<TOTPVerificationForm {...props} />)

    const verifyButton = screen.getByRole('button', { name: 'Verify' })
    const codeInput = screen.getByRole('textbox')

    expect(verifyButton).toBeDisabled()

    await userEvent.type(codeInput, '12345')
    expect(verifyButton).toBeEnabled()

    await userEvent.click(verifyButton)
    expect(api.post).toHaveBeenCalledWith('/mfa/verify', {
      mfaPendingToken: 'some token',
      method: 'totp',
      code: '12345',
      rememberDevice: false,
    })
    expect(completeLogin).not.toHaveBeenCalled()
    expect(setError).toHaveBeenCalledWith('Invalid code')
  })

  test('auto submit when verification code is completed', async () => {
    api.post = jest.fn(() => Promise.resolve())
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }

    render(<TOTPVerificationForm {...props} />)

    const verifyButton = screen.getByRole('button', { name: 'Verify' })
    const codeInput = screen.getByRole('textbox')

    expect(verifyButton).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.type(codeInput, '123456')

    expect(api.post).toHaveBeenCalledWith('/mfa/verify', {
      mfaPendingToken: 'some token',
      method: 'totp',
      code: '123456',
      rememberDevice: true,
    })
    expect(completeLogin).toHaveBeenCalled()
    expect(setError).not.toHaveBeenCalled()
  })
})

describe('EmailVerificationForm', () => {
  test('show request code button', async () => {
    api.post = jest.fn(() => Promise.reject(new Error('Challenge request failed')))
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<EmailVerificationForm {...props} />)

    expect(
      screen.getByRole('button', { name: 'Send verification code to email' })
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(api.post).toHaveBeenCalledWith('/mfa/challenge', {
      mfaPendingToken: 'some token',
      method: 'emailOtp',
    })
    expect(setError).toHaveBeenCalledWith('Challenge request failed')
  })

  test('show verification code input, remember device checkbox, verify button and resend link after requesting challenge', async () => {
    api.post = jest.fn(() => Promise.resolve())
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<EmailVerificationForm {...props} />)

    expect(
      screen.getByRole('button', { name: 'Send verification code to email' })
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(api.post).toHaveBeenCalledWith('/mfa/challenge', {
      mfaPendingToken: 'some token',
      method: 'emailOtp',
    })

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend Code' })).toBeInTheDocument()
  })

  test('auto submit when verification code is completed', async () => {
    api.post = jest.fn(() => Promise.resolve())
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<EmailVerificationForm {...props} />)

    await userEvent.click(screen.getByRole('button'))

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.type(screen.getByRole('textbox'), '123456')

    expect(api.post).toHaveBeenCalledWith('/mfa/verify', {
      mfaPendingToken: 'some token',
      method: 'emailOtp',
      code: '123456',
      rememberDevice: true,
    })
    expect(completeLogin).toHaveBeenCalled()
    expect(setError).not.toHaveBeenCalled()
  })

  test('request a new challenge when resend Code is clicked', async () => {
    api.post = jest.fn(() => Promise.resolve())
    global.promptMessage = jest.fn()
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<EmailVerificationForm {...props} />)

    await userEvent.click(screen.getByRole('button'))

    await userEvent.click(screen.getByRole('button', { name: 'Resend Code' }))

    expect(api.post).toHaveBeenCalledTimes(2)
    expect(global.promptMessage).toHaveBeenCalledWith(
      'Another verification code has been sent to your email. Any codes you received previously are now invalid.'
    )
  })
})

describe('PasskeyVerificationForm', () => {
  test('show remember device checkbox and continue button', () => {
    api.post = jest.fn(() => Promise.resolve())
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<PasskeyVerificationForm {...props} />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  test('request challenge, get credential and verify when continue button is clicked', async () => {
    api.post = jest.fn((path) => {
      switch (path) {
        case '/mfa/challenge':
          return Promise.resolve({
            allowCredentials: [
              {
                id: 'some credential id',
                type: 'public-key',
              },
            ],
            challenge: 'some challenge',
          })
        case '/mfa/verify':
          return Promise.resolve()
        default:
          break
      }
    })
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        get: jest.fn().mockResolvedValue({
          response: {
            clientDataJSON: new ArrayBuffer(16),
            authenticatorData: new ArrayBuffer(16),
            signature: new ArrayBuffer(16),
          },
        }),
      },
    })
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<PasskeyVerificationForm {...props} />)

    userEvent.click(screen.getByRole('checkbox'))
    userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenNthCalledWith(1, '/mfa/challenge', {
        mfaPendingToken: 'some token',
        method: 'passkey',
      })
      expect(navigator.credentials.get).toHaveBeenCalledWith({
        publicKey: expect.objectContaining({
          challenge: expect.any(ArrayBuffer),
        }),
      })
      expect(api.post).toHaveBeenNthCalledWith(2, '/mfa/verify', {
        mfaPendingToken: 'some token',
        method: 'passkey',
        code: expect.anything(),
        rememberDevice: true,
      })
    })
  })
})

describe('RecoveryCodeVerificationForm', () => {
  test('show recovery code input, remember device checkbox and verify button', () => {
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<RecoveryCodeVerificationForm {...props} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument()
  })

  test('show error when verification code is wrong', async () => {
    api.post = jest.fn(() => Promise.reject(new Error('Invalid recovery code')))
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<RecoveryCodeVerificationForm {...props} />)

    await userEvent.type(screen.getByRole('textbox'), 'wrong-code')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))

    expect(api.post).toHaveBeenCalledWith('/mfa/verify', {
      mfaPendingToken: 'some token',
      method: 'recovery',
      code: 'wrong-code',
      rememberDevice: true,
    })
    expect(completeLogin).not.toHaveBeenCalled()
    expect(setError).toHaveBeenCalledWith('Invalid recovery code')
  })

  test('complete login when recovery code is correct', async () => {
    api.post = jest.fn(() => Promise.resolve())
    const completeLogin = jest.fn()
    const setError = jest.fn()
    const props = {
      mfaPendingToken: 'some token',
      completeLogin,
      setError,
    }
    render(<RecoveryCodeVerificationForm {...props} />)

    await userEvent.type(screen.getByRole('textbox'), 'correct-code')
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))

    expect(api.post).toHaveBeenCalledWith('/mfa/verify', {
      mfaPendingToken: 'some token',
      method: 'recovery',
      code: 'correct-code',
      rememberDevice: false,
    })
    expect(completeLogin).toHaveBeenCalled()
    expect(setError).not.toHaveBeenCalled()
  })
})
