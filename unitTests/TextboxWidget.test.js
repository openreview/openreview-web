import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextboxWidget from '../components/EditorComponents/TextboxWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

jest.mock('../hooks/useUser', () => () => ({ user: {} }))
jest.mock('../lib/utils', () => {
  const original = jest.requireActual('../lib/utils')
  return {
    ...original,
    getAutoStorageKey: jest.fn(() => 'some key'),
  }
})

describe('TextboxWidget', () => {
  test('render input as readonly when invitation field value is a const string/string[]', () => {
    let providerProps = {
      value: {
        field: {
          venue: {
            value: {
              param: {
                const: 'ICML Conf Submission',
              },
            },
          },
        },
      },
    }
    const { rerender } = renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')

    providerProps = {
      value: {
        field: {
          keywords: {
            value: {
              param: {
                const: ['keyword one', 'keyword two', 'keyword three'],
              },
            },
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('keyword one,keyword two,keyword three')).toHaveAttribute(
      'readonly'
    )

    providerProps = {
      value: {
        field: {
          venue: {
            value: 'ICML Conf Submission',
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')

    providerProps = {
      value: {
        field: {
          keywords: {
            value: ['keyword one', 'keyword two', 'keyword three'],
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('keyword one,keyword two,keyword three')).toHaveAttribute(
      'readonly'
    )

    providerProps = {
      value: {
        field: {
          venue: 'ICML Conf Submission',
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')

    providerProps = {
      value: {
        field: {
          keywords: ['keyword one', 'keyword two', 'keyword three'],
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('keyword one,keyword two,keyword three')).toHaveAttribute(
      'readonly'
    )
  })

  test('show empty input if no existing value', () => {
    const providerProps = {
      value: {
        field: {
          paper_title: {},
        },
        value: undefined,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue(''))
  })

  test('show default value and invoke onChange if there is default value (string)', () => {
    const onChange = jest.fn()
    const defaultValue = 'default paper title'
    const providerProps = {
      value: {
        field: {
          paper_title: {
            value: {
              param: { type: 'string', regex: '.{1,250}', default: defaultValue },
            },
          },
        },
        value: undefined,
        onChange,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('show default value and invoke onChange if there is default value (string[])', () => {
    const onChange = jest.fn()
    const defaultValue = ['keyword one', 'keyword two', 'keyword three']
    const providerProps = {
      value: {
        field: {
          keywords: {
            value: {
              param: {
                type: 'string[]',
                default: defaultValue,
              },
            },
          },
        },
        value: undefined,
        onChange,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('not to show default value and invoke onChange editing existing note', () => {
    const onChange = jest.fn()
    const defaultValue = 'default paper title'
    const providerProps = {
      value: {
        field: {
          paper_title: {
            value: {
              param: { type: 'string', regex: '.{1,250}', default: defaultValue },
            },
          },
        },
        value: undefined,
        onChange,
        note: {
          id: 'test',
          content: {
            paper_title: undefined,
          },
        },
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)

    expect(onChange).not.toBeCalled()
  })

  test('show default value and invoke onChange editing existing note)', () => {
    const onChange = jest.fn()
    const defaultValue = ['keyword one', 'keyword two', 'keyword three']
    const providerProps = {
      value: {
        field: {
          keywords: {
            value: {
              param: {
                type: 'string[]',
                default: defaultValue,
              },
            },
          },
        },
        value: undefined,
        onChange,
        note: {
          id: 'test',
          content: {
            keywords: undefined,
          },
        },
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)

    expect(onChange).not.toBeCalled()
  })

  test('show note value if string value exists (editing a note)', () => {
    const providerProps = {
      value: {
        field: {
          paper_title: {},
        },
        value: 'some existing value',
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('some existing value'))
  })

  test('show note value if string array value exists (editing a note)', () => {
    const providerProps = {
      value: {
        field: {
          keywords: {
            value: {
              param: {
                type: 'string[]',
              },
            },
          },
        },
        value: ['keyword one', 'keyword two', 'keyword three'],
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('keyword one,keyword two,keyword three'))
  })

  test('invoke onchange on text change (string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_title: {
            value: {
              param: {
                type: 'string',
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    const input = screen.getByDisplayValue('')
    await userEvent.type(input, '  some input  ')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'some input' }))
    expect(clearError).toHaveBeenCalled()
  })

  test('invoke onchange on text change (string[])', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          keywords: {
            value: {
              param: {
                type: 'string[]',
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    const input = screen.getByDisplayValue('')
    await userEvent.type(input, '  keyword one,  keyword two    ,keyword three    ')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: ['keyword one', 'keyword two', 'keyword three'] })
    )
    expect(clearError).toHaveBeenCalled()
  })

  test('invoke onchange on text change (integer)(with type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          integer_field: {
            value: {
              param: {
                type: 'integer',
                range: [5, 10],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    const input = screen.getByDisplayValue('')
    await userEvent.type(input, '  3  ')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 3 }))
    expect(clearError).toHaveBeenCalled()
  })

  test('read saved value from localstroage', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          paper_title: {
            value: {
              param: {
                type: 'string',
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    const getItem = jest.fn(() => 'some saved value')
    Object.defineProperty(window, 'localStorage', {
      value: { getItem },
    })

    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(getItem).toHaveBeenCalledWith('some key')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'some saved value' })
    )
    expect(clearError).toHaveBeenCalled()
  })
})
