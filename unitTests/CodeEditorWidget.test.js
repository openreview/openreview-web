import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CodeEditorWidget from '../components/EditorComponents/CodeEditorWidget'
import { renderWithEditorComponentContext } from './util'

let codeEditorProps
let onCodeChange

jest.mock('../components/CodeEditor', () => (props) => {
  codeEditorProps(props)
  onCodeChange = props.onChange
  return <span>code editor</span>
})

jest.mock('../components/EditorComponents/CodeEditorPreviewWidget', () => (props) => (
  <span>CodeEditorPreviewWidget</span>
))

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

describe('CodeEditorWidget', () => {
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
      expect(screen.getByText('code editor')).toBeInTheDocument()
      expect(codeEditorProps).toHaveBeenCalledWith(expect.objectContaining({ isJson: false }))
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
      expect(screen.getByText('code editor')).toBeInTheDocument()
      expect(codeEditorProps).toHaveBeenCalledWith(expect.objectContaining({ isJson: true }))
    })
  })

  test('render json editor if type is content', async () => {
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'content',
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(screen.getByText('code editor')).toBeInTheDocument()
      expect(codeEditorProps).toHaveBeenCalledWith(expect.objectContaining({ isJson: true }))
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
      expect(clearError).toHaveBeenCalled()
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
      expect(setErrors).toHaveBeenCalledWith([
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
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: { some: 'code' } })
      )
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
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
    })
  })

  test('call onChange when there is default value', async () => {
    const onChange = jest.fn()
    const defaultValue = {
      'ICML.cc/2023/Conference/Area_Chairs/-/Bid': {
        weight: 1,
        default: 0,
        translate_map: {
          'Very High': 1,
          High: 0.5,
          Neutral: 0,
          Low: -0.5,
          'Very Low': -1,
        },
      },
    }
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
                default: defaultValue,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: defaultValue }))
    })
  })

  test('not to call onChange when note does not have this field even if there is default value', async () => {
    const onChange = jest.fn()
    const defaultValue = {
      'ICML.cc/2023/Conference/Area_Chairs/-/Bid': {
        weight: 1,
        default: 0,
        translate_map: {
          'Very High': 1,
          High: 0.5,
          Neutral: 0,
          Low: -0.5,
          'Very Low': -1,
        },
      },
    }
    const providerProps = {
      value: {
        field: {
          setting: {
            value: {
              param: {
                type: 'json',
                default: defaultValue,
              },
            },
          },
        },
        onChange,
        value: undefined,
        note: {
          id: 'test',
          content: {
            setting: undefined,
          },
        },
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  test('render code editor with preview widget when field is web', async () => {
    const providerProps = {
      value: {
        field: {
          web: {
            value: {
              param: {
                type: 'script',
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CodeEditorWidget />, providerProps)
    await waitFor(() => {
      expect(screen.getByText('CodeEditorPreviewWidget')).toBeInTheDocument()
    })
  })
})
