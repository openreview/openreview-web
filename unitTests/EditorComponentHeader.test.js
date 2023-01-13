import EditorComponentHeader from '../components/EditorComponents/EditorComponentHeader'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
// import { prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom'

describe.skip('EditorComponentHeader', () => {
  test('pretty display mandatory field name of single word', () => {
    const providerProps = {
      value: {
        field: {
          field: {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('* Field'))
  })

  test('pretty display mandatory field name of multiple words', () => {
    const providerProps = {
      value: {
        field: {
          field_name: {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('* Field Name'))
  })

  test('pretty display optional field name of single word', () => {
    const providerProps = {
      value: {
        field: {
          field: {
            value: {
              param: {
                optional: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('Field'))
  })

  test('pretty display optional field name of multiple words', () => {
    const providerProps = {
      value: {
        field: {
          field_name: {
            value: {
              param: {
                optional: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('Field Name'))
  })

  test('allow field name to be overwritten', () => {
    const providerProps = {
      value: {
        field: {
          field_name: {
            value: {
              param: {
                optional: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(
      <EditorComponentHeader fieldNameOverwrite="some Field name To overWrite" />,
      providerProps
    )
    expect(screen.queryByText('Field Name')).not.toBeInTheDocument()
    expect(screen.getByText('some Field name To overWrite'))
  })

  test('add hidden class to hidden field', () => {
    const providerProps = {
      value: {
        field: {
          field_name: {
            value: {
              param: {
                hidden: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('* Field Name').parentElement).toHaveClass('hidden')
  })

  test('display description with no scroll', () => {
    const providerProps = {
      value: {
        field: {
          field_name: {
            description: 'some description',
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('some description'))
  })

  test('display description with scroll', () => {
    const providerProps = {
      value: {
        field: {
          field_name: {
            description: 'some description',
            value: {
              param: { scroll: true },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByDisplayValue('some description'))
  })

  test('render child', () => {
    const providerProps = {
      value: {
        field: {
          field: {},
        },
      },
    }
    renderWithEditorComponentContext(
      <EditorComponentHeader>
        <span>children content</span>
      </EditorComponentHeader>,
      providerProps
    )
    expect(screen.getByText('children content'))
  })
})
