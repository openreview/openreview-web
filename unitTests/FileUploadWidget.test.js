import FileUploadWidget from '../components/EditorComponents/FileUploadWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

jest.mock('../lib/api-client')
import api from '../lib/api-client'
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => {
  return () => ({ user: {}, accessToken: 'some token' })
})

describe('FileUploadWidget', () => {
  test('display choose file button', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['supplementary_material']: {
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
    expect(screen.getByText('Choose Supplementary Material'))
  })

  test('display link of existing file', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['supplementary_material']: {
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
    )
    expect(screen.getByRole('button', { name: '' })) // trash button
  })

  test('upload the file user selected', async () => {
    const apiPut = jest.fn(() => Promise.resolve({ url: 'test url' }))
    const onChange = jest.fn()
    api.put = apiPut

    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['supplementary_material']: {
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
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)

    const fileInput = screen.getByLabelText('supplementary_material')
    const file = new File(['some byte string'], 'supplementary_material.pdf', {
      type: 'application/pdf',
    })
    await userEvent.upload(fileInput, file)

    expect(apiPut).toBeCalled()
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'test url' }))
  })

  test('show File too large when selected file is too large', async () => {
    const promptError = jest.fn()
    global.promptError = promptError

    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['supplementary_material']: {
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
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['supplementary_material']: {
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

    const trashButton = screen.getByRole('button', { name: '' })
    await userEvent.click(trashButton)

    expect(onChange).toBeCalledWith({ fieldName: 'supplementary_material', value: null })
  })
})
