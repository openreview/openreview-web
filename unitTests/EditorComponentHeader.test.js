import EditorComponentHeader from '../components/EditorComponents/EditorComponentHeader'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
// import { prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom'

jest.mock('../components/EditorComponents/EditorComponentReaders', () => () => (
  <span>component readers</span>
))

describe('EditorComponentHeader', () => {
  test('pretty display mandatory field name of single word', () => {
    const providerProps = {
      value: {
        field: {
          ['title']: {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('* Title'))
  })

  test('pretty display mandatory field name of multiple words', () => {
    const providerProps = {
      value: {
        field: {
          ['supplementary_material']: {},
        },
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('* Supplementary Material'))
  })

  test('pretty display optional field name of single word', () => {
    const providerProps = {
      value: {
        field: {
          ['abstract']: {
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
  })

  test('pretty display optional field name of multiple words', () => {
    const providerProps = {
      value: {
        field: {
          ['supplementary_material']: {
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
  })

  test('display pdf field name as all capital', () => {
    const providerProps = {
      value: {
        invitation: { id: 'invitaitonId' },
        field: {
          ['pdf']: {
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
    expect(screen.getByText('* PDF'))
  })

  test('allow field name to be overwritten', () => {
    const providerProps = {
      value: {
        field: {
          ['abstract']: {
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
          ['authorids']: {
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
    expect(screen.getByText('* Authorids').parentElement).toHaveClass('hidden')
  })

  test('display description with no scroll', () => {
    const providerProps = {
      value: {
        field: {
          ['abstract']: {
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
          ['abstract']: {
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
          ['abstract']: {},
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

  test('render readers of content field', () => {
    const providerProps = {
      value: {
        field: {
          ['comment']: {
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
        isContentField: true,
      },
    }
    renderWithEditorComponentContext(<EditorComponentHeader />, providerProps)
    expect(screen.getByText('component readers'))
  })

  test('not render readers of non-content field', () => {
    let providerProps = {
      value: {
        field: {
          ['comment']: {
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
          ['comment']: {
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
