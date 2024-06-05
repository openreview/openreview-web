/* eslint-disable func-names,object-shorthand */
import { useContext, useState } from 'react'
import { get, set } from 'lodash'
import EditorComponentContext from '../EditorComponentContext'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import CodeEditorWidget from './CodeEditorWidget'
import Dropdown from '../Dropdown'
import Form from '../Form'
import NoteEditor from '../NoteEditor'
import EditorComponentHeader from './EditorComponentHeader'

const JsonEditor = ({ existingFields, onFieldChange }) => {
  const [mode, setMode] = useState('empty')
  const [nameOfFieldToEdit, setNameOfFieldToEdit] = useState(null)
  const [nameOfNewField, setNameOfNewField] = useState(null)
  const widgetOptions = [
    { value: 'addANewField', label: 'Add a new field' },
    ...Object.keys(existingFields ?? {}).map((p) => ({ value: p, label: p })),
  ]
  const fieldSpecificationsOfJsonField = {
    name: {
      order: 1,
      description: 'Name of the field',
      value: {
        param: {
          const: nameOfFieldToEdit,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: (existingValue) => nameOfFieldToEdit,
      valuePath: 'name',
    },
    order: {
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
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'order',
    },
    description: {
      order: 3,
      description: 'Description of the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'description',
    },
    hidden: {
      order: 4,
      description: 'Check if the field should have hidden set to true',
      value: {
        param: {
          input: 'checkbox',
          type: 'boolean',
          enum: [{ value: true, description: 'The field should be hidden' }],
          optional: true,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.hidden',
    },
    optional: {
      order: 5,
      description: 'Check if the field is optional',
      value: {
        param: {
          input: 'checkbox',
          type: 'boolean',
          enum: [{ value: true, description: 'The field is optional' }],
          optional: true,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.optional',
    },
    deletable: {
      order: 6,
      description: 'Check if the field is deletable',
      value: {
        param: {
          input: 'checkbox',
          type: 'boolean',
          enum: [{ value: true, description: 'The field is deletable' }],
          optional: true,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.deletable',
    },
    dataType: {
      order: 7,
      description: 'Data type of the field',
      value: {
        param: {
          input: 'select',
          type: 'string',
          enum: [
            { value: 'const', description: 'Constant' },
            { value: 'json', description: 'JSON (Code Editor)' },
            { value: 'script', description: 'Script (Code Editor)' },
            { value: 'json[]', description: 'JSON Array (Code Editor)' },
            { value: 'script[]', description: 'Script Array (Code Editor)' },
            { value: 'file', description: 'File (File Upload)' },
            { value: 'file[]', description: 'File Array (File Upload)' },
            { value: 'date', description: 'Date (Date Picker)' },
            { value: 'date[]', description: 'Date Array (Date Picker)' },
            { value: 'boolean', description: 'Boolean (Toggle Button, not implemented)' },
            {
              value: 'boolean[]',
              description: 'Boolean Array  (Toggle Button, not implemented)',
            },
            { value: 'integer', description: 'Integer (Textbox)' },
            { value: 'float', description: 'Float (Textbox)' },
            { value: 'integer[]', description: 'Integer Array (Textbox)' },
            { value: 'float[]', description: 'Float Array (Textbox)' },
            { value: 'string', description: 'String (Dropdown or Textbox)' },
            { value: 'string[]', description: 'String Array (Dropdown or Textbox)' },
            { value: 'group', description: 'Group ID (Profile Search)' },
            { value: 'profile', description: 'Profile ID (Profile Search)' },
            { value: 'group[]', description: 'Group ID Array (Profile Search)' },
            { value: 'profile[]', description: 'Profile ID Array (Profile Search)' },
            { value: 'note', description: 'Note ID (Not implemented)' },
            { value: 'note[]', description: 'Note ID Array (Not implemented)' },
            { value: 'edit', description: 'Edit ID (Not implemented)' },
            { value: 'edit[]', description: 'Edit ID Array (Not implemented)' },
            { value: 'edge', description: 'Edge ID (Not implemented)' },
            { value: 'edge[]', description: 'Edge ID Array (Not implemented)' },
            { value: 'tag', description: 'Tag ID (Not implemented)' },
            { value: 'tag[]', description: 'Tag ID Array (Not implemented)' },
          ],
          optional: true,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.type',
    },
    input: {
      order: 8,
      description: 'The Input to use for the field',
      value: {
        param: {
          input: 'select',
          type: 'string',
          enum: [
            { value: 'radio', description: 'Radio Button' },
            { value: 'checkbox', description: 'Checkbox' },
            { value: 'select', description: 'Dropdown' },
            { value: 'textarea', description: 'Textarea' },
            { value: 'text', description: 'Textbox' },
          ],
          optional: true,
        },
      },
      shouldBeShown: (formData) => true,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.input',
    },
    // #region widget/data type specific fields
    const: {
      order: 9,
      description: 'The constant value of the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: false,
        },
      },
      shouldBeShown: (formData) => formData.dataType === 'const',
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.const',
    },
    regex: {
      order: 9,
      description: 'Regex to validate the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => formData.dataType === 'string',
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.regex',
    },
    range: {
      order: 9,
      description: 'Range of the field, for exmaple 1,99',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) =>
        ['integer', 'float'].includes(formData.dataType) && formData.inputType === 'text',
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.range',
    },
    fieldName: {
      order: 9,
      description: 'The Text to display as name of the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => false,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.fieldName',
    },
    minLength: {
      order: 9,
      description: 'The minumum length the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => false,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.minLength',
    },
    maxLength: {
      order: 9,
      description: 'The maxmium length the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => false,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.maxLength',
    },
    minimum: {
      order: 9,
      description: 'The minumum value the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => false,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.minimum',
    },
    maximum: {
      order: 9,
      description: 'The maxmium value the field',
      value: {
        param: {
          input: 'text',
          type: 'string',
          optional: true,
        },
      },
      shouldBeShown: (formData) => false,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.maximum',
    },
    enum: {
      order: 9,
      description: 'The options for user to select from',
      value: {
        param: {
          type: 'json',
          optional: true,
        },
      },
      shouldBeShown: (formData) =>
        ['select', 'radio', 'checkbox'].includes(formData.input) &&
        !formData.dataType?.endsWith('[]'),
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.enum',
    },
    items: {
      order: 9,
      description: 'The options for user to select from',
      value: {
        param: {
          type: 'json',
          optional: true,
        },
      },
      shouldBeShown: (formData) =>
        ['select', 'radio', 'checkbox'].includes(formData.input) &&
        formData.dataType?.endsWith('[]'),
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.items',
    },
    extensions: {
      order: 9,
      description: 'The extensions allowed for user to upload',
      value: {
        param: {
          type: 'string[]',
          optional: true,
        },
      },
      shouldBeShown: (formData) => formData.dataType === 'file',
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.extensions',
    },
    maxSize: {
      order: 9,
      description: 'The max file size allowed for user to upload',
      value: {
        param: {
          type: 'number',
          input: 'text',
          optional: true,
        },
      },
      shouldBeShown: (formData) => formData.dataType === 'file',
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.maxSize',
    },
    mismatchError: {
      order: 9,
      description: 'The error message to be shown when there is a mismatch',
      value: {
        param: {
          type: 'string',
          input: 'text',
          optional: true,
        },
      },
      shouldBeShown: (formData) => false,
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.mismatchError',
    },
    markdown: {
      order: 9,
      description: 'whether to render the field as markdown',
      value: {
        param: {
          input: 'checkbox',
          type: 'boolean',
          enum: [{ value: true, description: 'The field support markdown' }],
          optional: true,
        },
      },
      shouldBeShown: (formData) => formData.dataType === 'string',
      getValue: function (existingValue) {
        return get(existingValue, this.valuePath)
      },
      valuePath: 'value.param.markdown',
    },
  }

  const onFormChange = (updatedForm) => {
    const updatedField = Object.entries(fieldSpecificationsOfJsonField).reduce(
      (prev, [key, config]) => {
        if (config.valuePath) {
          set(prev, config.valuePath, updatedForm[key])
        } else {
          set(prev, key, updatedForm[key])
        }
        return prev
      },
      {}
    )
    onFieldChange(updatedField)
  }

  return (
    <div>
      <Dropdown
        options={widgetOptions}
        placeholder="Add a field or Select a field to edit"
        onChange={(e) => {
          setNameOfFieldToEdit(e.value)
          if (e.value === 'addANewField') {
            setMode('newField')
          } else {
            setMode('editField')
            setNameOfFieldToEdit(e.value)
          }
        }}
        className="mb-2"
      />
      {mode === 'newField' && (
        <>
          <EditorComponentHeader fieldNameOverwrite={'Name of New Field'}>
            <input
              className="form-control"
              value={nameOfNewField}
              onChange={(e) => setNameOfNewField(e.target.value)}
            />
          </EditorComponentHeader>
          <button
            className="btn btn-sm"
            onClick={() => {
              setNameOfFieldToEdit(nameOfNewField)
              setMode('editField')
            }}
          >
            Add Field
          </button>
        </>
      )}
      {mode === 'editField' && (
        <Form
          fields={fieldSpecificationsOfJsonField}
          existingFieldsValue={existingFields[nameOfFieldToEdit] ?? {}}
          onFormChange={onFormChange}
        />
      )}
    </div>
  )
}

const ContentFieldEditor = () => {
  const { field, onChange, value, error } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [activeTabId, setActiveTabId] = useState(`widgets${fieldName}`)

  const onFieldChange = (updatedField) => {
    const updatedJson = { ...value, [updatedField.name]: { ...updatedField, name: undefined } }
    onChange({ fieldName, value: updatedJson })
  }

  return (
    <Tabs className="markdown-preview mb-2">
      <TabList>
        <Tab
          id={`widgets${fieldName}`}
          active={activeTabId === `widgets${fieldName}` ? true : undefined}
          onClick={() => {
            setActiveTabId(`widgets${fieldName}`)
          }}
        >
          Widgets
        </Tab>
        <Tab
          id={`result${fieldName}`}
          active={activeTabId === `result${fieldName}` ? true : undefined}
          onClick={() => {
            setActiveTabId(`result${fieldName}`)
          }}
        >
          Content JSON
        </Tab>
        <Tab
          id={`preview${fieldName}`}
          active={activeTabId === `preview${fieldName}` ? true : undefined}
          onClick={() => {
            setActiveTabId(`preview${fieldName}`)
          }}
        >
          Preview
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id={`widgets${fieldName}`}>
          <JsonEditor existingFields={value} onFieldChange={onFieldChange} />
        </TabPanel>
        <TabPanel id={`result${fieldName}`}>
          {activeTabId === `result${fieldName}` && <CodeEditorWidget />}
        </TabPanel>
        <TabPanel id={`preview${fieldName}`}>
          {activeTabId === `preview${fieldName}` && (
            <NoteEditor
              invitation={{ edit: { note: { content: value } } }}
              closeNoteEditor={() => {}}
            />
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default ContentFieldEditor
