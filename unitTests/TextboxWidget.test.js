import TextboxWidget from '../components/EditorComponents/TextboxWidget'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

describe('TextboxWidget', () => {
  test('render input as readonly when invitation field value is a const string', () => {
    let providerProps = {
      value: {
        field: {
          ['venue']: {
            value: {
              param: {
                const: 'ICML Conf Submission',
              },
            },
          },
        },
      },
    }
    const { rerender } = renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')

    providerProps = {
      value: {
        field: {
          ['venue']: {
            value: 'ICML Conf Submission',
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')

    providerProps = {
      value: {
        field: {
          ['venue']: 'ICML Conf Submission',
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('ICML Conf Submission')).toHaveAttribute('readonly')
  })

  test('show empty input if no existing value', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_title']: {},
        },
        value: undefined,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue(''))
  })

  test('show note value if value exists (editing a note)', () => {
    const providerProps = {
      value: {
        field: {
          ['paper_title']: {},
        },
        value: 'some existing value',
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue('some existing value'))
  })

  test('invoke onchange on text change', async () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          ['paper_title']: {},
        },
        onChange,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    const input = screen.getByDisplayValue('')
    await userEvent.type(input, 'some input')
    expect(onChange).toBeCalled()
  })
})
