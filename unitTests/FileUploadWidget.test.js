import FileUploadWidget from '../components/EditorComponents/FileUploadWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

jest.mock('../hooks/useUser', () => {
  return () => ({ user: {} })
})

describe('FileUploadWidget', () => {
  test('render header', () => {
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
    expect(screen.getByText('* Supplementary Material'))
  })

  test('render pdf field as all capital', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['pdf']: {
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
    expect(screen.getByText('* PDF'))
  })

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

  test.only('upload file selected', () => {
    const apiPut = jest.fn()
    jest.mock('../lib/api-client', () => {
      return () => {
        put: apiPut
      }
    })
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
      },
    }
    renderWithEditorComponentContext(<FileUploadWidget />, providerProps)

    const fileInput = screen.getByLabelText('supplementary_material')
    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' })
    userEvent.upload(fileInput, file)
    console.log(prettyDOM(fileInput))
    expect(apiPut).toBeCalled()
  })
})
