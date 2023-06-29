import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CodeEditorWidget from '../components/EditorComponents/CodeEditorWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

let codeEditorProps
let onCodeChange

jest.mock('../components/CodeEditor', () => (props) => {
  codeEditorProps(props)
  onCodeChange = props.onChange
  return <span>code editor</span>
})

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...props) => {
    const matchedPath = /("..\/(.*)")/.exec(props[0].toString())
    if (matchedPath) return require(`../components/${matchedPath[2]}`)
    return () => <></>
  },
}))

beforeEach(() => {
  codeEditorProps = jest.fn()
  onCodeChange = null
})

describe('CheckboxWidget', () => {
  test('render non-json editor if type is not json', async () => {
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'nonjson',
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(screen.getByText('code editor'))
      expect(codeEditorProps).toBeCalledWith(expect.objectContaining({ isJson: false }))
    })
  })

  test('render json editor if type is json', async () => {
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(screen.getByText('code editor'))
      expect(codeEditorProps).toBeCalledWith(expect.objectContaining({ isJson: true }))
    })
  })

  test('show error when there is error', async () => {
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
              },
            },
          },
        },
        error: 'some error message',
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(screen.getByText('code editor').parentElement).toHaveAttribute(
        'class',
        expect.stringContaining('invalidValue')
      )
    })
  })

  test('clear error when code is changed', async () => {
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
              },
            },
          },
        },
        error: 'some error message',
        clearError,
        setErrors: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      onCodeChange('some code')
      expect(clearError).toBeCalled()
    })
  })

  test('set error when code is invalid json', async () => {
    const setErrors = jest.fn()
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
              },
            },
          },
        },
        setErrors,
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      onCodeChange('some code')
      expect(setErrors).toBeCalledWith([
        expect.objectContaining({
          message: expect.stringContaining('Reply is not valid JSON'),
        }),
      ])
    })
  })

  test('call onChange when code is valid json', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      onCodeChange(`
      {
        "some": "code"
      }`)
      expect(onChange).toBeCalledWith(expect.objectContaining({ value: { some: 'code' } }))
    })
  })

  test('call onChange when code is cleared', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
              },
            },
          },
        },
        value: 'some invalid code',
        onChange,
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      onCodeChange('')
      expect(onChange).toBeCalledWith(expect.objectContaining({ value: undefined }))
    })
  })
})
