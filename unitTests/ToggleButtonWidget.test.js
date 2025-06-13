import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'
import ToggleButtonWidget from '../components/EditorComponents/ToggleButtonWidget'

describe('ToggleButtonWidget', () => {
  test('display false value by default', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          flagged_for_ethics_review: {
            value: {
              param: {
                type: 'boolean',
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ToggleButtonWidget />, providerProps)

    expect(screen.getByText('False')).toBeInTheDocument()
    expect(screen.queryByText('True')).not.toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'flagged_for_ethics_review',
      value: false,
    })
  })

  test('display default value if specified in invitation', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          flagged_for_ethics_review: {
            value: {
              param: {
                type: 'boolean',
                default: true,
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ToggleButtonWidget />, providerProps)

    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'flagged_for_ethics_review',
      value: true,
    })
  })

  test('display value from note (value is true)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          flagged_for_ethics_review: {
            value: {
              param: {
                type: 'boolean',
              },
            },
          },
        },
        note: { id: 'some note id' }, // also contains a field flagged_for_ethics_review where the value is true
        value: true,
        onChange,
      },
    }

    renderWithEditorComponentContext(<ToggleButtonWidget />, providerProps)

    expect(screen.getByText('True')).toBeInTheDocument()
    expect(screen.queryByText('False')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('display value from note (value is false)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          flagged_for_ethics_review: {
            value: {
              param: {
                type: 'boolean',
              },
            },
          },
        },
        note: { id: 'some note id' }, // also contains a field flagged_for_ethics_review where the value is false
        value: false,
        onChange,
      },
    }

    renderWithEditorComponentContext(<ToggleButtonWidget />, providerProps)

    expect(screen.queryByText('True')).not.toBeInTheDocument()
    expect(screen.getByText('False')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('display true value even if there is no note', () => {
    // invitation editor sub invitation read value from stage invitation
    // if true the value should be displayed even if there is no note
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          flagged_for_ethics_review: {
            value: {
              param: {
                type: 'boolean',
              },
            },
          },
        },
        note: undefined,
        value: true,
        onChange,
      },
    }

    renderWithEditorComponentContext(<ToggleButtonWidget />, providerProps)

    expect(screen.getByText('True')).toBeInTheDocument()
    expect(screen.queryByText('False')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('update value when button is clicked', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          flagged_for_ethics_review: {
            value: {
              param: {
                type: 'boolean',
              },
            },
          },
        },
        note: { content: { flagged_for_ethics_review: { value: false } } },
        value: false,
        onChange,
      },
    }

    renderWithEditorComponentContext(<ToggleButtonWidget />, providerProps)

    expect(screen.getByText('False')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'flagged_for_ethics_review',
      value: true,
    })
  })
})
