import { screen } from '@testing-library/react'
import EditorWidget from '../components/webfield/EditorWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

jest.mock('../components/EditorComponents/TextboxWidget', () => () => <span>textbox</span>)
jest.mock('../components/EditorComponents/TagsWidget', () => () => <span>tags</span>)
jest.mock('../components/EditorComponents/RadioButtonWidget', () => () => <span>radio</span>)
jest.mock('../components/EditorComponents/CheckboxWidget', () => () => <span>checkbox</span>)
jest.mock('../components/EditorComponents/DropdownWidget', () => () => <span>dropdown</span>)
jest.mock('../components/EditorComponents/TextAreaWidget', () => () => <span>textarea</span>)
jest.mock('../components/EditorComponents/CodeEditorWidget', () => () => <span>editor</span>)
jest.mock('../components/EditorComponents/FileUploadWidget', () => () => <span>upload</span>)
jest.mock('../components/EditorComponents/DatePickerWidget', () => () => <span>date</span>)
jest.mock('../components/EditorComponents/ToggleButtonWidget', () => () => <span>toggle</span>)
jest.mock('../components/EditorComponents/ProfileSearchWidget', () => () => (
  <span>profile</span>
))

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...props) => {
    const matchedPath = /("..\/(.*)")/.exec(props[0].toString())
    if (matchedPath) return require(`../components/${matchedPath[2]}`)
    return () => <></>
  },
}))

let inputProviderProps
let typeProviderProps

beforeEach(() => {
  inputProviderProps = {
    value: {
      field: {
        field_name: {
          value: {
            param: {
              input: null,
            },
          },
        },
      },
    },
  }

  typeProviderProps = {
    value: {
      field: {
        field_name: {
          value: {
            param: {
              type: null,
            },
          },
        },
      },
    },
  }
})

describe('EditorWidget', () => {
  test('render TextboxWidget for empty field', async () => {
    const providerProps = {
      value: {
        field: {
          an_empty_field: {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))
  })

  test('render TextboxWidget for field with string const value', async () => {
    let providerProps = {
      value: {
        field: {
          venue: 'ICML Conf Submission',
        },
      },
    }
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps = {
      value: {
        field: {
          venue: {
            value: 'ICML Conf Submission',
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps = {
      value: {
        field: {
          venue: {
            value: {
              param: {
                const: 'ICML Conf Submission',
              },
            },
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))
  })

  test('render TagsWidget for field with array const value', async () => {
    let providerProps = {
      value: {
        field: {
          authorids: ['~Author_ID1', '~Author_ID2', '~Author_ID3'],
        },
      },
    }
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('tags'))

    providerProps = {
      value: {
        field: {
          authorids: {
            value: ['~Author_ID1', '~Author_ID2', '~Author_ID3'],
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('tags'))

    providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                const: ['~Author_ID1', '~Author_ID2', '~Author_ID3'],
              },
            },
          },
        },
      },
    }
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('tags'))
  })

  test('render nothing for field with only readers', async () => {
    const providerProps = {
      value: {
        field: {
          authors: {
            readers: ['everyone'],
          },
        },
      },
    }
    const { container } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })

  test('render RadioButtonWidget for input radio', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = 'radio'

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('radio'))
  })

  test('render CheckboxWidget for input checkbox', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = 'checkbox'

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('checkbox'))
  })

  test('render CheckboxWidget for input checkbox', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = 'checkbox'

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('checkbox'))
  })

  test('render DropdownWidget for input select', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = 'select'

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('dropdown'))
  })

  // for backward compatibility
  test('render DropdownWidget for field without input but has enum', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = undefined
    providerProps.value.field.field_name.value.param.type = 'string'
    providerProps.value.field.field_name.value.param.enum = [
      'option one',
      'option two',
      'option three',
    ]

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('dropdown'))
  })

  test('render TextAreaWidget for input textarea', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = 'textarea'

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('textarea'))
  })

  test('render TextboxWidget for input text', async () => {
    const providerProps = inputProviderProps
    providerProps.value.field.field_name.value.param.input = 'text'

    renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))
  })

  test('render CodeEditorWidget for type json/script/json[]/script[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'json'
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('editor'))

    providerProps.value.field.field_name.value.param.type = 'json[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('editor'))

    providerProps.value.field.field_name.value.param.type = 'script'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('editor'))

    providerProps.value.field.field_name.value.param.type = 'script[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('editor'))
  })

  test('render FileUploadWidget for type file/file[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'file'
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('upload'))

    providerProps.value.field.field_name.value.param.type = 'file[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('upload'))
  })

  test('render DatePickerWidget for type date/date[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'date'
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('date'))

    providerProps.value.field.field_name.value.param.type = 'date[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('date'))
  })

  test('render ToggleButtonWidget for type boolean/boolean[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'boolean'
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('toggle'))

    providerProps.value.field.field_name.value.param.type = 'boolean[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('toggle'))
  })

  test('render TextboxWidget for type integer/float/string/integer[]/float[]/string[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'integer'
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps.value.field.field_name.value.param.type = 'float'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps.value.field.field_name.value.param.type = 'string'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps.value.field.field_name.value.param.type = 'integer[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps.value.field.field_name.value.param.type = 'float[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))

    providerProps.value.field.field_name.value.param.type = 'string[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('textbox'))
  })

  test('render ProfileSearchWidget for type group/group[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'group'
    const { rerender } = renderWithEditorComponentContext(<EditorWidget />, providerProps)
    expect(screen.getByText('profile'))

    providerProps.value.field.field_name.value.param.type = 'group[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(screen.getByText('profile'))
  })

  test('render nothing for type note/edit/edge/tag/note[]/edit[]/edge[]/tag[]', async () => {
    const providerProps = typeProviderProps

    providerProps.value.field.field_name.value.param.type = 'note'
    const { rerender, container } = renderWithEditorComponentContext(
      <EditorWidget />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'edit'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'edge'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'tag'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'note[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'edit[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'edge[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()

    providerProps.value.field.field_name.value.param.type = 'tag[]'
    reRenderWithEditorComponentContext(rerender, <EditorWidget />, providerProps)
    expect(container).toBeEmptyDOMElement()
  })
})
