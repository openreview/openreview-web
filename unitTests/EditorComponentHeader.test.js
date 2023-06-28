import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import EditorComponentHeader from '../components/EditorComponents/EditorComponentHeader'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'

jest.mock('../components/EditorComponents/EditorComponentReaders', () => () => (
  <span>component readers</span>
))

describe('EditorComponentHeader', () => {
  test('pretty display mandatory field name of single word', () => {
    const providerProps = {
      value: {
        field: {
          'title': {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('Title'))
    expect(screen.getByText('*'))
  })

  test('pretty display mandatory field name of multiple words', () => {
    const providerProps = {
      value: {
        field: {
          'supplementary_material': {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('Supplementary Material'))
    expect(screen.getByText('*'))
  })

  test('pretty display optional field name of single word (optional true)', () => {
    const providerProps = {
      value: {
        field: {
          'abstract': {
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
    expect(screen.getByText('Abstract'))
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  test('pretty display optional field name of single word (deletable true)', () => {
    const providerProps = {
      value: {
        field: {
          'abstract': {
            value: {
              param: {
                deletable: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('Abstract'))
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  test('pretty display optional field name of multiple words (optional true)', () => {
    const providerProps = {
      value: {
        field: {
          'supplementary_material': {
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
    expect(screen.getByText('Supplementary Material'))
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  test('pretty display optional field name of multiple words (deletable true)', () => {
    const providerProps = {
      value: {
        field: {
          'supplementary_material': {
            value: {
              param: {
                deletable: true,
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('Supplementary Material'))
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  test('display pdf field name as all capital', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          'pdf': {
            value: {
              param: {
                type: 'file',
              },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('PDF'))
    expect(screen.getByText('*'))
  })

  test('allow field name to be overwritten', () => {
    const providerProps = {
      value: {
        field: {
          'abstract': {
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
    expect(screen.queryByText('Abstract')).not.toBeInTheDocument()
    expect(screen.getByText('some Field name To overWrite'))
  })

  test('add hidden class to hidden field', () => {
    const providerProps = {
      value: {
        field: {
          'authorids': {
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
    expect(screen.getByText('Authorids').parentElement).toHaveClass('hidden')
  })

  test('display description with no scroll', () => {
    const providerProps = {
      value: {
        field: {
          'abstract': {
            description:
              'Abstract of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$.',
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(
      screen.getByText(
        'Abstract of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$.'
      )
    )
  })

  test('display description with scroll', () => {
    const providerProps = {
      value: {
        field: {
          'abstract': {
            description:
              'Abstract of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$.',
            value: {
              param: { scroll: true },
            },
          },
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(
      screen.getByDisplayValue(
        'Abstract of paper. Add TeX formulas using the following formats: $In-line Formula$ or $$Block Formula$$.'
      )
    )
  })

  test('render child', () => {
    const providerProps = {
      value: {
        field: {
          'abstract': {},
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

  test('not render readers of non-content field', () => {
    let providerProps = {
      value: {
        field: {
          'comment': {
            value: {
              param: {
                type: 'string',
                maxLength: 5000,
                input: 'textarea',
              },
            },
            readers: ['reader value 1', 'reader value 2', 'reader value 3'],
          },
        },
        isContentField: false,
      },
    }
    const { rerender } = renderWithEditorComponentContext(
      <EditorComponentHeader />,
      providerProps
    )
    expect(screen.queryByText('component readers')).not.toBeInTheDocument()

    providerProps = {
      value: {
        field: {
          'comment': {
            value: {
              param: {
                type: 'string',
                maxLength: 5000,
                input: 'textarea',
              },
            },
            readers: ['reader value 1', 'reader value 2', 'reader value 3'],
          },
        },
        // no isContent field
      },
    }
    reRenderWithEditorComponentContext(rerender, <EditorComponentHeader />, providerProps)
    expect(screen.queryByText('component readers')).not.toBeInTheDocument()
  })
})
