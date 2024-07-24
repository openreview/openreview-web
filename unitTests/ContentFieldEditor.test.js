import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'
import ContentFieldEditor from '../components/EditorComponents/ContentFieldEditor'

jest.mock('../components/Form', () => () => 'mocked Form')

describe('ContentFieldEditor', () => {
  test('render 3 tabs for widget editing, json editing and preview', () => {
    const providerProps = {
      value: {
        field: {
          note_cotent: {
            value: {
              param: {
                type: 'content',
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<ContentFieldEditor />, providerProps)
    expect(screen.getByText('Widgets')).toBeInTheDocument()
    expect(screen.getByText('Content JSON')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })
})
