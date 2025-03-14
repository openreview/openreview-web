import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckboxWidget from '../components/EditorComponents/CheckboxWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('CheckboxWidget in context of note editor', () => {
  test('render nothing if field description does not have enum or items', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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
          paper_checklist_guidelines: {
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
          paper_checklist_guidelines: {
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

  test('display first value of enum options(string) as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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

  test('display all enum options(string[]) as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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

  test('display description of first value of enum options(obj with integer type) as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer',
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

    expect(screen.getByDisplayValue(1)).toHaveAttribute('type', 'checkbox')
    expect(screen.queryByDisplayValue('I do not certify')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('I am not sure')).not.toBeInTheDocument()
  })

  test('display description of enum options(obj with [] type) as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer[]',
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

    expect(screen.getByDisplayValue(1)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(2)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(3)).toHaveAttribute('type', 'checkbox')
  })

  test('display description of items options as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                items: [
                  { value: '1', description: 'I certify', optional: true },
                  { value: '2', description: 'I do not certify', optional: true },
                  { value: '3', description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    expect(screen.getByDisplayValue(1)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(2)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(3)).toHaveAttribute('type', 'checkbox')
  })

  test('display non-optional options as disabled and checked', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer[]',
                items: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: false },
                  { value: 3, description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
        onChange: jest.fn(),
        value: [2], // updated by onChange on load
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    expect(screen.getByDisplayValue(1)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(1)).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue(1)).not.toHaveAttribute('disabled')
    expect(screen.getByDisplayValue(2)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(2)).toHaveAttribute('checked')
    expect(screen.getByDisplayValue(2)).toHaveAttribute('disabled')
    expect(screen.getByDisplayValue(3)).toHaveAttribute('type', 'checkbox')
    expect(screen.getByDisplayValue(3)).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue(3)).not.toHaveAttribute('disabled')
  })

  test.skip('INVALID:value will not be an array for enum', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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

  test('display option as checked when match with existing value (enum string)', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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

  test('update value if existing value does not match option (enum string)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: ['I certify not'], // invitation has been changed
              },
            },
          },
        },
        note: {},
        value: 'I certify',
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: undefined,
    })
    expect(screen.getByDisplayValue('I certify not')).not.toHaveAttribute('checked')
  })

  test('display option as checked when match with existing value (enum object)', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer',
                enum: [{ value: 1, description: 'I certify' }],
              },
            },
          },
        },
        value: 1,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(screen.getByDisplayValue(1)).toHaveAttribute('checked')
  })

  test('update value if existing value does not match option (enum object)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer',
                enum: [{ value: 1, description: 'I certify' }], // invitation has been changed
              },
            },
          },
        },
        value: 2,
        note: {},
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: undefined,
    })
    expect(screen.getByDisplayValue(1)).not.toHaveAttribute('checked')
  })

  test('display option as checked when match with existing value (items)', () => {
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                items: [
                  { value: '1', description: 'I certify', optional: true },
                  { value: '2', description: 'I do not certify', optional: true },
                  { value: '3', description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
        value: ['1', '3'],
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(screen.getByText('I certify')).toBeInTheDocument()
    expect(screen.getByText('I do not certify')).toBeInTheDocument()
    expect(screen.getByText('I am not sure')).toBeInTheDocument()

    expect(screen.getByDisplayValue('1')).toHaveAttribute('checked')
    expect(screen.getByDisplayValue('2')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('3')).toHaveAttribute('checked')
  })

  test('update value if existing value does not match option (items)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                items: [
                  { value: '1', description: 'I certify', optional: true }, // invitation has changed from 1.5 to 1
                  { value: '2', description: 'I do not certify', optional: true },
                  { value: '3', description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
        value: ['1.5', '3'],
        note: {},
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: ['3'], // filter 1.5 out
    })
    expect(screen.getByDisplayValue('1')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('2')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('3')).toHaveAttribute('checked')

    await userEvent.click(screen.getByDisplayValue('1'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ['1.5', '1', '3'] }) // should be [1,3], this is to check 1 appear before 3
    )
  })

  test('update value when default value exists (enum string)', () => {
    const onChange = jest.fn()
    const defaultValue = 'I certify'

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('update value when default value exists (enum object)', () => {
    const onChange = jest.fn()
    const defaultValue = '1'

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: [{ value: '1', description: 'I certify' }],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('update value when default value exists (items) and no value', () => {
    const onChange = jest.fn()
    const defaultValue = [1, 3]

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer[]',
                items: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: true },
                  { value: 3, description: 'I am not sure', optional: true },
                ],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: defaultValue }))
  })

  test('not to update value when default value exists (items) and is editing existing note', () => {
    // means default value is unchecked by user
    const onChange = jest.fn()
    const defaultValue = ['1', '3']

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                items: [
                  { value: '1', description: 'I certify', optional: true },
                  { value: '2', description: 'I do not certify', optional: true },
                  { value: '3', description: 'I am not sure', optional: true },
                ],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
        value: undefined,
        note: {
          content: {
            paper_checklist_guidelines: undefined,
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('update value when both default value and mandatory value exist (items) and no value', () => {
    const onChange = jest.fn()
    const defaultValue = [2, 3]

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer[]',
                items: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: true },
                  { value: 3, description: 'I am not sure', optional: false },
                  { value: 4, description: 'I do not want to certify', optional: false },
                ],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: [2, 3, 4] }))
  })

  test('not to update value when both default value and mandatory value exist (items) and is editing existing note', () => {
    const onChange = jest.fn()
    const defaultValue = [2, 3]

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer[]',
                items: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: true },
                  { value: 3, description: 'I am not sure', optional: false },
                  { value: 4, description: 'I do not want to certify', optional: false },
                ],
                default: defaultValue,
              },
            },
          },
        },
        onChange,
        value: undefined,
        note: {
          content: {
            paper_checklist_guidelines: undefined,
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('call update when option is checked (enum string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue('I certify')
    await userEvent.click(iCertifyCheckbox)
    expect(clearError).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: 'I certify',
    })
  })

  test('call update when option is checked (enum integer)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer',
                enum: [1],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue(1)
    await userEvent.click(iCertifyCheckbox)
    expect(clearError).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: 1,
    })
  })

  test('call update when option is unchecked (enum string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
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

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    const iDoNotCertifyCheckbox = screen.getByDisplayValue('I do not certify')
    await userEvent.click(iDoNotCertifyCheckbox)
    expect(clearError).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: undefined,
    })
  })

  test('call update when option is checked (enum obj with type string)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: [{ value: 1, description: 'I certify' }],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue(1)
    await userEvent.click(iCertifyCheckbox)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: '1', // type is string
    })

    // clicking text should have same effect
    const iCertifyText = screen.getByText('I certify')
    await userEvent.click(iCertifyText)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: '1',
    })
  })

  test('call update when option is checked (enum obj with type integer)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer',
                enum: [{ value: 1, description: 'I certify' }],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue(1)
    await userEvent.click(iCertifyCheckbox)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: 1,
    })
  })

  test('call update when option is unchecked (enum obj)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string',
                enum: [{ value: '2', description: 'I do not certify' }],
              },
            },
          },
        },
        value: '2',
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    const iDoNotCertifyCheckbox = screen.getByDisplayValue('2')
    await userEvent.click(iDoNotCertifyCheckbox)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: undefined,
    })
  })

  test('call update when option is checked (items with type string[])', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                items: [
                  { value: '1', description: 'I certify', optional: true },
                  { value: '2', description: 'I do not certify', optional: true },
                  { value: '3', description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue(1)
    await userEvent.click(iCertifyCheckbox)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: ['1'],
    })
  })

  test('call update when option is checked (items with type integer[])', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'integer[]',
                items: [
                  { value: 1, description: 'I certify', optional: true },
                  { value: 2, description: 'I do not certify', optional: true },
                  { value: 3, description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)

    const iCertifyCheckbox = screen.getByDisplayValue(1)
    await userEvent.click(iCertifyCheckbox)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: [1],
    })
  })

  test('call update when option is unchecked (items)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()

    const providerProps = {
      value: {
        field: {
          paper_checklist_guidelines: {
            value: {
              param: {
                input: 'checkbox',
                type: 'string[]',
                items: [
                  { value: '1', description: 'I certify', optional: true },
                  { value: '2', description: 'I do not certify', optional: true },
                  { value: '3', description: 'I am not sure', optional: true },
                ],
              },
            },
          },
        },
        value: ['2'],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    const iDoNotCertifyCheckbox = screen.getByDisplayValue('2')
    await userEvent.click(iDoNotCertifyCheckbox)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'paper_checklist_guidelines',
      value: undefined,
    })
  })
})

