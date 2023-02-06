import RadioButtonWidget from '../components/EditorComponents/RadioButtonWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

describe('RadioButtonWidget', () => {
  test('render nothing if field description does not have options', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['submission_length']: {
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
          ['submission_length']: {
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

  test('render header', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['submission_length']: {
            value: {
              param: {
                input: 'radio',
                enum: [],
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.getByText('* Submission Length'))
  })

  test('display enum options', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['submission_length']: {
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

  test('display option as selected when match with existing value', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['submission_length']: {
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

  test('call update when option is selected', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['submission_length']: {
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

    await userEvent.click(optionOne)
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        value: 'Regular submission (no more than 12 pages of main content)',
      })
    )
  })
})
