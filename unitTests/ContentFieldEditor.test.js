import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'
import ContentFieldEditor from '../components/EditorComponents/ContentFieldEditor'

let mockedFormProps
let onFormChange

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/Form', () => (props) => {
  mockedFormProps(props)
  // eslint-disable-next-line prefer-destructuring
  onFormChange = props.onFormChange
  return 'mocked Form'
}) // used by widgets editor
jest.mock('../components/CodeEditor', () => () => 'mocked content json editor')
jest.mock('../components/NoteEditor', () => () => 'mocked note editor preview')

beforeEach(() => {
  mockedFormProps = jest.fn()
  onFormChange = null
})

describe('ContentFieldEditor', () => {
  test('render 3 tabs for json editing,widget editing and preview', () => {
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
    // show 3 tabs
    expect(screen.getByText('Content JSON')).toBeInTheDocument()
    expect(screen.getByText('Widgets')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()

    // show json
    expect(screen.getByText('mocked content json editor')).toBeInTheDocument()
  })

  test('switch tab to show content json and editor preview', async () => {
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

    expect(screen.queryByText('Add a field or Select a field to edit')).not.toBeInTheDocument()
    expect(screen.getByText('mocked content json editor')).toBeInTheDocument()
    expect(screen.queryByText('mocked note editor preview')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Widgets' }))
    expect(screen.queryByText('mocked content json editor')).not.toBeInTheDocument()
    expect(screen.getByText('Add a field or Select a field to edit')).toBeInTheDocument()
    expect(screen.queryByText('mocked note editor preview')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(screen.queryByText('mocked content json editor')).not.toBeInTheDocument()
    expect(screen.queryByText('mocked content json editor')).not.toBeInTheDocument()
    expect(screen.queryByText('mocked note editor preview')).toBeInTheDocument()
  })

  test('show new field name input and add button when adding a new field', async () => {
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

    await userEvent.click(screen.getByRole('tab', { name: 'Widgets' }))
    await userEvent.click(screen.getByText('Add a field or Select a field to edit'))
    await userEvent.click(screen.getByRole('option', { name: 'Add a new field' }))

    expect(screen.getByText('Name of New Field')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { class: 'newFieldNameInput' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Field' })).toBeInTheDocument()

    // add a new field
    await userEvent.type(
      screen.getByRole('textbox', { class: 'newFieldNameInput' }),
      'test_field'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add Field' }))

    expect(screen.getByText('mocked Form')).toBeInTheDocument()
  })

  test('show value when editing existing field', async () => {
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
        value: {
          title: {
            order: 1,
            description: 'the title of the submission',
            value: {
              param: {
                type: 'string',
                regex: '^.{1,250}$',
              },
            },
          },
          pdf: {
            order: 2,
            description: 'upload pdf file of the submission',
            value: {
              param: {
                type: 'file',
                maxSize: 50,
                extensions: ['pdf'],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<ContentFieldEditor />, providerProps)

    await userEvent.click(screen.getByRole('tab', { name: 'Widgets' }))
    await userEvent.click(screen.getByText('Add a field or Select a field to edit'))
    // existing fields are shown in dropdown
    expect(screen.getByRole('option', { name: 'title' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'pdf' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('option', { name: 'title' }))

    expect(screen.getByText('mocked Form')).toBeInTheDocument()
    expect(mockedFormProps).toHaveBeenCalledWith(
      expect.objectContaining({
        existingFieldsValue: expect.objectContaining({
          description: 'the title of the submission',
        }),
      })
    )
    // eslint-disable-next-line max-len
    expect(Object.keys(mockedFormProps.mock.calls[0][0].fields)).toHaveLength(21) // 21 fields defined for a field (removed hidden)
  })

  test('update invitation content editor when widget form is updated', async () => {
    const onChange = jest.fn()
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
        value: {
          title: {
            order: 1,
            description: 'the title of the submission',
            value: {
              param: {
                type: 'string',
                regex: '^.{1,250}$',
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ContentFieldEditor />, providerProps)

    await userEvent.click(screen.getByRole('tab', { name: 'Widgets' }))
    await userEvent.click(screen.getByText('Add a field or Select a field to edit'))
    await userEvent.click(screen.getByRole('option', { name: 'title' }))

    onFormChange({
      name: 'title',
      description: 'the title of the submission',
      dataType: 'string',
      regex: '^.{1,250}$',
      order: 4, // order is changed from 1 to 4
    })

    // update invitation content editor's note_content field with whole json
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldName: 'note_cotent',
        value: expect.objectContaining({
          title: expect.objectContaining({
            description: 'the title of the submission',
            order: 4,
            value: {
              param: {
                regex: '^.{1,250}$',
                type: 'string',
              },
            },
          }),
        }),
      })
    )
  })
})
