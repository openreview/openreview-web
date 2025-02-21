/* globals promptError, promptMessage: false */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../../lib/api-client'
import CodeEditor from '../CodeEditor'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'

import ProfileSearchWidget from './ProfileSearchWidget'
import DatePickerWidget from './DatePickerWidget'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from './EditorComponentHeader'
import EditorWidget from '../webfield/EditorWidget'
import Icon from '../Icon'
import styles from '../../styles/components/NoteEditor.module.scss'
import useFieldEditorState from '../../hooks/useFieldEditorState'

// The top-level data types
const DATA_TYPE_OPTIONS = {
  TEXT: {
    label: 'Text',
    type: 'string',
    allowedInputs: ['radio', 'checkbox', 'text', 'textarea'],
  },
  INTEGER: {
    label: 'Integer',
    type: 'integer',
    allowedInputs: ['radio', 'checkbox', 'text', 'textarea'],
  },
  DECIMAL: {
    label: 'Decimal',
    type: 'float',
    allowedInputs: ['radio', 'checkbox', 'text', 'textarea'],
  },
  BOOLEAN: {
    label: 'Boolean',
    type: 'boolean',
    allowedInputs: ['radio', 'checkbox'],
  },
  SPECIAL: {
    label: 'Special',
    type: 'special', // We'll handle special sub-types differently
  },
}

// For all standard data types (string, integer, float, boolean),
// we have sub-options: Single Choice, Multiple Choice, etc.
const INPUT_TYPE_OPTIONS = [
  { label: 'Single Choice', input: 'radio' },
  { label: 'Multiple Choice', input: 'checkbox' },
  { label: 'Small Textbox', input: 'text' },
  { label: 'Large Textbox', input: 'textarea' },
]

// For “special” data type, we have sub-types that map 1:1 to param.type
const SPECIAL_TYPE_OPTIONS = [
  { label: 'Date', type: 'date' },
  { label: 'File', type: 'file' },
  { label: 'Profile', type: 'profile' },
  { label: 'Group', type: 'group' },
]

// #region Helper Functions

const generateFieldConfig = (topLevelChoice, secondLevelChoice) => {
  // If topLevelChoice is "SPECIAL",
  // secondLevelChoice must be one of the special sub-types
  if (topLevelChoice.type === 'special') {
    // Find the special sub-type object (e.g. { label: 'Date', type: 'date' })
    const special = SPECIAL_TYPE_OPTIONS.find((s) => s.label === secondLevelChoice)
    return {
      description: '',
      value: {
        param: {
          type: special.type,
          // The rest of the defaults for these special fields:
          optional: false,
        },
      },
    }
  }

  // Otherwise, topLevelChoice is string/integer/float/boolean,
  // and secondLevelChoice is Single Choice / Multiple Choice /
  // Small Textbox / Large Textbox.
  // 1. dataType
  const baseType = topLevelChoice.type // 'string' | 'integer' | 'float' | 'boolean'
  // 2. input type
  const inputChoice = INPUT_TYPE_OPTIONS.find((i) => i.label === secondLevelChoice)

  // Decide whether we store an array or not
  let finalType = baseType
  if (inputChoice.input === 'checkbox') {
    // multiple choice => "integer[]" or "string[]", etc.
    if (baseType === 'integer') finalType = 'integer[]'
    else if (baseType === 'float') finalType = 'float[]'
    else if (baseType === 'boolean') finalType = 'boolean[]'
    else finalType = 'string[]'
  }

  // Decide if we use an enum array
  let maybeEnum = null
  // For single or multiple choice, we typically use an array in param.enum
  if (inputChoice.input === 'radio' || inputChoice.input === 'checkbox') {
    maybeEnum = []
  }

  const config = {
    description: '',
    value: {
      param: {
        type: finalType,
        input: inputChoice.input,
        optional: false,
      },
    },
  }

  if (maybeEnum !== null) {
    config.value.param.enum = maybeEnum
  }

  // Large textbox => we can enable markdown or set defaults
  if (inputChoice.input === 'textarea') {
    config.value.param.markdown = false
    config.value.param.scroll = false
  }

  return config
}

// #endregion

// #region Field Tabs

