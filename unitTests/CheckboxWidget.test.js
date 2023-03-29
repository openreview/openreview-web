import CheckboxWidget from '../components/EditorComponents/CheckboxWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

describe('CheckboxWidget', () => {
  test('render nothing if field description does not have enum', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                // no enum
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing if field description enum is not array', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                enum: 'this is not an array',
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('display enum options as checkbox input (type is array)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    expect(screen.getByDisplayValue('I certify')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue('I am not sure')).toHaveAttribute('type', 'checkbox')
  })

  test('display only first enum option as checkbox input (type is string)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    expect(screen.getByDisplayValue('I certify')).toHaveAttribute('type', 'checkbox')
    expect(screen.queryByDisplayValue('I do not certify')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('I am not sure')).not.toBeInTheDocument()
  })

  test('display option as checked when match with existing value (type is array)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
              },
            },
          },
        },
        value: ['I certify', 'I am not sure'],
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(screen.getByDisplayValue('I certify')).toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I do not certify')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I am not sure')).toHaveAttribute('checked')
  })

  test('display option as checked when match with existing value (type is string)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: ['I certify'],
              },
            },
          },
        },
        value: 'I certify',
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(screen.getByDisplayValue('I certify')).toHaveAttribute('checked')
  })

  test('update value when default value exists (type is array)', () => {
    const onChange = jest.fn()
    const defaultValue = ['I do not certify']

    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('update value when default value exists (type is string)', () => {
    const onChange = jest.fn()
    const defaultValue = 'I certify'

    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: ['I certify'],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('call update when option is checked or unchecked (type is array)', async () => {
    const onChange = jest.fn()
    let providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
              },
            },
          },
        },
        onChange,
      },
    }

    const { rerender } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue('I certify')
    await userEvent.click(iCertifyCheckbox)
    expect(onChange).toBeCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: ['I certify'],
    })

    providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
              },
            },
          },
        },
        value: ['I do not certify'],
        onChange,
      },
    }

    reRenderWithEditorComponentContext(rerender, <CheckboxWidget />, providerProps)
    const iDoNotCertifyCheckbox = screen.getByDisplayValue('I do not certify')
    await userEvent.click(iDoNotCertifyCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(2, {
      fieldName: 'paper_checklist_guidelines',
      value: [],
    })
  })

  test('call update when option is checked or unchecked (type is string)', async () => {
    const onChange = jest.fn()
    let providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: ['I certify'],
              },
            },
          },
        },
        onChange,
      },
    }

    const { rerender } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue('I certify')
    await userEvent.click(iCertifyCheckbox)
    expect(onChange).toBeCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: 'I certify',
    })

    providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: ['I do not certify'],
              },
            },
          },
        },
        value: 'I do not certify',
        onChange,
      },
    }

    reRenderWithEditorComponentContext(rerender, <CheckboxWidget />, providerProps)
    const iDoNotCertifyCheckbox = screen.getByDisplayValue('I do not certify')
    await userEvent.click(iDoNotCertifyCheckbox)
    expect(onChange).toHaveBeenNthCalledWith(2, {
      fieldName: 'paper_checklist_guidelines',
      value: null,
    })
  })
})
