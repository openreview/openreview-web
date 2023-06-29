import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DropdownWidget from '../components/EditorComponents/DropdownWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

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

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={false} />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing if field does not have enum or items (multi select)', () => {
    const providerProps = {
      value: {
        field: {
          some_multiselect_field: {
            value: {
              param: {
                input: 'multiselect',
                // no enum or items
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={true} />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing if enum is not an arry', () => {
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

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={false} />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()
  })

  test('render nothing if items is not an arry', () => {
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

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={false} />,
      providerProps
    )
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

    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)
    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option one'))
    expect(screen.getByText('option two'))
    expect(screen.getByText('option three'))
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

    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'option two' }))
    expect(clearError).toBeCalled()
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

    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)
    expect(screen.getByText('option two'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option three'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'option three' }))
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

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={false} />,
      providerProps
    )

    const clearButton = container.querySelector('svg[height="20"][width="20"]')

    await userEvent.click(clearButton)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: undefined }))
  })

  test.skip('render nothing if invitation has enum but expect array', () => {
    // combination of enum and [] type) is invalid as enum should be single select
    // "multiple" prop is input other than type
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select',
                type: 'string[]',
                enum: ['option one', 'option two', 'option three'],
              },
            },
          },
        },
      },
    }
    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={false} />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()
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
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Algorithms: Approximate Inference'))
    expect(screen.getByText('Methodology: Bayesian Methods'))
    expect(screen.getByText('Representation: Constraints'))

    await userEvent.click(screen.getByText('Methodology: Bayesian Methods'))
    expect(onChange).toBeCalledWith(
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
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    expect(screen.getByText('Algorithms: Approximate Inference'))
    expect(screen.getByRole('button', { name: 'Remove Algorithms: Approximate Inference' }))

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Algorithms: Approximate Inference' })
    )
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: undefined }))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Methodology: Bayesian Methods'))
    expect(onChange).toBeCalledWith(
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
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option description one'))
    expect(screen.getByText('option description two'))
    expect(screen.getByText('option description three'))
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
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'value two' }))
    expect(clearError).toBeCalled()
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
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 2 }))
    expect(clearError).toBeCalled()
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
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    expect(screen.getByText('option description two'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description three'))
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'value three' }))
    expect(clearError).toBeCalled()
  })

  test('render options (enum obj multi select)', async () => {
    // should still allow only single value
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('option description two'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description three'))
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'value three' })) // single value is updated
    expect(clearError).toBeCalled()
  })

  test('render options (items)', async () => {
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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
      },
    }
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option description one'))
    expect(screen.getByText('option description two'))
    expect(screen.getByText('option description three'))
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
                input: 'multiselect',
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: ['value two'] }))
    expect(clearError).toBeCalled()
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
                input: 'multiselect',
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: [2] }))
    expect(clearError).toBeCalled()
  })

  test('work as single select when type is not array (items)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
                type: 'string', // non-array type but multiselect
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'value two' }))
  })

  test('work as single select when input is not multiselect (items)', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'select', // array type but single select
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
      },
    }
    renderWithEditorComponentContext(<DropdownWidget multiple={false} />, providerProps)

    expect(screen.getByText('Select Some Select Field'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description two'))

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'value two' }))
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
                input: 'multiselect',
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('option description two'))

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('option description three'))

    expect(onChange).toBeCalledWith(
      expect.objectContaining({ value: ['value two', 'value three'] })
    )
    expect(clearError).toBeCalled()
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
                input: 'multiselect',
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('option description two'))

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove option description two' })
    )

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: undefined }))
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
                input: 'multiselect',
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
    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    expect(screen.getByText('option description two'))
    expect(screen.getByText('option description three'))

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove option description two' })
    )

    expect(onChange).toBeCalledWith(expect.objectContaining({ value: ['value three'] }))
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
                input: 'multiselect',
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
    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={true} />,
      providerProps
    )

    expect(screen.getByText('option description one'))
    expect(screen.getByText('option description two'))
    expect(screen.getByText('option description three'))

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: undefined }))
  })

  test('update value with default and mandatory values (no existing value)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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

    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)
    expect(onChange).toBeCalledWith(
      expect.objectContaining({ value: ['value two', 'value three'] })
    )
  })

  test('not to update value with default and mandatory values (has existing value)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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
        value: ['value three'],
      },
    }

    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)
    expect(onChange).not.toBeCalled()
  })

  test('call update when a non mandatory option is added', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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
        value: ['value three'], // the mandatory value that is already selected
      },
    }

    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)
    expect(
      screen.queryByRole('button', { name: 'Remove option description three' })
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('option description one').parentElement.childElementCount).toEqual(
      2 // option three not to appear in dropdown
    )

    await userEvent.click(screen.getByText('option description one'))
    expect(onChange).toBeCalledWith(
      expect.objectContaining({ value: ['value three', 'value one'] })
    )
  })

  test('call update when a non mandatory option is removed', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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

    renderWithEditorComponentContext(<DropdownWidget multiple={true} />, providerProps)

    const optionOneRemoveButton = screen.getByRole('button', {
      name: 'Remove option description one',
    })
    expect(optionOneRemoveButton)
    expect(
      screen.queryByRole('button', { name: 'Remove option description three' })
    ).not.toBeInTheDocument()

    await userEvent.click(optionOneRemoveButton)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: ['value three'] }))
  })

  test('call update when all non mandatory values are cleared', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={true} />,
      providerProps
    )
    expect(screen.getByText('option description one'))
    expect(screen.getByText('option description two'))
    expect(screen.getByText('option description three'))

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    await userEvent.click(clearButton)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: ['value three'] })) // mandatory value should not be cleared
  })

  test('not to show clear all button when all values are mandatory', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          some_select_field: {
            value: {
              param: {
                input: 'multiselect',
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

    const { container } = renderWithEditorComponentContext(
      <DropdownWidget multiple={true} />,
      providerProps
    )

    const clearButton = container.querySelector('svg[height="20"][width="20"]')
    expect(clearButton).not.toBeInTheDocument()
  })
})
