import CheckboxWidget from '../components/EditorComponents/CheckboxWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

describe('CheckboxWidget', () => {
  test('render header', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_checklist_guidelines']: {
            value: {
              param: {
                input: 'checkbox',
                enum: [
                  'I certify that all co-authors of this work have read and commit to adhering to the Paper Checklist Guidelines, Call for Papers and Publication Ethics.',
                ],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<CheckboxWidget />, providerProps)
    expect(screen.getByText('* Paper Checklist Guidelines'))
  })

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
                enum: ['I certify', 'I do not certify ', 'I am not sure'],
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
})
