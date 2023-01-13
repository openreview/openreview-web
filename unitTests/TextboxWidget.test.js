import TextboxWidget from '../components/EditorComponents/TextboxWidget'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import { renderWithEditorComponentContext } from './util'
import userEvent from '@testing-library/user-event'

describe('TextboxWidget', () => {
  test('render header text', () => {
    const providerProps = {
      value: {
        field: {
          textbox_widget: {},
        },
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByText('* Textbox Widget'))
  })

  test('show empty input if no existing value', () => {
    const providerProps = {
      value: {
        field: {
          textbox_widget: {},
        },
        value: undefined,
      },
    }
    renderWithEditorComponentContext(<TextboxWidget />, providerProps)
    expect(screen.getByDisplayValue(''))
  })

  test('show note value if value exists', () => {
    const providerProps = {
      value: {
        field: {
          textbox_widget: {},
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
          textbox_widget: {},
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
