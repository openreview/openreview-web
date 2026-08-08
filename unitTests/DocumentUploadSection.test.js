import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentUploadSection from '../components/profile/DocumentUploadSection'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('../lib/api-client')
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useTurnstileToken', () => () => ({}))
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => 'test activation token',
  }),
}))

const selectFiles = (container, files) => {
  const fileInput = container.querySelector('input[type="file"]')
  fireEvent.change(fileInput, { target: { files } })
}

const makeFile = (name) => new File(['bytes'], name, { type: 'application/pdf' })

beforeEach(() => {
  global.promptError = jest.fn()
  api.put = jest.fn(() => Promise.resolve({ url: '/attachment/hash' }))
  api.post = jest.fn(() => Promise.resolve({ uploadToken: 'upload-token' }))
})

describe('DocumentUploadSection', () => {
  test('does not upload until the upload button is clicked', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )

    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [makeFile('id.pdf')])

    await waitFor(() => {
      expect(screen.getByText('id.pdf')).toBeInTheDocument()
    })
    expect(api.put).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }))

    await waitFor(() => {
      expect(updateDocuments).toHaveBeenCalledWith(['/attachment/hash'])
    })
    expect(api.put).toHaveBeenCalledTimes(1)
  })

  test('limits the number of files to the number specified in invitation (2 in mock invitation)', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')])

    await waitFor(() => {
      expect(screen.getByText('b.pdf')).toBeInTheDocument()
    })
    expect(screen.queryByText('c.pdf')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Upload 2 files' }))

    await waitFor(() => {
      expect(updateDocuments).toHaveBeenCalledWith(['/attachment/hash', '/attachment/hash'])
    })
    expect(api.put).toHaveBeenCalledTimes(2)
    expect(updateDocuments.mock.calls.every(([value]) => value.length <= 2)).toBe(true)
  })

  test('rejects a file that is larger than the specified size in invitation (1mb in test invitaiton)', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    const file = makeFile('big.pdf')
    Object.defineProperty(file, 'size', { value: 1024 * 1000 * 1 + 1 })

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [file])

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith(
        expect.stringContaining('File is too large.')
      )
    })
    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })

  test('rejects a file whose type is not in the accepted extensions in invitation (pdf, jpg in test invitation)', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [makeFile('test.bat')])

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith(
        expect.stringContaining('File type not allowed.')
      )
    })
    expect(screen.queryByText('test.bat')).not.toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  test('marks pending files as failed when the upload token cannot be obtained', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    api.post = jest.fn(() => Promise.resolve({})) // response without an uploadToken
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [makeFile('id.pdf')])

    await waitFor(() => {
      expect(screen.getByText('id.pdf')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }))

    await waitFor(() => {
      expect(global.promptError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get upload token')
      )
    })
    expect(screen.getByText('Upload failed')).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  test('marks a file as failed when its upload request fails', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    api.put = jest.fn(() => Promise.reject(new Error('Something went wrong')))
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [makeFile('id.pdf')])

    await waitFor(() => {
      expect(screen.getByText('id.pdf')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }))

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'trash' })).toBeInTheDocument()
    expect(updateDocuments).not.toHaveBeenCalledWith(['/attachment/hash'])
  })

  test('removes a file locally without any api call', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = []
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByRole('button', { name: 'Select files' })
    selectFiles(container, [makeFile('id.pdf')])

    await waitFor(() => {
      expect(screen.getByText('id.pdf')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'trash' }))

    await waitFor(() => {
      expect(screen.queryByText('id.pdf')).not.toBeInTheDocument()
    })
    expect(api.put).not.toHaveBeenCalled()
  })

  test('show existing files user uploaded in previous registration attempts', async () => {
    const updateDocuments = jest.fn()
    const profileDocuments = ['/attachment/hash1', '/attachment/hash2'] // already reached max items in previous registration
    api.getInvitationById = jest.fn(() =>
      Promise.resolve({
        edit: {
          profile: {
            content: {
              identityDocuments: {
                value: {
                  param: {
                    extensions: ['pdf', 'jpg'],
                    maxSize: 1,
                    maxItems: 2,
                  },
                },
              },
            },
          },
        },
      })
    )
    const { container } = render(
      <DocumentUploadSection
        profileDocuments={profileDocuments}
        updateDocuments={updateDocuments}
      />
    )

    await screen.findByText('/attachment/hash1')
    await screen.findByText('/attachment/hash2')

    expect(screen.getByRole('button', { name: 'Select files' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })
})
