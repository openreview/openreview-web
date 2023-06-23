import TextboxWidget from '../components/EditorComponents/TextboxWidget'
import { screen } from '@testing-library/react'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

describe('TextboxWidget', () => {
  test('render input as readonly when invitation field value is a const string/string[]', () => {
    let providerProps = {
      value: {
        field: {
          ['venue']: {
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
          ['keywords']: {
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
          ['venue']: {
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
          ['keywords']: {
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
          ['venue']: 'ICML Conf Submission',
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')

    providerProps = {
      value: {
        field: {
          ['keywords']: ['keyword one', 'keyword two', 'keyword three'],
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
          ['paper_title']: {},
        },
        value: undefined,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue(''))
  })

  test('show note value if string value exists (editing a note)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_title']: {},
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
          ['keywords']: {
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
          ['paper_title']: {
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
    expect(clearError).toBeCalled()
  })

  test('invoke onchange on text change (string[])', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          ['keywords']: {
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
    expect(clearError).toBeCalled()
  })

  test('invoke onchange on text change (integer)(with type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          ['integer_field']: {
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
    expect(clearError).toBeCalled()
  })
})
