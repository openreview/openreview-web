import TextboxWidget from '../components/EditorComponents/TextboxWidget'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import { renderWithEditorComponentContext } from './util'

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
    console.log(prettyDOM())
    expect(screen.getByText('* Textbox Widget'))
  })
})
