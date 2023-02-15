import CheckboxWidget from '../components/EditorComponents/CheckboxWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
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

  test('display enum options as checkbox input', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
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

  test('display option as checked when match with existing value', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
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

  test('render nothing when existing value is not array', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
              },
            },
          },
        },
        value: 'I certify',
      },
    }

    const { container } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('display option as checked and disabled when matching with default value', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
                default: ['I do not certify'],
              },
            },
          },
        },
        value: ['I certify', 'I do not certify'],
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(screen.getByDisplayValue('I certify')).toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I certify')).not.toHaveAttribute('disabled')
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I do not certify')).toHaveAttribute('disabled')
    expect(screen.getByDisplayValue('I am not sure')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('I am not sure')).not.toHaveAttribute('disabled')
  })

  test('render nothing when default value is not array', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                enum: ['I certify', 'I do not certify', 'I am not sure'],
                default: 'I do not certify',
              },
            },
          },
        },
      },
    }

    const { container } = renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('call update when option is checked or unchecked', async () => {
    const onChange = jest.fn()
    let providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
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
})
