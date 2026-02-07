/* eslint-disable func-names,object-shorthand */
import { useContext, useState } from 'react'
import { get, set, unset } from 'lodash'
import EditorComponentContext from '../EditorComponentContext'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import CodeEditorWidget from './CodeEditorWidget'
import Dropdown from '../Dropdown'
import Form from '../Form'
import NoteEditor from '../NoteEditor'
import EditorComponentHeader from './EditorComponentHeader'
import styles from '../../styles/components/ContentFieldEditor.module.scss'
import Icon from '../Icon'
import { convertToType } from '../../lib/webfield-utils'

const JsonEditor = ({ existingFields, onFieldChange }) => {
  const [mode, setMode] = useState('empty')
  const [nameOfFieldToEdit, setNameOfFieldToEdit] = useState(null)
  const [nameOfNewField, setNameOfNewField] = useState(null)
  const [selectedValue, setSelectedValue] = useState(null)
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
    // hidden: {
    //   order: 4,
    //   description: 'Check if the field should have hidden set to true',
    //   value: {
    //     param: {
    //       input: 'checkbox',
    //       type: 'boolean',
    //       enum: [{ value: true, description: 'The field should be hidden' }],
    //       optional: true,
    //     },
    //   },
    //   shouldBeShown: (formData) => true,
    //   getValue: function (existingValue) {
    //     return get(existingValue, this.valuePath)
    //   },
    //   valuePath: 'value.param.hidden',
    // },
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
            { value: 'string', description: 'String (Dropdown/Textbox/Checkbox/Radio)' },
            {
              value: 'string[]',
              description: 'String Array (Multi Select Dropdown/Textbox/Checkbox/Radio)',
            },
            { value: 'json', description: 'JSON (Code Editor)' },
            // { value: 'script', description: 'Script (Code Editor)' },
            // { value: 'json[]', description: 'JSON Array (Code Editor)' },
            // { value: 'script[]', description: 'Script Array (Code Editor)' },
            { value: 'file', description: 'File (File Upload)' },
            // { value: 'file[]', description: 'File Array (File Upload)' },
            { value: 'date', description: 'Date (Date Picker)' },
            // { value: 'date[]', description: 'Date Array (Date Picker)' },
            { value: 'boolean', description: 'Boolean (Toggle Button)' },
            // {
            //   value: 'boolean[]',
            //   description: 'Boolean Array  (Toggle Button, not implemented)',
            // },
            { value: 'integer', description: 'Integer (Dropdown/Textbox/Checkbox/Radio)' },
            { value: 'float', description: 'Float (Dropdown/Textbox/Checkbox/Radio)' },
            // { value: 'integer[]', description: 'Integer Array (Dropdown or Textbox)' },
            // { value: 'float[]', description: 'Float Array (Dropdown or Textbox)' },
            // { value: 'group', description: 'Group ID (Profile Search)' },
            // { value: 'profile', description: 'Profile ID (Profile Search)' },
            { value: 'group[]', description: 'Group ID Array (Profile Search)' },
            {
              value: 'author{}',
              description: 'Author Object (Profile Search with Institution)',
            },
            // { value: 'profile[]', description: 'Profile ID Array (Profile Search)' },
            // { value: 'note', description: 'Note ID (Not implemented)' },
            // { value: 'note[]', description: 'Note ID Array (Not implemented)' },
            // { value: 'edit', description: 'Edit ID (Not implemented)' },
            // { value: 'edit[]', description: 'Edit ID Array (Not implemented)' },
            // { value: 'edge', description: 'Edge ID (Not implemented)' },
            // { value: 'edge[]', description: 'Edge ID Array (Not implemented)' },
            // { value: 'tag', description: 'Tag ID (Not implemented)' },
            // { value: 'tag[]', description: 'Tag ID Array (Not implemented)' },
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
      shouldBeShown: (formData) =>
        !['const', 'file', 'date', 'boolean', 'json', 'author{}'].includes(formData.dataType),
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
      shouldBeShown: (formData) =>
        ['string', 'string[]', 'group', 'group[]', 'profile', 'profile[]'].includes(
          formData.dataType
        ),
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
      shouldBeShown: (formData) => ['string', 'string[]'].includes(formData.dataType),
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
      shouldBeShown: (formData) => ['string', 'string[]'].includes(formData.dataType),
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
      shouldBeShown: (formData) =>
        ['integer', 'integer[]', 'float', 'float[]', 'date', 'date[]'].includes(
          formData.dataType
        ),
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
      shouldBeShown: (formData) =>
        ['integer', 'integer[]', 'float', 'float[]', 'date', 'date[]'].includes(
          formData.dataType
        ),
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
          ? convertToType(get(existingValue, this.valuePath), 'integer')
          : undefined
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
    institution: {
      order: 9,
      description: 'whether to include institution info',
      value: {
        param: {
          input: 'checkbox',
          type: 'boolean',
          enum: [{ value: true, description: 'Include institution info' }],
          optional: true,
        },
      },
      shouldBeShown: (formData) => formData.dataType === 'author{}',
      getValue: function (existingValue) {
        const hasInstitution = get(existingValue, this.valuePath)
        return !!hasInstitution
      },
      valuePath: 'value.param.properties.institutions',
    },
  }

  const onFormChange = (updatedForm) => {
    const updatedField = Object.entries(fieldSpecificationsOfJsonField).reduce(
      (prev, [key, config]) => {
        if (key === 'dataType' && updatedForm[key] === 'author{}') {
          set(prev, config.valuePath, updatedForm[key])
          set(prev, 'value.param.properties', {
            fullname: { param: { type: 'string' } },
            username: { param: { type: 'string' } },
          })
        } else if (key === 'institution') {
          const includeInstitution = updatedForm[key]
          // eslint-disable-next-line no-unused-expressions
          includeInstitution
            ? set(prev, 'value.param.properties.institutions', {
                param: {
                  type: 'object{}',
                  properties: {
                    name: {
                      param: {
                        type: 'string',
                      },
                    },
                    domain: {
                      param: {
                        type: 'string',
                      },
                    },
                    country: {
                      param: {
                        type: 'string',
                      },
                    },
                  },
                },
              })
            : unset(prev, 'value.param.properties.institutions', undefined)
        } else if (config.valuePath) {
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

  const deleteField = (fieldName, e) => {
    e.stopPropagation()
    setMode('empty')
    setSelectedValue(null)
    onFieldChange({ name: fieldName, delete: true })
  }

  const formatOptionLabel = (option, { context }) => {
    if (option.value === 'addANewField' || context === 'value') {
      return option.label
    }
    return (
      <div>
        {option.label}
        <div className={styles.deleteFieldButton}>
          <button
            type="button"
            className="btn btn-xs"
            onClick={(e) => {
              deleteField(option.value, e)
            }}
          >
            <Icon name="trash" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.jsonEditorContainer}>
      <Dropdown
        options={widgetOptions}
        value={selectedValue}
        placeholder="Add a field or Select a field to edit"
        formatOptionLabel={formatOptionLabel}
        onChange={(e) => {
          setSelectedValue(widgetOptions.find((p) => p.value === e.value))
          setNameOfFieldToEdit(e.value)
          if (e.value === 'addANewField') {
            setMode('newField')
          } else {
            setMode('editField')
            setNameOfFieldToEdit(e.value)
          }
        }}
        className={styles.addFieldDropdown}
      />
      {mode === 'newField' && (
        <div className={styles.newFieldForm}>
          <EditorComponentHeader fieldNameOverwrite={'Name of New Field'}>
            <input
              className={`form-control ${styles.newFieldNameInput}`}
              value={nameOfNewField ?? ''}
              onChange={(e) => setNameOfNewField(e.target.value)}
            />
          </EditorComponentHeader>
          <button
            className={`btn btn-sm ${styles.addFieldButton}`}
            onClick={() => {
              setNameOfFieldToEdit(nameOfNewField)
              setSelectedValue({ value: nameOfNewField, label: nameOfNewField })
              setMode('editField')
            }}
          >
            Add Field
          </button>
        </div>
      )}
      {mode === 'editField' && (
        <Form
          fields={fieldSpecificationsOfJsonField}
          existingFieldsValue={existingFields?.[nameOfFieldToEdit] ?? {}}
          onFormChange={onFormChange}
        />
      )}
    </div>
  )
}
// For editing fields where the type is content
const ContentFieldEditor = () => {
  const { field, onChange, value, error } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [activeTabId, setActiveTabId] = useState(`result${fieldName}`)

  const valueWithoutDeletedFields = Object.keys(value ?? {}).reduce((prev, curr) => {
    if (value[curr]?.delete) return prev
    // eslint-disable-next-line no-param-reassign
    prev[curr] = value[curr]
    return prev
  }, {})

  const onFieldChange = (updatedField) => {
    const updatedJson = { ...value, [updatedField.name]: { ...updatedField, name: undefined } }
    onChange({ fieldName, value: updatedJson })
  }

  return (
    <Tabs className={styles.contentEditorTabs}>
      <TabList>
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
          id={`widgets${fieldName}`}
          active={activeTabId === `widgets${fieldName}` ? true : undefined}
          onClick={() => {
            setActiveTabId(`widgets${fieldName}`)
          }}
        >
          Widgets
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
        <TabPanel id={`result${fieldName}`}>
          {activeTabId === `result${fieldName}` && <CodeEditorWidget />}
        </TabPanel>
        <TabPanel id={`widgets${fieldName}`}>
          {activeTabId === `widgets${fieldName}` && (
            <JsonEditor
              existingFields={valueWithoutDeletedFields}
              onFieldChange={onFieldChange}
            />
          )}
        </TabPanel>
        <TabPanel id={`preview${fieldName}`}>
          {activeTabId === `preview${fieldName}` && (
            <NoteEditor
              invitation={{ edit: { note: { content: valueWithoutDeletedFields } } }}
              closeNoteEditor={() => {}}
              className={styles.contentPreview}
              customValidator={() => ({
                isValid: false,
                errorMessage: 'This is a note editor preview',
              })}
            />
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default ContentFieldEditor
