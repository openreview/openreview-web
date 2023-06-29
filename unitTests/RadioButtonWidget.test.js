import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RadioButtonWidget from '../components/EditorComponents/RadioButtonWidget'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

describe('RadioButtonWidget', () => {
  test('render nothing if field description does not have options', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: null,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.queryByText('* Radiobutton Widget')).not.toBeInTheDocument()
  })

  test('render nothing if field description enum is not array', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: {},
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.queryByText('* Radiobutton Widget')).not.toBeInTheDocument()
  })

  test('display enum options (string)', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  'Regular submission (no more than 12 pages of main content)',
                  'Long submission (more than 12 pages of main content)',
                ],
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(
      screen.getByDisplayValue('Regular submission (no more than 12 pages of main content)')
    ).toHaveAttribute('type', 'radio')
    expect(
      screen.getByDisplayValue('Long submission (more than 12 pages of main content)')
    ).toHaveAttribute('type', 'radio')
  })

  test('display description of enum options (object)', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  {
                    value: 0,
                    description: 'Regular submission (no more than 12 pages of main content)',
                  },
                  {
                    value: 1,
                    description: 'Long submission (more than 12 pages of main content)',
                  },
                ],
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.getByDisplayValue(0)).toHaveAttribute('type', 'radio')
    expect(
      screen.getByText('Regular submission (no more than 12 pages of main content)')
        .parentElement.firstChild
    ).toHaveAttribute('value', '0')
    expect(screen.getByDisplayValue(1)).toHaveAttribute('type', 'radio')
    expect(
      screen.getByText('Long submission (more than 12 pages of main content)').parentElement
        .firstChild
    ).toHaveAttribute('value', '1')
  })

  test('display option as selected when match with existing value (enum string)', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  'Regular submission (no more than 12 pages of main content)',
                  'Long submission (more than 12 pages of main content)',
                ],
              },
            },
          },
        },
        value: 'Long submission (more than 12 pages of main content)',
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(
      screen.getByDisplayValue('Regular submission (no more than 12 pages of main content)')
    ).not.toHaveAttribute('checked')
    expect(
      screen.getByDisplayValue('Long submission (more than 12 pages of main content)')
    ).toHaveAttribute('checked')
  })

  test('display option as selected when match with existing value (enum object)', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  {
                    value: 0,
                    description: 'Regular submission (no more than 12 pages of main content)',
                  },
                  {
                    value: 1,
                    description: 'Long submission (more than 12 pages of main content)',
                  },
                ],
              },
            },
          },
        },
        value: 1,
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.getByDisplayValue(0)).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue(1)).toHaveAttribute('checked')
  })

  test('call update when option is selected (enum string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  'Regular submission (no more than 12 pages of main content)',
                  'Long submission (more than 12 pages of main content)',
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    const optionTwo = screen.getByDisplayValue(
      'Long submission (more than 12 pages of main content)'
    )
    const optionOne = screen.getByDisplayValue(
      'Regular submission (no more than 12 pages of main content)'
    )

    await userEvent.click(optionTwo)
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: 'Long submission (more than 12 pages of main content)',
      })
    )
    expect(clearError).toBeCalledTimes(1)

    await userEvent.click(optionOne)
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        value: 'Regular submission (no more than 12 pages of main content)',
      })
    )
    expect(clearError).toBeCalledTimes(2)
  })

  test('call update when a new option is selected (enum string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  'Regular submission (no more than 12 pages of main content)',
                  'Long submission (more than 12 pages of main content)',
                ],
              },
            },
          },
        },
        value: 'Long submission (more than 12 pages of main content)',
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    await userEvent.click(
      screen.getByDisplayValue('Regular submission (no more than 12 pages of main content)')
    )
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: 'Regular submission (no more than 12 pages of main content)',
      })
    )
    expect(clearError).toBeCalled()
  })

  test('call update when option is selected (enum object)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                type: 'integer',
                enum: [
                  {
                    value: 0,
                    description: 'Regular submission (no more than 12 pages of main content)',
                  },
                  {
                    value: 1,
                    description: 'Long submission (more than 12 pages of main content)',
                  },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    const optionTwo = screen.getByDisplayValue('1')
    const optionOne = screen.getByDisplayValue('0')

    await userEvent.click(optionTwo)
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: 1,
      })
    )
    expect(clearError).toBeCalledTimes(1)

    await userEvent.click(optionOne)
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        value: 0,
      })
    )
    expect(clearError).toBeCalledTimes(2)
  })

  test('call update when a new option is selected (enum object)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                type: 'string',
                enum: [
                  {
                    value: '0',
                    description: 'Regular submission (no more than 12 pages of main content)',
                  },
                  {
                    vale: '1',
                    description: 'Long submission (more than 12 pages of main content)',
                  },
                ],
              },
            },
          },
        },
        value: '1',
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    await userEvent.click(screen.getByDisplayValue('0'))
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: '0',
      })
    )
    expect(clearError).toBeCalled()
  })

  test('display default value as selected if there is no value (enum string)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  'Regular submission (no more than 12 pages of main content)',
                  'Long submission (more than 12 pages of main content)',
                ],
                default: 'Long submission (more than 12 pages of main content)',
              },
            },
          },
        },
        onChange,
        value: undefined,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: 'Long submission (more than 12 pages of main content)',
      })
    ) // onChange will cause the option to be shown as selected
  })

  test('not to display default value as selected if there is value (enum string)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                enum: [
                  'Regular submission (no more than 12 pages of main content)',
                  'Long submission (more than 12 pages of main content)',
                ],
                default: 'Long submission (more than 12 pages of main content)',
              },
            },
          },
        },
        onChange,
        value: 'Regular submission (no more than 12 pages of main content)',
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    expect(
      screen.getByDisplayValue('Regular submission (no more than 12 pages of main content)')
    ).toHaveAttribute('checked')
    expect(onChange).not.toBeCalled()
  })

  test('display default value as selected if there is no value (enum object)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                type: 'integer',
                enum: [
                  {
                    value: 0,
                    description: 'Regular submission (no more than 12 pages of main content)',
                  },
                  {
                    value: 1,
                    description: 'Long submission (more than 12 pages of main content)',
                  },
                ],
                default: 1,
              },
            },
          },
        },
        onChange,
        value: undefined,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 1 }))
  })

  test('not to display default value as selected if there is value (enum object)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          submission_length: {
            value: {
              param: {
                input: 'radio',
                type: 'integer',
                enum: [
                  {
                    value: 0,
                    description: 'Regular submission (no more than 12 pages of main content)',
                  },
                  {
                    value: 1,
                    description: 'Long submission (more than 12 pages of main content)',
                  },
                ],
                default: 1,
              },
            },
          },
        },
        onChange,
        value: 1,
      },
    }

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(onChange).not.toBeCalled()
  })
})
