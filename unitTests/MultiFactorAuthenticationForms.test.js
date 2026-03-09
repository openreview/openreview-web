import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import {
  EmailOtpCard,
  EmailSetupDelete,
  Passkey2FACard,
  PasskeyDelete,
  PasskeyForm,
  RecoveryCodeCard,
  RecoveryCodeForm,
  TOTPCard,
  TOTPDelete,
  TOTPSetup,
} from '../app/profile/edit/MultiFactorAuthenticationForms'
import userEvent from '@testing-library/user-event'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../lib/utils', () => ({
  ...jest.requireActual('../lib/utils'),
  arrayBufferToBase64: jest.fn(() => 'some base64'),
  base64ToArrayBuffer: jest.fn(() => new ArrayBuffer(16)),
}))
jest.mock('../components/ExportFile', () => () => <div>export file component</div>)

describe('TOTPCard', () => {
  test('show name and description when not enabled', async () => {
    const props = {
      mfaStatus: {
        methods: ['emailOtp'],
        preferredMethod: 'emailOtp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<TOTPCard {...props} />)

    expect(screen.getByText('Authenticator App')).toBeInTheDocument()
    expect(
      screen.getByText('use an authenticator app to get codes when prompted')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set up' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set as Preferred' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Set up' }))
    expect(props.setMethodToEdit).toHaveBeenCalledWith('totp')
  })

  test('show disabled button when enabled and preferred', async () => {
    const props = {
      mfaStatus: {
        methods: ['emailOtp', 'totp'],
        preferredMethod: 'totp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<TOTPCard {...props} />)

    expect(screen.queryByRole('button', { name: 'Set up' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set as Preferred' })).toBeDisabled() // already preferred

    await userEvent.click(screen.getByRole('button', { name: 'Disable' }))
    expect(props.setMethodToEdit).toHaveBeenCalledWith('totp')
  })

  test('call handleSetPreferred when set as preferred button is clicked', async () => {
    const props = {
      mfaStatus: {
        methods: ['emailOtp', 'totp'],
        preferredMethod: 'emailOtp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<TOTPCard {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Set as Preferred' }))
    expect(props.handleSetPreferred).toHaveBeenCalledWith('totp')
  })
})

describe('EmailOTPCard', () => {
  test('show name and description when not enabled', async () => {
    const props = {
      mfaStatus: {
        methods: ['totp'],
        preferredMethod: 'totp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<EmailOtpCard {...props} />)

    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('get one-time code sent to your email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set as Preferred' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Enable' }))
    expect(props.setMethodToEdit).toHaveBeenCalledWith('emailOtp')
  })

  test('show disabled button when enabled and preferred', async () => {
    const props = {
      mfaStatus: {
        methods: ['emailOtp', 'totp'],
        preferredMethod: 'emailOtp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<EmailOtpCard {...props} />)

    expect(screen.queryByRole('button', { name: 'Set up' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set as Preferred' })).toBeDisabled() // already preferred

    await userEvent.click(screen.getByRole('button', { name: 'Disable' }))
    expect(props.setMethodToEdit).toHaveBeenCalledWith('emailOtp')
  })

  test('call handleSetPreferred when set as preferred button is clicked', async () => {
    const props = {
      mfaStatus: {
        methods: ['emailOtp', 'totp'],
        preferredMethod: 'totp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<EmailOtpCard {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Set as Preferred' }))
    expect(props.handleSetPreferred).toHaveBeenCalledWith('emailOtp')
  })
})

describe('Passkey2FACard', () => {
  test('show name and description when not enabled', async () => {
    const props = {
      mfaStatus: {
        methods: ['totp'],
        preferredMethod: 'totp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<Passkey2FACard {...props} />)

    expect(screen.getByText('Passkey')).toBeInTheDocument()
    expect(screen.getByText('use a passkey to authenticate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set up' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set as Preferred' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Set up' }))
    expect(props.setMethodToEdit).toHaveBeenCalledWith('passkey')
  })

  test('show disabled button when enabled and preferred', async () => {
    const props = {
      mfaStatus: {
        methods: ['passkey', 'totp'],
        preferredMethod: 'passkey',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<Passkey2FACard {...props} />)

    expect(screen.queryByRole('button', { name: 'Set up' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set as Preferred' })).toBeDisabled() // already preferred

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(props.setMethodToEdit).toHaveBeenCalledWith('passkey')
  })

  test('call handleSetPreferred when set as preferred button is clicked', async () => {
    const props = {
      mfaStatus: {
        methods: ['passkey', 'totp'],
        preferredMethod: 'totp',
      },
      setMethodToEdit: jest.fn(),
      handleSetPreferred: jest.fn(),
    }
    render(<Passkey2FACard {...props} />)

    await userEvent.click(screen.getByRole('button', { name: 'Set as Preferred' }))
    expect(props.handleSetPreferred).toHaveBeenCalledWith('passkey')
  })
})

describe('RecoveryCodeCard', () => {
  test('show recovery code left and generate new code button', async () => {
    api.post = jest.fn(() =>
      Promise.resolve({ recoveryCodes: ['code1', 'code2', 'code3', 'code4', 'code5'] })
    )
    const props = {
      mfaStatus: {
        recoveryCodesRemaining: 5,
      },
      setRecoveryCodes: jest.fn(),
    }
    render(<RecoveryCodeCard {...props} />)

    expect(screen.getByText('Recovery Codes')).toBeInTheDocument()
    expect(screen.getByText('5 codes unused')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate New Code' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Generate New Code' }))
    expect(api.post).toHaveBeenCalledWith('/mfa/recovery-codes/regenerate')
    await waitFor(() => {
      expect(props.setRecoveryCodes).toHaveBeenCalledWith([
        'code1',
        'code2',
        'code3',
        'code4',
        'code5',
      ])
    })
  })
})

describe('TOTPSetup', () => {
  test('show qr code, code input and verify button', async () => {
    api.post = jest.fn((path) => {
      switch (path) {
        case '/mfa/setup/totp/init':
          return Promise.resolve({ qrCodeDataUrl: 'qr code data url' })
        case '/mfa/setup/totp/verify':
          return Promise.resolve({ verified: true })
        default:
          break
      }
    })

    const props = {
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<TOTPSetup {...props} />)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/totp/init')
      expect(screen.getByText('Scan the QR Code below')).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAttribute('src', 'qr code data url')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument()
    })
  })

  test('submit verification code when verify button is clicked and fail', async () => {
    global.promptError = jest.fn()
    api.post = jest.fn((path) => {
      switch (path) {
        case '/mfa/setup/totp/init':
          return Promise.resolve({ qrCodeDataUrl: 'qr code data url' })
        case '/mfa/setup/totp/verify':
          return Promise.reject({ message: 'Invalid code' })
        default:
          break
      }
    })

    const props = {
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<TOTPSetup {...props} />)

    const verifyButton = await screen.findByRole('button', { name: 'Verify' })
    expect(verifyButton).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), '123456')
    expect(verifyButton).toBeEnabled()

    await userEvent.click(verifyButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/totp/verify', { code: '123456' })
      expect(global.promptError).toHaveBeenCalledWith('Invalid code')
    })
  })

  test('submit verification code when verify button is clicked and load mfa status', async () => {
    global.promptMessage = jest.fn()
    api.post = jest.fn((path) => {
      switch (path) {
        case '/mfa/setup/totp/init':
          return Promise.resolve({ qrCodeDataUrl: 'qr code data url' })
        case '/mfa/setup/totp/verify':
          return Promise.resolve({
            recoveryCodes: ['code1', 'code2', 'code3', 'code4', 'code5'],
          })
        default:
          break
      }
    })

    const props = {
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<TOTPSetup {...props} />)

    const verifyButton = await screen.findByRole('button', { name: 'Verify' })
    expect(verifyButton).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), '123456')
    expect(verifyButton).toBeEnabled()

    await userEvent.click(verifyButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/totp/verify', { code: '123456' })
      expect(global.promptMessage).toHaveBeenCalledWith('TOTP setup successful')
      expect(props.setRecoveryCodes).toHaveBeenCalledWith([
        'code1',
        'code2',
        'code3',
        'code4',
        'code5',
      ])
      expect(props.loadMFAStatus).toHaveBeenCalled()
    })
  })
})

describe('TOTPDelete', () => {
  test('call api to delete totp then reload mfa status', async () => {
    const loadMFAStatus = jest.fn()
    api.delete = jest.fn(() => Promise.resolve())

    render(<TOTPDelete loadMFAStatus={loadMFAStatus} />)

    expect(screen.getByText('Are you sure you want to disable TOTP?')).toBeInTheDocument()
    const disableButton = screen.getByRole('button', { name: 'Disable Authenticator App' })
    expect(disableButton).toBeInTheDocument()

    await userEvent.click(disableButton)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/mfa/totp')
      expect(loadMFAStatus).toHaveBeenCalled()
    })
  })
})

describe('EmailSetupDelete', () => {
  test('call api to setup email otp and update recovery codes when email is the first method', async () => {
    api.post = jest.fn(() => Promise.resolve({ recoveryCodes: ['code1', 'code2'] }))
    global.promptMessage = jest.fn()
    const props = {
      mfaStatus: {
        methods: [],
      },
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<EmailSetupDelete {...props} />)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/email')
      expect(props.setRecoveryCodes).toHaveBeenCalledWith(['code1', 'code2'])
      expect(props.loadMFAStatus).toHaveBeenCalled()
      expect(global.promptMessage).toHaveBeenCalledWith('Email OTP setup successful')
    })
  })

  test('call api to setup email otp when it is not the first method', async () => {
    api.post = jest.fn(() => Promise.resolve())
    global.promptMessage = jest.fn()
    const props = {
      mfaStatus: {
        methods: ['totp'],
      },
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<EmailSetupDelete {...props} />)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/email')
      expect(props.setRecoveryCodes).not.toHaveBeenCalled()
      expect(props.loadMFAStatus).toHaveBeenCalled()
    })
  })

  test('call api to disable email otp when it is enabled', async () => {
    api.delete = jest.fn(() => Promise.resolve())
    global.promptMessage = jest.fn()
    const props = {
      mfaStatus: {
        methods: ['emailOtp'],
      },
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<EmailSetupDelete {...props} />)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/mfa/email')
      expect(props.loadMFAStatus).toHaveBeenCalled()
      expect(global.promptMessage).toHaveBeenCalledWith('Email OTP is disabled')
    })
  })
})

describe('PasskeyForm', () => {
  test('show key name input and add passkey button', async () => {
    const props = {
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<PasskeyForm {...props} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Passkey' })).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), 'some key name')
    expect(screen.getByRole('button', { name: 'Add Passkey' })).toBeEnabled()
  })

  test('call api to add passkey and load mfa status', async () => {
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        create: jest.fn().mockResolvedValue({
          id: 'some id',
          rawId: new ArrayBuffer(16),
          response: {
            clientDataJSON: new ArrayBuffer(16),
            authenticatorData: new ArrayBuffer(16),
            attestationObject: new ArrayBuffer(16),
          },
          type: 'public-key',
        }),
      },
    })
    api.post = jest.fn((path) => {
      switch (path) {
        case '/mfa/setup/passkey/init':
          return Promise.resolve({
            challenge: 'some challenge',
            rp: { name: 'some rp' },
            user: {
              id: 'some user id',
              name: 'some user name',
              displayName: 'some display name',
            },
          })
        case '/mfa/setup/passkey/verify':
          return Promise.resolve({
            recoveryCodes: ['code1', 'code2', 'code3', 'code4', 'code5'],
          })
        default:
          break
      }
    })
    global.promptMessage = jest.fn()

    const props = {
      loadMFAStatus: jest.fn(),
      setRecoveryCodes: jest.fn(),
    }
    render(<PasskeyForm {...props} />)

    await userEvent.type(screen.getByRole('textbox'), 'some key name')
    await userEvent.click(screen.getByRole('button', { name: 'Add Passkey' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/passkey/init')
      expect(navigator.credentials.create).toHaveBeenCalled()
      expect(api.post).toHaveBeenCalledWith('/mfa/setup/passkey/verify', {
        response: expect.any(Object),
        name: 'some key name',
      })
      expect(global.promptMessage).toHaveBeenCalledWith('Passkey added successfully')
      expect(props.setRecoveryCodes).toHaveBeenCalledWith([
        'code1',
        'code2',
        'code3',
        'code4',
        'code5',
      ])
      expect(props.loadMFAStatus).toHaveBeenCalled()
    })
  })
})

