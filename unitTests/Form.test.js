/* eslint-disable no-useless-computed-key */
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Form from '../components/Form'

let mockedEditorWidgetProps
let mockedEnumItemsEditorProps
let setFormData

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/webfield/EditorWidget', () => (props) => {
  mockedEditorWidgetProps(props)
  return 'mocked EditorWidget'
})

jest.mock('../components/FormEnumItemsFieldEditor', () => (props) => {
  mockedEnumItemsEditorProps(props)
  setFormData = props.setOptions
  return 'mocked FormEnumItemsFieldEditor'
})

global.DOMPurify = {
  sanitize: jest.fn(),
}
global.marked = jest.fn()

beforeEach(() => {
  mockedEditorWidgetProps = jest.fn()
  mockedEnumItemsEditorProps = jest.fn()
  setFormData = null
})

describe('Form', () => {
  test('render shouldBeShown fields using EditorWidget', () => {
    const formFields = {
      ['name']: {
        order: 1,
        description: 'Name of the field',
        value: {
          param: {
            const: 'title',
          },
        },
        shouldBeShown: (formData) => true,
      },
      ['order']: {
        order: 2,
        description: 'Order of the field',
        value: {
          param: {
            input: 'text',
            type: 'integer',
            optional: true,
          },
        },
        shouldBeShown: (formData) => true,
      },
      ['description']: {
        order: 3,
        description: 'Description of the field',
        value: {
          param: {
            input: 'text',
            type: 'string',
            optional: true,
          },
        },
        shouldBeShown: (formData) => false,
      },
    }
    render(<Form fields={formFields} existingFieldsValue={{}} onFormChange={jest.fn()} />)

    // shouldBeShown of description is false so show only 2 fields
    expect(mockedEditorWidgetProps).toHaveBeenCalledTimes(4) // init will cause rerender
  })

  test('render enum and items fields using FormEnumItemsFieldEditor', () => {
    const formFields = {
      ['name']: {
        order: 1,
        description: 'Name of the field',
        value: {
          param: {
            const: 'title',
          },
        },
        shouldBeShown: (formData) => true,
      },
      ['enum']: {
        order: 2,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => true,
      },
      ['items']: {
        order: 3,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => true,
      },
    }
    render(<Form fields={formFields} existingFieldsValue={{}} onFormChange={jest.fn()} />)

    expect(mockedEditorWidgetProps).toHaveBeenCalledTimes(2)
    expect(mockedEnumItemsEditorProps).toHaveBeenCalledTimes(4)
  })

  test('pass existing form data FormEnumItemsFieldEditor', () => {
    const formFields = {
      ['name']: {
        order: 1,
        description: 'Name of the field',
        value: {
          param: {
            const: 'title',
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.name,
      },
      ['enum']: {
        order: 2,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.value?.param?.enum,
      },
    }
    render(
      <Form
        fields={formFields}
        existingFieldsValue={{
          name: 'test_field',
          value: {
            param: { enum: ['option one', 'option two', 'option three'] },
          },
        }}
        onFormChange={jest.fn()}
      />
    )

    expect(mockedEditorWidgetProps).toHaveBeenCalledTimes(2) // initial render + render after value init
    expect(mockedEnumItemsEditorProps).toHaveBeenCalledTimes(2) // initial render + render after value init

    expect(mockedEnumItemsEditorProps).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ formData: {} })
    )
    expect(mockedEnumItemsEditorProps).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        formData: expect.objectContaining({
          name: 'test_field',
          enum: ['option one', 'option two', 'option three'],
        }),
      })
    )
  })

  test('update form parent when FormEnumItemsFieldEditor updates', async () => {
    const onFormChange = jest.fn()
    const formFields = {
      ['name']: {
        order: 1,
        description: 'Name of the field',
        value: {
          param: {
            const: 'title',
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.name,
      },
      ['enum']: {
        order: 2,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.value?.param?.enum,
      },
    }
    render(
      <Form
        fields={formFields}
        existingFieldsValue={{
          name: 'test_field',
          value: {
            param: { enum: ['option one', 'option two', 'option three'] },
          },
        }}
        onFormChange={onFormChange}
      />
    )

    await waitFor(() => {
      setFormData({ fieldName: 'enum', value: ['option one', 'option two'] })
    })

    await waitFor(() => {
      expect(onFormChange).toHaveBeenCalledWith({
        name: 'test_field',
        enum: ['option one', 'option two'],
      })
    })
  })

  // if datatype change then keep only name, order, description and datatype
  test('remove enum based on datatype', async () => {
    const onFormChange = jest.fn()
    const formFields = {
      ['name']: {
        order: 1,
        description: 'Name of the field',
        value: {
          param: {
            const: 'title',
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.name,
      },
      ['dataType']: {
        order: 2,
        description: 'Data type of the field',
        value: {
          param: {
            input: 'select',
            type: 'string',
            enum: ['string', 'string[]'],
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.value?.param?.type,
      },
      ['enum']: {
        order: 3,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => !formData.dataType?.endsWith('[]'),
        getValue: (existingValue) => existingValue?.value?.param?.enum,
      },
      ['items']: {
        order: 4,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => formData.dataType?.endsWith('[]'),
        getValue: (existingValue) => existingValue?.value?.param?.items,
      },
    }
    render(
      <Form
        fields={formFields}
        existingFieldsValue={{
          name: 'test_field',
          value: {
            param: { enum: ['option one', 'option two', 'option three'] },
            type: 'string',
          },
        }}
        onFormChange={onFormChange}
      />
    )

    expect(mockedEnumItemsEditorProps).toHaveBeenCalledTimes(2) // initial render + render after value init of enum
    expect(mockedEnumItemsEditorProps).not.toHaveBeenCalledWith(
      expect.objectContaining({ fieldName: 'items' })
    )
    await waitFor(() => {
      setFormData({ fieldName: 'dataType', value: 'string[]' }) // enum should be dropped
    })

    await waitFor(() => {
      expect(onFormChange).toHaveBeenCalledWith({
        dataType: 'string[]',
        description: undefined,
        name: 'test_field',
        order: undefined,
      })
    })
  })

  test('remove items when datatype change', async () => {
    const onFormChange = jest.fn()
    const formFields = {
      ['name']: {
        order: 1,
        description: 'Name of the field',
        value: {
          param: {
            const: 'title',
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.name,
      },
      ['dataType']: {
        order: 2,
        description: 'Data type of the field',
        value: {
          param: {
            input: 'select',
            type: 'string',
            enum: ['string', 'string[]'],
          },
        },
        shouldBeShown: (formData) => true,
        getValue: (existingValue) => existingValue?.value?.param?.type,
      },
      ['enum']: {
        order: 3,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => !formData.dataType?.endsWith('[]'),
        getValue: (existingValue) => existingValue?.value?.param?.enum,
      },
      ['items']: {
        order: 4,
        description: 'The options for user to select from',
        value: {
          param: {
            type: 'json',
            optional: true,
          },
        },
        shouldBeShown: (formData) => formData.dataType?.endsWith('[]'),
        getValue: (existingValue) => existingValue?.value?.param?.items,
      },
    }
    render(
      <Form
        fields={formFields}
        existingFieldsValue={{
          name: 'test_field',
          value: {
            param: {
              items: [
                { value: 1, description: 'option one', optional: true },
                { value: 2, description: 'option two', optional: false },
              ],
              type: 'string[]',
            },
          },
        }}
        onFormChange={onFormChange}
      />
    )

    expect(mockedEnumItemsEditorProps).toHaveBeenCalledTimes(2) // initial render + render after value init of items
    expect(mockedEnumItemsEditorProps).not.toHaveBeenNthCalledWith(
      // initial render shouldBeShown will be true because formData is empty
      2,
      expect.objectContaining({ fieldName: 'enum' })
    )

    await waitFor(() => {
      setFormData({ fieldName: 'dataType', value: 'string' }) // items should be dropped
    })
    await waitFor(() => {
      expect(onFormChange).toHaveBeenCalledWith({
        dataType: 'string',
        description: undefined,
        name: 'test_field',
        order: undefined,
      })
    })
  })
})