function TabNavigation({ activeTab, onTabChange }) {
  return (
    <TabList>
      <Tab
        id="preview-fields"
        onClick={() => onTabChange('preview-fields')}
        active={activeTab === 'preview-fields'}
      >
        Live Preview
      </Tab>
      <Tab
        id="json-fields"
        onClick={() => onTabChange('json-fields')}
        active={activeTab === 'json-fields'}
      >
        Raw JSON
      </Tab>
    </TabList>
  )
}

// #endregion

// #region Top Level Field Components

const InsertFieldButton = ({ index, isOpen, onOpen, onClose, onAddField }) => {
  // Are we in step 1 or step 2?
  const [selectedTopLevel, setSelectedTopLevel] = React.useState(null)

  // Step 2 choices are either input types or special sub-types
  // If top-level is "SPECIAL", we use the special sub-type array (e.g., Date, File, etc.).
  // Otherwise, we filter the normal input types by allowedInputs.
  const getSecondLevelOptions = () => {
    if (!selectedTopLevel) return []

    if (selectedTopLevel.type === 'special') {
      // Return the special sub-type labels, e.g. ['Date', 'File', 'Profile', 'Group']
      return SPECIAL_TYPE_OPTIONS.map((s) => s.label)
    }

    // For normal types (string, integer, float, boolean):
    const allowed = selectedTopLevel.allowedInputs // e.g. ['radio', 'checkbox']
    return INPUT_TYPE_OPTIONS.filter((opt) => allowed.includes(opt.input)).map(
      (opt) => opt.label
    )
  }

  const secondLevelOptions = getSecondLevelOptions()

  const handleSelectTopLevel = (key) => {
    const topLevel = Object.values(DATA_TYPE_OPTIONS).find((t) => t.label === key)
    setSelectedTopLevel(topLevel)
  }

  const handleSelectSecondLevel = (label) => {
    // We have top-level + second-level → generate a new field
    const newConfig = generateFieldConfig(selectedTopLevel, label)
    onAddField(index, newConfig)
    // reset local state & close
    setSelectedTopLevel(null)
    onClose()
  }

  // Track whether the user is hovering over the insertion area
  const [isHovered, setIsHovered] = React.useState(false)

  // We want the line/plus to be visible if hovered OR if dropdown is open
  const shouldShowLine = isHovered || isOpen

  // Inline styles for the container holding the line & plus
  const linePlusStyle = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    // Fade in/out
    opacity: shouldShowLine ? 1 : 0.05,
    transition: 'opacity 0.2s ease',
  }

  // Inline styles for the dropdown
  const dropdownStyle = {
    padding: '8px',
    // Remove the white background:
    background: 'transparent',
    position: 'relative',
    zIndex: 999,
    // Simple fade-in animation:
    animation: 'fadeIn 0.5s ease-out',
  }

  return (
    <>
      {/* Define fadeIn keyframes for the dropdown menu.
            The line/plus uses the inline style above instead. */}
      <style>
        {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-5px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes fadeInButtons {
              from {
                opacity: 0;
                transform: translateY(-5px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .fade-in-list {
              animation: fadeInButtons 0.3s ease-out;
            }
          `}
      </style>

      <div
        style={{ margin: '8px 0' }}
        // Hover tracking
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* The horizontal line + plus icon */}
        <div style={linePlusStyle} onClick={() => (isOpen ? onClose() : onOpen(index))}>
          <div style={{ flex: 1, borderBottom: '1px solid #ccc' }}></div>
          <span
            className="glyphicon glyphicon-plus"
            style={{ color: 'green', margin: '0 8px' }}
          ></span>
          <div style={{ flex: 1, borderBottom: '1px solid #ccc' }}></div>
        </div>

        {/* Dropdown (only visible if isOpen=true) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="dropdown"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={dropdownStyle}>
                {/* If no category selected yet, list categories */}
                {!selectedTopLevel && (
                  <ul
                    className="fade-in-list"
                    style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {Object.values(DATA_TYPE_OPTIONS).map((top) => (
                      <li key={top.label} style={{ margin: '3px 0' }}>
                        <button
                          className="btn btn-default"
                          type="button"
                          onClick={() => handleSelectTopLevel(top.label)}
                        >
                          {top.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* If a category is selected, list field types */}
                {selectedTopLevel && (
                  <ul
                    className="fade-in-list"
                    style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {secondLevelOptions.map((fieldName) => (
                      <li key={fieldName} style={{ margin: '3px 0' }}>
                        <button
                          className="btn btn-default"
                          type="button"
                          onClick={() => handleSelectSecondLevel(fieldName)}
                        >
                          {fieldName}
                        </button>
                      </li>
                    ))}
                    <li style={{ margin: '4px 0' }}>
                      <button
                        className="btn btn-default"
                        type="button"
                        onClick={() => setSelectedTopLevel(null)}
                      >
                        ← Back to Categories
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

function FieldRow({
  index,
  field,
  addFieldDropdownIndex,
  handleOpenAddFieldDropdown,
  setAddFieldDropdownIndex,
  handleAddFieldAtIndex,
  selectedIndex,
  selectField,
  handleDeleteField,
  moveFieldUp,
  moveFieldDown,
  renderField,
}) {
  return (
    <>
      <InsertFieldButton
        index={index}
        isOpen={addFieldDropdownIndex === index}
        onOpen={handleOpenAddFieldDropdown}
        onClose={() => setAddFieldDropdownIndex(null)}
        onAddField={handleAddFieldAtIndex}
      />

      <div
        className={`field-row ${selectedIndex === index ? 'selected' : ''}`}
        onClick={() => selectField(index)}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          marginBottom: '15px',
          marginRight: '2em',
          borderRadius: '0.75em',
        }}
      >
        {/* Field Controls */}
        <FieldControls
          idx={index}
          onDelete={handleDeleteField}
          onMoveUp={moveFieldUp}
          onMoveDown={moveFieldDown}
        />

        {/* Field Preview */}
        <FieldPreview field={field} renderField={renderField} index={index} />
      </div>
    </>
  )
}

// #endregion

// #region Nested Level Field Components

function FieldControls({ idx, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div
      className="field-controls"
      style={{
        marginRight: '10px',
        textAlign: 'center',
        width: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center children horizontally
      }}
    >
      {/* Delete button at the top */}
      <div
        className="delete-button"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="close"
          onClick={() => onDelete(idx)}
          aria-label="Remove field"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'red',
            fontSize: '0.75em',
          }}
        >
          <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
      </div>
      {/* Index and Reorder Buttons Centered Vertically */}
      <div
        className="control-buttons"
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="btn btn-default btn-xs"
          onClick={() => onMoveUp(idx)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2px',
            marginLeft: '0.5rem',
            marginRight: '0.5rem',
          }}
          aria-label="Move field up"
        >
          <span className="glyphicon glyphicon-chevron-up" aria-hidden="true"></span>
        </button>
        <div className="field-index" style={{ fontWeight: 'bold' }}>
          {idx + 1}
        </div>
        <button
          type="button"
          className="btn btn-default btn-xs"
          onClick={() => onMoveDown(idx)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: '0.5rem',
            marginRight: '0.5rem',
            marginTop: '2px',
          }}
          aria-label="Move field down"
        >
          <span className="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  )
}

function FieldPreview({ field, renderField, index }) {
  return <div style={{ flex: 1 }}>{renderField(field, index)}</div>
}

// #endregion

// #region Shared Field Options

function BasicFieldOptions({ field, selectedIndex, updateNestedProperty }) {
  return (
    <>
      {/* Field Name */}
      <div className="form-group">
        <label htmlFor="fieldName">Field Name</label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => updateNestedProperty(selectedIndex, 'name', e.target.value)}
          className="form-control"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="descriptionField">Description</label>
        <textarea
          value={field.config.description || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'description', e.target.value)}
          className="form-control"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: '20vh', // fixed height
            resize: 'vertical', // allow user to resize only vertically
          }}
        />
      </div>

      {/* Required Checkbox */}
      <div className="form-group">
        <label style={{ marginRight: '5px' }}>
          <input
            type="checkbox"
            checked={!field.config.value.param.optional}
            onChange={(e) => updateNestedProperty(selectedIndex, 'required', e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Required
        </label>
      </div>

      {/* Hidden Checkbox */}
      <div className="form-group">
        <label style={{ marginRight: '5px' }}>
          <input
            type="checkbox"
            checked={field.config.value.param.hidden || false}
            onChange={(e) =>
              updateNestedProperty(selectedIndex, 'hidden', e.target.checked)
            }
            style={{ marginRight: '5px' }}
          />
          Hidden Field
        </label>
      </div>
    </>
  )
}

// #endregion

// #region Multiple Choice Field Options

function ChoiceFieldOptions({
  param,
  selectedIndex,
  updateNestedProperty,
  removeOption,
  addOption,
}) {
  return (
    <>
      {/* Input Type Selector */}
      <div className="form-group">
        <label htmlFor="inputType">Input Type</label>
        <select
          className="form-control"
          value={param.input}
          onChange={(e) => updateNestedProperty(selectedIndex, 'inputType', e.target.value)}
        >
          <option value="select">Dropdown</option>
          <option value="radio">Radio Buttons</option>
          <option value="checkbox">Checkboxes</option>
        </select>
      </div>

      {/* Options Mapping */}
      {param.enum.map((option, index) => (
        <div key={index} className="form-group">
          <label>Option {index + 1}</label>
          {!(typeof option === 'object') && (
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...param.enum]
                newOptions[index] = e.target.value
                updateNestedProperty(selectedIndex, 'options', newOptions)
              }}
              className="form-control"
              placeholder="Value"
            />
          )}
          {typeof option === 'object' && 'value' in option && (
            <input
              type="text"
              value={option.value}
              onChange={(e) => {
                const newOptions = [...param.enum]
                newOptions[index] = {
                  ...newOptions[index],
                  value: e.target.value,
                }
                updateNestedProperty(selectedIndex, 'options', newOptions)
              }}
              className="form-control"
              placeholder="Value"
            />
          )}
          {typeof option === 'object' && 'description' in option && (
            <input
              type="text"
              value={option.description}
              onChange={(e) => {
                const newOptions = [...param.enum]
                newOptions[index] = {
                  ...newOptions[index],
                  description: e.target.value,
                }
                updateNestedProperty(selectedIndex, 'options', newOptions)
              }}
              className="form-control"
              placeholder="Description (optional)"
            />
          )}
          <button className="btn btn-link" type="button" onClick={() => removeOption(index)}>
            Remove
          </button>
        </div>
      ))}

      {/* Add Option Button */}
      <button className="btn btn-link" type="button" onClick={addOption}>
        Add Option
      </button>
    </>
  )
}

// #endregion

// #region String Field Options

function StringFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  return (
    <>
      {/* Regex Validation */}
      <div className="form-group">
        <label htmlFor="regexInput" style={{ marginRight: '5px' }}>
          Regex Validation
        </label>
        <input
          type="text"
          id="regexInput"
          value={param.regex || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'regex', e.target.value)}
          className="form-control"
        />
      </div>

      {/* Text Field Options (only if input type is textarea) */}
      {param.input === 'textarea' && (
        <div className="form-group">
          <label htmlFor="textFieldOptions">Text Field Options</label>
          <div>
            <label style={{ marginRight: '5px' }}>
              <input
                type="checkbox"
                checked={param.markdown || false}
                onChange={(e) =>
                  updateNestedProperty(selectedIndex, 'markdown', e.target.checked)
                }
                style={{ marginRight: '5px' }}
              />
              Enable Markdown
            </label>
            <label style={{ marginRight: '5px' }}>
              <input
                type="checkbox"
                checked={param.scroll || false}
                onChange={(e) =>
                  updateNestedProperty(selectedIndex, 'scroll', e.target.checked)
                }
                style={{ marginRight: '5px' }}
              />
              Scrollable text box
            </label>
          </div>
        </div>
      )}
    </>
  )
}

// #endregion

// #region Number Field Options

function NumericFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="numMin">Minimum</label>
        <input
          type="number"
          value={param.minimum || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'min', e.target.value)}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label htmlFor="numMax">Maximum</label>
        <input
          type="number"
          value={param.maximum || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'max', e.target.value)}
          className="form-control"
        />
      </div>
    </>
  )
}

// #endregion

// #region Special Field Options

function SpecialFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  switch (param.type) {
    case 'file':
      return (
        <FileFieldOptions
          param={param}
          selectedIndex={selectedIndex}
          updateNestedProperty={updateNestedProperty}
        />
      )
    case 'profile':
      return (
        <ProfileFieldOptions
          param={param}
          selectedIndex={selectedIndex}
          updateNestedProperty={updateNestedProperty}
        />
      )
    case 'group':
      return (
        <GroupFieldOptions
          param={param}
          selectedIndex={selectedIndex}
          updateNestedProperty={updateNestedProperty}
        />
      )
    case 'date':
      return (
        <DateFieldOptions
          param={param}
          selectedIndex={selectedIndex}
          updateNestedProperty={updateNestedProperty}
        />
      )
    default:
      return null
  }
}

function FileFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="allowedExt">Allowed Extensions</label>
        <input
          type="text"
          value={(param.extensions || []).join(', ') || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'extensions', e.target.value)}
          className="form-control"
          placeholder="e.g., pdf, zip"
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxSize">Max Size (MB)</label>
        <input
          type="number"
          value={param.maxSize || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'maxSize', e.target.value)}
          className="form-control"
          placeholder="e.g., 50"
        />
      </div>
    </>
  )
}

function ProfileFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  return (
    <div className="form-group">
      <label htmlFor="allowedGroup">Allowed Group ID for Profiles</label>
      <ProfileSearchWidget
        onChange={(value) => updateNestedProperty(selectedIndex, 'inGroup', value)}
        value={param.inGroup || []}
      />
    </div>
  )
}

function GroupFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  return (
    <div className="form-group">
      <label htmlFor="allowedGroupId">Allowed Group ID</label>
      <input
        type="text"
        value={param.inGroup || ''}
        onChange={(e) => updateNestedProperty(selectedIndex, 'inGroup', e.target.value)}
        className="form-control"
      />
    </div>
  )
}

function DateFieldOptions({ param, selectedIndex, updateNestedProperty }) {
  return (
    <div className="form-group">
      <label htmlFor="selectDate">Select Date</label>
      <DatePickerWidget
        onChange={(date) => updateNestedProperty(selectedIndex, 'date', date)}
        value={param.date || new Date()}
        showTime={true}
      />
    </div>
  )
}

// #endregion

const LiveContentFieldEditor = ({ propInvitation, propExistingValues, onContentChange }) => {
  const leftPanelRef = useRef(null)
  const [leftHeight, setLeftHeight] = useState(null)
  const [activeTab, setActiveTab] = useState('preview-fields')
  const [replyString, setReplyString] = useState('')
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({})
  // Track which insertion point (if any) has the dropdown open
  const [addFieldDropdownIndex, setAddFieldDropdownIndex] = useState(null)
  // Track the currently selected category in the dropdown
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Use invitation from prop or context
  const context = useContext(EditorComponentContext)
  const invitation = context.invitation || propInvitation
  const contentFields = context.value || propExistingValues
  // Mock note and replyToNote objects
  const note = { id: invitation.id }
  const replyToNote = null

  // Build initial fields from the invitation content.
  const initialFields = Object.entries(contentFields).map(([name, config]) => ({
    name,
    config, // the entire original configuration (this is the authoritative data)
    // For backward compatibility, you may also copy some top-level properties:
    description: config.description,
    order: config.order,
    required: !config.value.param.optional,
  }))

  // Use the custom hook for state management.
  const { fields, selectedIndex, selectField, updateField, deleteField } =
    useFieldEditorState(initialFields)

  // #region Hooks

  // After first render, set preview panel min-height equal to left list height
  useEffect(() => {
    if (leftPanelRef.current) {
      setLeftHeight(leftPanelRef.current.offsetHeight)
    }
  }, [])

  useEffect(() => {
    // Initialize form data based on field names
    const initialData = {}
    fields.forEach((field) => {
      if (field.config.value.param.const) {
        initialData[field.name] = field.config.value.param.const
      } else if (field.config.value.param.type.endsWith('[]')) {
        initialData[field.name] = []
      } else if (field.config.value.param.type === 'boolean') {
        initialData[field.name] = false
      } else if (
        field.config.value.param.type === 'integer' ||
        field.config.value.param.type === 'float'
      ) {
        initialData[field.name] = 0
      } else {
        initialData[field.name] = ''
      }
    })
    setFormData(initialData)
  }, [fields])

  useEffect(() => {
    const fieldsObj = fields.reduce((acc, field) => {
      acc[field.name] = field.config
      return acc
    }, {})
    setReplyString(JSON.stringify(fieldsObj, null, 2))
  }, [fields])

  // #endregion

  // #region Main Component Helpers

  // Helper: Update a nested property inside the field's config.
  const updateNestedProperty = (index, property, value) => {
    const field = fields[index]
    // Clone the existing config
    const newConfig = { ...field.config }

    // Decide where to store the property:
    switch (property) {
      case 'description':
        newConfig.description = value
        break
      case 'regex':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, regex: value },
        }
        break
      case 'required':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, optional: !value },
        }
        break
      case 'inputType':
        // Update the widget type; note: this should update config.value.param.input
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, input: value },
        }
        break
      case 'min':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, minimum: Number(value) },
        }
        break
      case 'max':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, maximum: Number(value) },
        }
        break
      case 'markdown':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, markdown: value },
        }
        break
      case 'scroll':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, scroll: value },
        }
        break
      case 'inGroup':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, inGroup: value },
        }
        break
      case 'maxSize':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, maxSize: Number(value) },
        }
        break
      case 'extensions':
        // Assume value is a comma-separated string; convert to an array of trimmed strings
        newConfig.value = {
          ...newConfig.value,
          param: {
            ...newConfig.value.param,
            extensions: value.split(',').map((s) => s.trim()),
          },
        }
        break
      case 'options':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, enum: value },
        }
        break
      case 'hidden':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, hidden: value },
        }
        break
      default:
        break
    }
    console.log(`Updating field ${index} with new config:`, newConfig)
    // Update name field separately
    if (property === 'name') {
      updateField(index, { name: value, config: newConfig })
    } else {
      updateField(index, { config: newConfig })
    }
  }

  // Render a preview of the field using the appropriate widget.
  const renderField = (field, index) => {
    console.log('Rendering field:', field)
    const fieldName = field.name
    const fieldDescription = structuredClone(field.config)
    let fieldNameOverwrite = fieldDescription?.value?.param?.fieldName
    if (!fieldNameOverwrite) {
      fieldNameOverwrite = fieldName === 'authorids' ? 'Authors' : undefined
    }
    const isHiddenField = fieldDescription?.value?.param?.hidden

    const error = errors[fieldName]

    let fieldValue = formData[fieldName]
    if (fieldName === 'authorids' && note?.id) {
      if (fieldDescription?.value?.param?.const?.replace) return null
      fieldValue = formData.authorids?.map((p, i) => ({
        authorId: p,
        authorName: formData.authors?.[i],
      }))
    }

    if (fieldName === 'authors' && Array.isArray(fieldDescription?.value)) return null

    // If field type ends with '[]' and fieldValue is an empty string, set it to an empty array.
    if (fieldDescription?.value?.param?.type?.endsWith('[]') && fieldValue === '') {
      fieldValue = []
    }

    // Reveal hidden field
    if (isHiddenField) {
      fieldDescription.value.param.hidden = false
    }

    return (
      <div
        key={fieldName}
        className={`${isHiddenField ? '' : styles.fieldContainer} ${selectedIndex === index ? 'selected-field' : ''}`}
      >
        {isHiddenField && (
          <div
            style={{
              textAlign: 'left',
              fontStyle: 'italic',
              color: '#999',
              marginBottom: '4px',
            }}
          >
            <span className="glyphicon glyphicon-eye-close" style={{ marginRight: '4px' }}></span>
            Hidden to Everyone
          </div>
        )}

        <EditorComponentContext.Provider
          value={{
            invitation,
            note,
            replyToNote,
            field: { [fieldName]: fieldDescription },
            onChange: (data) =>
              setFormData((prevData) => ({ ...prevData, [fieldName]: data.value })),
            value: fieldValue,
            isWebfield: false,
            error,
            setErrors,
            clearError: () => {
              setErrors((prevErrors) => {
                if (fieldName === 'authorids') {
                  const { authorids, authors, ...rest } = prevErrors
                  return rest
                }
                const { [fieldName]: removed, ...rest } = prevErrors
                return rest
              })
            },
            // Include a fieldKey that changes when fieldDescription changes
            fieldKey: JSON.stringify(fieldDescription),
            key: JSON.stringify(fieldDescription),
          }}
        >
          <EditorComponentHeader fieldNameOverwrite={fieldNameOverwrite}>
            <EditorWidget key={JSON.stringify(fieldDescription)} />
          </EditorComponentHeader>
        </EditorComponentContext.Provider>

        {!isHiddenField && fieldDescription?.readers && (
          <EditorComponentContext.Provider
            value={{
              field: { [fieldName]: fieldDescription.readers },
            }}
          >
            <div className={styles.fieldReaders}>
              <Icon name="eye-open" />
              <span>Visible only to:</span> <EditorWidget />
            </div>
          </EditorComponentContext.Provider>
        )}
      </div>
    )
  }

  // #endregion

  // #region Handlers

  const handleOpenAddFieldDropdown = (index) => {
    // If the user clicks the same insertion point again, close it
    if (addFieldDropdownIndex === index) {
      setAddFieldDropdownIndex(null)
      setSelectedCategory(null)
    } else {
      setAddFieldDropdownIndex(index)
      setSelectedCategory(null)
    }
  }

  // Insert a new field at the specified index
  const handleAddFieldAtIndex = (insertIndex, newConfig) => {
    const newField = {
      name: `newField${fields.length + 1}`,
      config: newConfig,
      order: insertIndex + 1,
      required: true,
    }

    // Insert the new field at 'insertIndex'
    const updatedFields = [
      ...fields.slice(0, insertIndex),
      newField,
      ...fields.slice(insertIndex),
    ]

    // Reassign 'order' for each field
    for (let idx = 0; idx < updatedFields.length; idx += 1) {
      updatedFields[idx].order = idx + 1
    }

    // Update the editor state using your existing hook’s updateField
    updatedFields.forEach((fieldObj, i) => {
      updateField(i, fieldObj)
    })

    // Close the dropdown
    setAddFieldDropdownIndex(null)
    setSelectedCategory(null)
  }

  const moveFieldUp = (index) => {
    if (index === 0) return
    const newFields = [...fields]
    const temp = newFields[index - 1]
    newFields[index - 1] = newFields[index]
    newFields[index] = temp
    for (let idx = 0; idx < newFields.length; idx += 1) {
      newFields[idx].order = idx + 1
    }
    // Update both swapped fields using updateField via the hook
    updateField(index, newFields[index])
    updateField(index - 1, newFields[index - 1])
    if (selectedIndex === index) {
      selectField(index - 1)
    } else if (selectedIndex === index - 1) {
      selectField(index)
    }
  }

  const moveFieldDown = (index) => {
    if (index === fields.length - 1) return
    const newFields = [...fields]
    const temp = newFields[index + 1]
    newFields[index + 1] = newFields[index]
    newFields[index] = temp
    for (let idx = 0; idx < newFields.length; idx += 1) {
      newFields[idx].order = idx + 1
    }
    updateField(index, newFields[index])
    updateField(index + 1, newFields[index + 1])
    if (selectedIndex === index) {
      selectField(index + 1)
    } else if (selectedIndex === index + 1) {
      selectField(index)
    }
  }

  const addOption = () => {
    const currentOptions =
      fields[selectedIndex].config.value.param.enum ||
      fields[selectedIndex].config.value.param.items ||
      []
    // Check if values in array are objects or strings
    // If they are objects, add a new object with empty values
    if (currentOptions.length > 0 && typeof currentOptions[0] === 'object') {
      const newOptions = [...currentOptions, { value: '', description: '' }]
      updateNestedProperty(selectedIndex, 'options', newOptions)
      return
    }
    if (
      fields[selectedIndex].config.value.param.type === 'string[]' ||
      (currentOptions.length > 0 && typeof currentOptions[0] === 'string')
    ) {
      const newOptions = [...currentOptions, '']
      updateNestedProperty(selectedIndex, 'options', newOptions)
      return
    }
    const newOptions = [...currentOptions, { value: '', description: '' }]
    updateNestedProperty(selectedIndex, 'options', newOptions)
  }

  const removeOption = (optionIndex) => {
    const currentOptions =
      fields[selectedIndex].config.value.param.enum ||
      fields[selectedIndex].config.value.param.items ||
      []
    const newOptions = currentOptions.filter((_, i) => i !== optionIndex)
    updateNestedProperty(selectedIndex, 'options', newOptions)
  }

  const handleDeleteField = (index) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      deleteField(index)
    }
  }

  // #endregion

  return (
    <div
      style={{
        display: 'flex',
        paddingBottom: '3em',
        paddingTop: '1em',
      }}
    >
      <style>{`
        .invitation-content-editor {
          padding: 20px;
        }
        .fields-list .panel {
          margin-bottom: 20px;
        }
        .fields-list .list-group-item {
          cursor: pointer;
        }
        .field-row {
          display: flex;
          align-items: stretch;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
        }
        .field-row:hover {
          background-color: #f9f9f9;
        }
        .field-row.selected {
          border-left: 2px solid #1b8ceb; /* brand color */
          background-color: #eef6fc;      /* pastel shade of the same color */
        }
        .field-controls {
          width: 50px;
          display: flex;
          flex-direction: column;
        }
        .control-buttons button {
          margin: 2px 0;
        }
      `}</style>

      {/* Flex container for the field list and field editor */}
      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: activeTab === 'json-fields' ? 1 : 3,
            maxHeight: '90vh', // overall max height for the entire column
          }}
        >
          <Tabs>
            <TabNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
            {/* Field List */}
            <div
              className="form-preview"
              style={{
                flex: 1,
                overflowY: 'auto',
                resize: 'vertical',
                maxHeight: '90vh', // overall max height for the entire column
              }}
            >
              <TabPanels>
                <TabPanel id="preview-fields">
                  {fields.map((field, idx) => (
                    <FieldRow
                      key={idx}
                      index={idx}
                      field={field}
                      addFieldDropdownIndex={addFieldDropdownIndex}
                      handleOpenAddFieldDropdown={handleOpenAddFieldDropdown}
                      setAddFieldDropdownIndex={setAddFieldDropdownIndex}
                      handleAddFieldAtIndex={handleAddFieldAtIndex}
                      selectedIndex={selectedIndex}
                      selectField={selectField}
                      handleDeleteField={handleDeleteField}
                      moveFieldUp={moveFieldUp}
                      moveFieldDown={moveFieldDown}
                      renderField={renderField}
                    />
                  ))}
                  <InsertFieldButton
                    index={fields.length} // insertion after the last field
                    isOpen={addFieldDropdownIndex === fields.length}
                    onOpen={handleOpenAddFieldDropdown}
                    onClose={() => setAddFieldDropdownIndex(null)}
                    onAddField={handleAddFieldAtIndex}
                  />
                  <button type="button" className="btn btn-primary" onClick={() => null}>
                    Save Changes
                  </button>
                </TabPanel>
                <TabPanel id="json-fields">
                  <CodeEditor code={replyString} readOnly={false} isJson />
                </TabPanel>
              </TabPanels>
            </div>
          </Tabs>
        </div>

        {/* Field Editor */}
        {activeTab !== 'json-fields' && (
          <div
            className="col-sm-3 field-editor"
            style={{ flex: 2, padding: '10px', borderLeft: '1px solid #ccc' }}
          >
            {selectedIndex !== null ? (
              <div>
                <h3>Field Options</h3>
                <BasicFieldOptions
                  field={fields[selectedIndex]}
                  selectedIndex={selectedIndex}
                  updateNestedProperty={updateNestedProperty}
                />

                {/* Choice Fields */}
                {fields[selectedIndex].config.value.param.enum &&
                  fields[selectedIndex].config.value.param.enum.length >= 0 && (
                    <ChoiceFieldOptions
                      param={fields[selectedIndex].config.value.param}
                      selectedIndex={selectedIndex}
                      updateNestedProperty={updateNestedProperty}
                      removeOption={removeOption}
                      addOption={addOption}
                    />
                  )}

                {/* String Field Options */}
                {fields[selectedIndex].config.value.param.type === 'string' && (
                  <StringFieldOptions
                    param={fields[selectedIndex].config.value.param}
                    selectedIndex={selectedIndex}
                    updateNestedProperty={updateNestedProperty}
                  />
                )}

                {/* Numeric Fields */}
                {(fields[selectedIndex].config.value.param.type === 'integer' ||
                  fields[selectedIndex].config.value.param.type === 'float') && (
                  <NumericFieldOptions
                    param={fields[selectedIndex].config.value.param}
                    selectedIndex={selectedIndex}
                    updateNestedProperty={updateNestedProperty}
                  />
                )}

                {/* Special Field Options */}
                <SpecialFieldOptions
                  param={fields[selectedIndex].config.value.param}
                  selectedIndex={selectedIndex}
                  updateNestedProperty={updateNestedProperty}
                />
              </div>
            ) : (
              <p>Select a field to edit its properties</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveContentFieldEditor
