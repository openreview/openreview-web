import CheckboxWidget from '../components/EditorComponents/CheckboxWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

describe('CheckboxWidget', () => {
  test('render nothing if field description does not have enum or items', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                // no enum or items
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

  test('render nothing if field description items is not array', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                items: 'this is not an array',
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('display enum options(string) as checkbox input', () => {
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
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue('I am not sure')).toHaveAttribute('type', 'checkbox')
  })

  test('display description of enum options(obj) as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: [
                  { value: 1, description: 'I certify' },
                  { value: 2, description: 'I do not certify' },
                  { value: 3, description: 'I am not sure' },
                ],
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

  test('display description of items options as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: true },
                  { value: 3, description: 'I am not sure', optional: true },
                ],
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

  test('display non-optional options as disabled and checked', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                enum: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: false },
                  { value: 3, description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    expect(screen.getByDisplayValue('I certify')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue('I certify')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I certify')).not.toHaveAttribute('disabled')
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('disabled')
    expect(screen.getByDisplayValue('I am not sure')).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue('I am not sure')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I am not sure')).not.toHaveAttribute('disabled')
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

  test('display description of only first enum option as checkbox input (type is obj)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: [
                  { value: 1, description: 'I certify' },
                  { value: 2, description: 'I do not certify' },
                  { value: 3, description: 'I am not sure' },
                ],
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

  test.skip('value will not be an array for enum', () => {
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
        value: ['I certify'],
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
    const clearError = jest.fn()
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
        clearError,
      },
    }

    const { rerender } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue('I certify')
    await userEvent.click(iCertifyCheckbox)
    expect(clearError).toHaveBeenCalledTimes(1)
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
        clearError,
      },
    }

    reRenderWithEditorComponentContext(rerender, <CheckboxWidget />, providerProps)
    const iDoNotCertifyCheckbox = screen.getByDisplayValue('I do not certify')
    await userEvent.click(iDoNotCertifyCheckbox)
    expect(clearError).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenNthCalledWith(2, {
      fieldName: 'paper_checklist_guidelines',
      value: [],
    })
  })

  test('call update when option is checked or unchecked (type is string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
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
        clearError,
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
        clearError,
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
