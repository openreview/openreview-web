import EditorWidget from '../components/webfield/EditorWidget'
import { renderWithEditorComponentContext } from './util'
import { prettyDOM } from '@testing-library/dom'
import { screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

jest.mock('../components/EditorComponents/TextboxWidget', () => () => <span>textbox</span>)
jest.mock('../components/EditorComponents/TagsWidget', () => () => <span>tags</span>)
jest.mock('../components/EditorComponents/RadioButtonWidget', () => () => (
  <span>radio button</span>
))

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...props) => {
    const matchedPath = /(\"..\/(.*)\")/.exec(props[0].toString())
    if (matchedPath) return require(`../components/${matchedPath[2]}`)
    else return () => <></>
  },
}))

describe.only('EditorWidget', () => {
  test('render textbox for empty field', async () => {
    const providerProps = {
      value: {
        field: {
          textbox: {},
        },
      },
    }
    await act(async () => {
      renderWithEditorComponentContext(<EditorWidget />, providerProps)
    })
    expect(screen.getByText('textbox'))
  })

  test('render textbox for string field', async () => {
    const providerProps = {
      value: {
        field: {
          textbox: 'text',
        },
      },
    }
    await act(async () => {
      renderWithEditorComponentContext(<EditorWidget />, providerProps)
    })
    expect(screen.getByText('textbox'))
  })

  test('render tags for array field', async () => {
    const providerProps = {
      value: {
        field: {
          tags: [],
        },
      },
    }
    await act(async () => {
      renderWithEditorComponentContext(<EditorWidget />, providerProps)
    })
    expect(screen.getByText('tags'))
  })

  test('render radiobutton for input radio', async () => {
    const providerProps = {
      value: {
        field: {
          radio: {
            value: {
              param: {
                input: 'radio',
              },
            },
          },
        },
      },
    }
    await act(async () => {
      renderWithEditorComponentContext(<EditorWidget />, providerProps)
    })
    expect(screen.getByText('radio button'))
  })
})
