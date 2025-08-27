import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import FileUploadWidget from '../components/EditorComponents/FileUploadWidget'
import api from '../lib/api-client'
import { renderWithEditorComponentContext } from './util'

jest.mock('../lib/api-client')
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({ user: {}, accessToken: 'some token' }))

describe('FileUploadWidget', () => {
  test('display choose file button', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitationId' },
        field: {
          supplementary_material: {
            value: {
              param: {
                type: 'file',
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)
    expect(screen.getByText('Choose Supplementary Material')).toBeInTheDocument()
  })

  test('display link of existing file', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitationId' },
        field: {
          supplementary_material: {
            value: {
              param: {
                type: 'file',
              },
            },
          },
        },
        value: '/attachment/ffbec464c347b27a8f6a8afdc2a68b9476ee5a1e.zip',
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)
    expect(
      screen.getByText('/attachment/ffbec464c347b27a8f6a8afdc2a68b9476ee5a1e.zip', {
        exact: false,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'trash' })).toBeInTheDocument()
  })

  test('upload the file user selected', async () => {
    const apiPut = jest.fn(() => Promise.resolve({ url: 'test url' }))
    const onChange = jest.fn()
    const clearError = jest.fn()
    api.put = apiPut

    const providerProps = {
      value: {
        invitation: { id: 'invitationId' },
        field: {
          supplementary_material: {
            value: {
              param: {
                type: 'file',
                extensions: ['pdf', 'zip'],
                maxSize: 1,
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)

    const fileInput = screen.getByLabelText('supplementary_material')
    const file = new File(['some byte string'], 'supplementary_material.pdf', {
      type: 'application/pdf',
    })
    await userEvent.upload(fileInput, file)

    expect(apiPut).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'test url' }))
    expect(clearError).toHaveBeenCalled()
  })

  test('not to upload file when rendered in preview', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    api.put = jest.fn()

    const providerProps = {
      value: {
        invitation: { id: 'invitationId' },
        field: {
          supplementary_material: {
            value: {
              param: {
                type: 'file',
                extensions: ['pdf', 'zip'],
                maxSize: 1,
              },
            },
          },
        },
        onChange,
        clearError,
        noteEditorPreview: true,
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)

    const fileInput = screen.getByLabelText('supplementary_material')
    const file = new File(['some byte string'], 'supplementary_material.pdf', {
      type: 'application/pdf',
    })
    await userEvent.upload(fileInput, file)

    expect(api.put).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'preview url' }))
    expect(clearError).toHaveBeenCalled()
  })

  test('show File too large when selected file is too large', async () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const providerProps = {
      value: {
        invitation: { id: 'invitationId' },
        field: {
          supplementary_material: {
            value: {
              param: {
                type: 'file',
                extensions: ['pdf', 'zip'],
                maxSize: 10,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)

    const fileInput = screen.getByLabelText('supplementary_material')
    const file = new File(['some byte string'], 'supplementary_material.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(file, 'size', { value: 1024 * 1000 * 10 + 1 })
    await userEvent.upload(fileInput, file)

    expect(promptError).toHaveBeenCalledWith(
      expect.stringContaining('File is too large.'),
      expect.anything()
    )
  })

  test('clear value when user delete file', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitationId' },
        field: {
          supplementary_material: {
            value: {
              param: {
                type: 'file',
              },
            },
          },
        },
        value: '/attachment/ffbec464c347b27a8f6a8afdc2a68b9476ee5a1e.zip',
        onChange,
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)

    const trashButton = screen.getByRole('button', { name: 'trash' })
    await userEvent.click(trashButton)

    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'supplementary_material',
      value: undefined,
    })
  })
})
