import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DropdownWidget from '../components/EditorComponents/DropdownWidget'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
describe('DropdownWidget', () => {
  test('render nothing if field does not have enum or items (single select)', () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                // no enum or items
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing if enum is not an array', () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                enum: {},
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing if items is not an array', () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                items: {},
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('render options (enum string single select)', async () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                enum: ['option one', 'option two', 'option three'],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option one')).toBeInTheDocument()
    expect(screen.getByText('option two')).toBeInTheDocument()
    expect(screen.getByText('option three')).toBeInTheDocument()
  })

  test('update value if existing value does not match option  (enum string single select)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                enum: ['option one', 'option two', 'option three'],
              },
            },
          },
        },
        value: 'option non exist',
        onChange,
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()
  })

  test('call update on selecting a value (enum string single select)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                enum: ['option one', 'option two', 'option three'],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'option two' }))
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting another value (enum string single select)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                enum: ['option one', 'option two', 'option three'],
              },
            },
          },
        },
        onChange,
        clearError,
        value: 'option two',
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(screen.getByText('option two')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option three'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'option three' }))
  })

  test('call update on clearing selected value (enum string single select)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                enum: ['option one', 'option two', 'option three'],
              },
            },
          },
        },
        onChange,
        clearError,
        value: 'option two',
      },
    }

    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    const clearButton = container.querySelector('svg[height="20"][width="20"]')

    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
  })

  // this test should be invalid but is added for backward compatibility
  test('be backward compatible (enum string + string[] type) part 1', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          subject_areas: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                enum: [
                  'Algorithms: Approximate Inference',
                  'Methodology: Bayesian Methods',
                  'Representation: Constraints',
                ],
              },
            },
          },
        },
        onChange,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Algorithms: Approximate Inference')).toBeInTheDocument()
    expect(screen.getByText('Methodology: Bayesian Methods')).toBeInTheDocument()
    expect(screen.getByText('Representation: Constraints')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Methodology: Bayesian Methods'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ['Methodology: Bayesian Methods'] })
    )
  })

  test('be backward compatible (enum string + string[] type) part 2', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          subject_areas: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                enum: [
                  'Algorithms: Approximate Inference',
                  'Methodology: Bayesian Methods',
                  'Representation: Constraints',
                ],
              },
            },
          },
        },
        value: ['Algorithms: Approximate Inference'],
        onChange,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Algorithms: Approximate Inference')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remove Algorithms: Approximate Inference' })
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Algorithms: Approximate Inference' })
    )
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Methodology: Bayesian Methods'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: ['Algorithms: Approximate Inference', 'Methodology: Bayesian Methods'],
      })
    )
  })

  test('render options (enum obj)', async () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option description one')).toBeInTheDocument()
    expect(screen.getByText('option description two')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()
  })

  test('update value if existing value does not match option  (enum obj)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
        value: 'value non exist',
        onChange,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
  })

  test('call update on selecting a value (enum obj no type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'value two' }))
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting a value (enum obj with type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'integer',
                enum: [
                  { value: 1, description: 'option description one' },
                  { value: 2, description: 'option description two' },
                  { value: 3, description: 'option description three' },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 2 }))
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting another value (enum obj)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: 'value two',
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('option description two')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description three'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'value three' }))
    expect(clearError).toHaveBeenCalled()
  })

  test('render options (items)', async () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                  {
                    value: 'value four',
                    description: undefined,
                    optional: true,
                  },
                ],
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option description one')).toBeInTheDocument()
    expect(screen.getByText('option description two')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()
    expect(screen.getByText('value four')).toBeInTheDocument()
  })

  test('update value if existing value does not match option  (items)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                  {
                    value: 'value four',
                    description: undefined,
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        value: ['value one', 'value non exist', 'value three'],
        onChange,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ['value one', 'value three'] })
    )

    expect(screen.getByText('option description one')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()
  })

  test('render options (enum obj + sting[] type)', async () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option description one')).toBeInTheDocument()
    expect(screen.getByText('option description two')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()
  })

  test('call update on selecting a value (enum obj + sting[] type no type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value two'] }))
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting a value (enum obj + integer[] type with type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'integer[]',
                enum: [
                  { value: 1, description: 'option description one' },
                  { value: 2, description: 'option description two' },
                  { value: 3, description: 'option description three' },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: [2] }))
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting another value (enum obj + string[] type)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                enum: [
                  { value: 'value one', description: 'option description one' },
                  { value: 'value two', description: 'option description two' },
                  { value: 'value three', description: 'option description three' },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: ['value two'],
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('option description two')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description three'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ['value two', 'value three'] })
    )
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting a value (items no type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
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
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value two'] }))
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on selecting a value (items with type conversion)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'integer[]',
                items: [
                  {
                    value: 1,
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 2,
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 3,
                    description: 'option description three',
                    optional: true,
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
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: [2] }))
    expect(clearError).toHaveBeenCalled()
  })

  test('work as single select when type is not array (items)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string', // non-array type but having items
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        onChange,
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('Select Some Select Field')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'value two' }))
  })

  test('call update on selecting another value (items)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: ['value two'],
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('option description two')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description three'))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ['value two', 'value three'] })
    )
    expect(clearError).toHaveBeenCalled()
  })

  test('call update on removing single only value (items)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: ['value two'],
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('option description two')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove option description two' })
    )

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
  })

  test('call update on removing one value when multiple values are selected (items)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: ['value two', 'value three'],
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('option description two')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove option description two' })
    )

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value three'] }))
  })

  test('call update on clearing all values (items)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: ['value one', 'value two', 'value three'],
      },
    }
    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    expect(screen.getByText('option description one')).toBeInTheDocument()
    expect(screen.getByText('option description two')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
  })

  test('update value with default ( but not mandatory) values (no existing value)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                default: ['value two'],
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: false,
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: undefined,
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value two'] }))
  })

  test('not to update value with default and mandatory values (has existing value)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                default: ['value two'],
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: false,
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: ['value three', 'value non existing'], // invitation has been changed after value non existing is submitted
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(onChange).toHaveBeenCalledTimes(1) // only the call to filter out non existing value
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'some_select_field',
      value: ['value three'],
    })
  })

  test('show remove button for mandatory value and call update when mandatory option is removed', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: false,
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: ['value one', 'value three'],
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    const optionOneRemoveButton = screen.getByRole('button', {
      name: 'Remove option description one',
    })
    const optionThreeRemoveButton = screen.getByRole('button', {
      name: 'Remove option description three',
    })
    expect(optionOneRemoveButton).toBeInTheDocument()
    expect(optionThreeRemoveButton).toBeInTheDocument()

    await userEvent.click(optionOneRemoveButton)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value three'] }))

    await userEvent.click(optionThreeRemoveButton)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value one'] }))
  })

  test('call update when a non mandatory option is removed', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: false,
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: ['value one', 'value three'],
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    const optionOneRemoveButton = screen.getByRole('button', {
      name: 'Remove option description one',
    })
    expect(optionOneRemoveButton).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove option description three' })
    ).toBeInTheDocument()

    await userEvent.click(optionOneRemoveButton)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: ['value three'] }))
  })

  test('call update when all values are cleared', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: false,
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: ['value one', 'value two', 'value three'],
      },
    }

    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(screen.getByText('option description one')).toBeInTheDocument()
    expect(screen.getByText('option description two')).toBeInTheDocument()
    expect(screen.getByText('option description three')).toBeInTheDocument()

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)

    // mandatory value is also cleared
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
  })

  test('show clear all button when all values are mandatory', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: false,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: false,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: false,
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: ['value one', 'value two', 'value three'],
      },
    }

    const { container } = renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    expect(clearButton).toBeInTheDocument()

    await userEvent.click(clearButton)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: undefined }))
  })

  test('render selected options in the order selected (items)', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                items: [
                  {
                    value: 'value one',
                    description: 'option description one',
                    optional: true,
                  },
                  {
                    value: 'value two',
                    description: 'option description two',
                    optional: true,
                  },
                  {
                    value: 'value three',
                    description: 'option description three',
                    optional: true,
                  },
                ],
              },
            },
          },
        },
        onChange,
        clearError,
        value: ['value two', 'value three', 'value one'],
      },
    }
    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    const optionTwo = screen.getByText('option description two')
    const optionThree = screen.getByText('option description three')
    const optionOne = screen.getByText('option description one')

    expect(
      // eslint-disable-next-line no-bitwise
      optionTwo.compareDocumentPosition(optionThree) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      // eslint-disable-next-line no-bitwise
      optionThree.compareDocumentPosition(optionOne) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  // existing value is an object because the invitation is editing an invitation
  test('show existing value when value is an object (items)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          license: {
            value: {
              param: {
                input: 'select',
                type: 'object[]',
                items: [
                  {
                    value: { value: 'CC BY 4.0', optional: true, description: 'CC BY 4.0' },
                    description: 'CC BY 4.0',
                    optional: true,
                  },
                  {
                    value: {
                      value: 'CC BY-SA 4.0',
                      optional: true,
                      description: 'CC BY-SA 4.0',
                    },
                    optional: true,
                    description: 'CC BY-SA 4.0',
                  },
                  {
                    value: {
                      value: 'CC BY-NC 4.0',
                      optional: true,
                      description: 'CC BY-NC 4.0',
                    },
                    optional: true,
                    description: 'CC BY-NC 4.0',
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: [
          // existing value is an object array instead of string array
          {
            value: 'CC BY-SA 4.0',
            optional: true,
            description: 'CC BY-SA 4.0',
          },
          {
            value: 'CC BY-NC 4.0',
            optional: true,
            description: 'CC BY-NC 4.0',
          },
        ],
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)
    expect(onChange).toHaveBeenCalledTimes(1) // only the call to filter out non existing value
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'license',
      value: [
        {
          value: 'CC BY-SA 4.0',
          optional: true,
          description: 'CC BY-SA 4.0',
        },
        {
          value: 'CC BY-NC 4.0',
          optional: true,
          description: 'CC BY-NC 4.0',
        },
      ],
    })
  })

  test('call update when an object option is removed', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          license: {
            value: {
              param: {
                input: 'select',
                type: 'object[]',
                items: [
                  {
                    value: { value: 'CC BY 4.0', optional: true, description: 'CC BY 4.0' },
                    description: 'CC BY 4.0',
                    optional: true,
                  },
                  {
                    value: {
                      value: 'CC BY-SA 4.0',
                      optional: true,
                      description: 'CC BY-SA 4.0',
                    },
                    optional: true,
                    description: 'CC BY-SA 4.0',
                  },
                  {
                    value: {
                      value: 'CC BY-NC 4.0',
                      optional: true,
                      description: 'CC BY-NC 4.0',
                    },
                    optional: true,
                    description: 'CC BY-NC 4.0',
                  },
                ],
              },
            },
          },
        },
        onChange,
        value: [
          {
            value: 'CC BY-SA 4.0',
            optional: true,
            description: 'CC BY-SA 4.0',
          },
          {
            value: 'CC BY-NC 4.0',
            optional: true,
            description: 'CC BY-NC 4.0',
          },
        ],
      },
    }

    renderWithEditorComponentContext(<DropdownWidget />, providerProps)

    const optionRemoveButton = screen.getByRole('button', {
      name: 'Remove CC BY-SA 4.0',
    })

    await userEvent.click(optionRemoveButton)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: [{ description: 'CC BY-NC 4.0', optional: true, value: 'CC BY-NC 4.0' }],
      })
    )
  })
})