describe('CheckboxWdiget to be used by itself', () => {
  test('display options from props (string)', () => {
    const props = {
      isEditor: false,
      options: [
        { label: 'label one', value: 'value one' },
        { label: 'label two', value: 'value two' },
        { label: 'label three', value: 'value three' },
      ],
    }

    render(<CheckboxWidget {...props} />)

    expect(screen.getAllByRole('checkbox').length).toEqual(3)
    expect(screen.getByRole('checkbox', { name: 'label one' })).toHaveAttribute(
      'value',
      'value one'
    )
    expect(screen.getByRole('checkbox', { name: 'label two' })).toHaveAttribute(
      'value',
      'value two'
    )
    expect(screen.getByRole('checkbox', { name: 'label three' })).toHaveAttribute(
      'value',
      'value three'
    )
  })

  test('display options from props (function)', () => {
    const props = {
      isEditor: false,
      options: [
        { label: <div>some component for label one</div>, value: 'value one' },
        { label: 'label two', value: 'value two' },
        { label: <div>some component for label three</div>, value: 'value three' },
      ],
    }

    render(<CheckboxWidget {...props} />)

    expect(screen.getAllByRole('checkbox').length).toEqual(3)
    expect(
      screen.getByRole('checkbox', { name: 'some component for label one' })
    ).toHaveAttribute('value', 'value one')
    expect(screen.getByRole('checkbox', { name: 'label two' })).toHaveAttribute(
      'value',
      'value two'
    )
    expect(
      screen.getByRole('checkbox', { name: 'some component for label three' })
    ).toHaveAttribute('value', 'value three')
  })

  test('show value from props (array and non-array types)', () => {
    const props = {
      isEditor: false,
      options: [
        { label: 'label one', value: 'value one' },
        { label: 'label two', value: 'value two' },
        { label: 'label three', value: 'value three' },
      ],
      value: 'value two',
      isArrayType: false,
    }

    const { rerender } = render(<CheckboxWidget {...props} />)

    expect(screen.getByRole('checkbox', { name: 'label two' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'label one' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'label three' })).not.toBeChecked()

    props.isArrayType = true
    props.value = ['value two', 'value three']

    rerender(<CheckboxWidget {...props} />)
    expect(screen.getByRole('checkbox', { name: 'label one' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'label two' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'label three' })).toBeChecked()
  })

  test('call onChange when option is checked or unchecked based on isArrayType and dataType', async () => {
    let onChange = jest.fn()
    const props = {
      isEditor: false,
      options: [
        { label: 'label one', value: 'value one' },
        { label: 'label two', value: 'value two' },
        { label: 'label three', value: 'value three' },
      ],
      isArrayType: false,
      dataType: 'string',
      onChange,
    }

    const { rerender } = render(<CheckboxWidget {...props} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'label one' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'value one' }))

    onChange = jest.fn()
    props.isArrayType = true
    props.onChange = onChange
    rerender(<CheckboxWidget {...props} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'label one' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value one'] }))
  })

  test('call clearError when options is checked or unchecked', async () => {
    const clearError = jest.fn()
    const props = {
      isEditor: false,
      options: [
        { label: 'label one', value: 'value one' },
        { label: 'label two', value: 'value two' },
        { label: 'label three', value: 'value three' },
      ],
      isArrayType: true,
      dataType: 'string',
      value: ['value three'],
      onChange: jest.fn(),
      clearError,
    }

    render(<CheckboxWidget {...props} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'label one' }))
    expect(clearError).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('checkbox', { name: 'label three' }))
    expect(clearError).toHaveBeenCalledTimes(2)
  })
})