describe('PasskeyDelete', () => {
  test('show empty table when there is no passkey', async () => {
    api.get = jest.fn(() => Promise.resolve({ passKeys: [] }))
    render(<PasskeyDelete />)

    expect(screen.getByText('No passkeys configured yet.')).toBeInTheDocument()
    expect(screen.getByText('Add a new passkey')).toBeInTheDocument()

    // contains a passkeyForm component to add new passkey
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Passkey' })).toBeInTheDocument()
  })

  test('show existing passkeys', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        passkeys: [{ name: 'some key name', credentialId: 'some id', createdAt: undefined }],
      })
    )
    render(<PasskeyDelete />)

    await waitFor(() => {
      expect(screen.getByText('some key name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    // contains a passkeyForm component to add new passkey
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Passkey' })).toBeInTheDocument()
  })

  test('call api to delete passkey', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        passkeys: [{ name: 'some key name', credentialId: 'some id', createdAt: undefined }],
      })
    )
    api.delete = jest.fn(() => Promise.resolve())
    render(<PasskeyDelete />)

    await waitFor(() => {
      userEvent.click(screen.getByRole('button', { name: 'Delete' }))
      expect(api.delete).toHaveBeenCalledWith('/mfa/passkeys/some id')
      expect(api.get).toHaveBeenCalledTimes(2) // called once on load and once after delete to reload passkeys
    })
  })

  test('reload status when all passkeys are deleted', async () => {
    let deleted = false

    api.get = jest.fn(() =>
      Promise.resolve({
        passkeys: deleted
          ? []
          : [{ name: 'some key name', credentialId: 'some id', createdAt: undefined }],
      })
    )

    api.delete = jest.fn(() => {
      deleted = true
      return Promise.resolve()
    })
    global.promptMessage = jest.fn()
    const loadMFAStatus = jest.fn()
    render(<PasskeyDelete loadMFAStatus={loadMFAStatus} />)

    await waitFor(() => {
      userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    })

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/mfa/passkeys/some id')
      expect(loadMFAStatus).toHaveBeenCalled()
      expect(global.promptMessage).toHaveBeenCalledWith('All Passkeys are deleted')
    })
  })
})

describe('RecoveryCodeForm', () => {
  test('show recovery codes , download button and copy button', async () => {
    const recoveryCodes = ['code1', 'code2', 'code3', 'code4', 'code5']
    render(<RecoveryCodeForm recoveryCodes={recoveryCodes} />)

    expect(
      screen.getByText('hese recovery codes will not be shown again.', { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByText('export file component')).toBeInTheDocument()
    expect(screen.getByText('code1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy to Clipboard' })).toBeInTheDocument()
  })
})
