/* globals promptError, promptMessage: false */
import React, { useContext, useState, useEffect, useRef } from 'react'
import api from '../../lib/api-client'
import EditorSection from '../EditorSection'
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

// First-level data types (top-level)
const DATA_TYPE_OPTIONS = {
  TEXT: { label: 'Text', type: 'string' },
  INTEGER: { label: 'Integer', type: 'integer' },
  DECIMAL: { label: 'Decimal', type: 'float' },
  BOOLEAN: { label: 'Boolean', type: 'boolean' },
  SPECIAL: { label: 'Special', type: 'special' } // We'll handle "special" differently
}

// For all standard data types (string, integer, float, boolean),
// we have sub-options: Single Choice, Multiple Choice, etc.
const INPUT_TYPE_OPTIONS = [
  { label: 'Single Choice', input: 'radio' },
  { label: 'Multiple Choice', input: 'checkbox' },
  { label: 'Small Textbox', input: 'text' },
  { label: 'Large Textbox', input: 'textarea' }
]

// For “special” data type, we have sub-types that map 1:1 to param.type
const SPECIAL_TYPE_OPTIONS = [
  { label: 'Date', type: 'date' },
  { label: 'File', type: 'file' },
  { label: 'Profile', type: 'profile' },
  { label: 'Group', type: 'group' }
]

/**
 * Generate an initial field config object
 * based on the top-level data type and second-level choice.
 */
const generateFieldConfig = (topLevelChoice, secondLevelChoice) => {
  // If topLevelChoice is "SPECIAL",
  // secondLevelChoice must be one of the special sub-types
  if (topLevelChoice.type === 'special') {
    // Find the special sub-type object (e.g. { label: 'Date', type: 'date' })
    const special = SPECIAL_TYPE_OPTIONS.find(s => s.label === secondLevelChoice)
    return {
      description: '',
      value: {
        param: {
          type: special.type,
          // The rest of the defaults for these special fields:
          optional: false
        }
      }
    }
  }

  // Otherwise, topLevelChoice is string/integer/float/boolean,
  // and secondLevelChoice is Single Choice / Multiple Choice /
  // Small Textbox / Large Textbox.
  // 1. dataType
  const baseType = topLevelChoice.type // 'string' | 'integer' | 'float' | 'boolean'
  // 2. input type
  const inputChoice = INPUT_TYPE_OPTIONS.find(i => i.label === secondLevelChoice)

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
        optional: false
      }
    }
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


const InsertFieldButton = ({
  index,
  isOpen,
  selectedCategory,
  onOpen,
  onClose,
  onSelectCategory,
  onAddField
}) => {
  // Are we in step 1 or step 2?
  const [selectedTopLevel, setSelectedTopLevel] = React.useState(null)

  // Step 2 choices are either input types or special sub-types
  const getSecondLevelOptions = () => {
    if (!selectedTopLevel) return []
    if (selectedTopLevel.type === 'special') {
      return SPECIAL_TYPE_OPTIONS.map(s => s.label)
    }
    return INPUT_TYPE_OPTIONS.map(i => i.label)
  }

  const secondLevelOptions = getSecondLevelOptions()

  const handleSelectTopLevel = (key) => {
    const topLevel = Object.values(DATA_TYPE_OPTIONS).find(t => t.label === key)
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
        <div
          style={linePlusStyle}
          onClick={() => (isOpen ? onClose() : onOpen(index))}
        >
          <div style={{ flex: 1, borderBottom: '1px solid #ccc' }}></div>
          <span className='glyphicon glyphicon-plus' style={{ color: 'green', margin: '0 8px' }}></span>
          <div style={{ flex: 1, borderBottom: '1px solid #ccc' }}></div>
        </div>

        {/* Dropdown (only visible if isOpen=true) */}
        {isOpen && (
          <div style={dropdownStyle}>
            {/* If no category selected yet, list categories */}
            {!selectedTopLevel && (
              <ul className="fade-in-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {Object.values(DATA_TYPE_OPTIONS).map((top) => (
                  <li key={top.label} style={{ margin: '4px 0' }}>
                    <button type="button" onClick={() => handleSelectTopLevel(top.label)}>
                      {top.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* If a category is selected, list field types */}
            {selectedTopLevel && (
              <ul className="fade-in-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {secondLevelOptions.map((fieldName) => (
                  <li key={fieldName} style={{ margin: '4px 0' }}>
                    <button type="button" onClick={() => handleSelectSecondLevel(fieldName)}>
                      {fieldName}
                    </button>
                  </li>
                ))}
                <li style={{ margin: '4px 0' }}>
                  <button type="button" onClick={() => setSelectedTopLevel(null)}>
                    ← Back to Categories
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  )

}

const LiveContentFieldEditor = ({
  propInvitation,
  propExistingValues,
  onContentChange
}) => {
  // Use invitation from prop or context
  const context = useContext(EditorComponentContext)
  const invitation = context.invitation || propInvitation
  const contentFields = context.value || propExistingValues
  console.log(invitation)

  // UI states
  const leftPanelRef = useRef(null)
  const [leftHeight, setLeftHeight] = useState(null)
  const [activeTab, setActiveTab] = useState('preview-fields')
  const [replyString, setReplyString] = useState('')

  // After first render, set preview panel min-height equal to left list height
  useEffect(() => {
    if (leftPanelRef.current) {
      setLeftHeight(leftPanelRef.current.offsetHeight)
    }
  }, [])

  // Mock note and replyToNote objects
  const note = { id: invitation.id }
  const replyToNote = null

  // Build initial fields from the invitation content.
  console.log(contentFields)
  const initialFields = Object.entries(contentFields).map(([name, config]) => ({
    name,
    config, // the entire original configuration (this is the authoritative data)
    // For backward compatibility, you may also copy some top-level properties:
    description: config.description,
    order: config.order,
    required: !config.value.param.optional,
  }))

  // Use the custom hook for state management.
  const {
    fields,
    selectedIndex,
    selectedField,
    selectField,
    updateField,
    addField,
    deleteField,
  } = useFieldEditorState(initialFields)

  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({})

  // Option adding logic
  // Track which insertion point (if any) has the dropdown open
  const [addFieldDropdownIndex, setAddFieldDropdownIndex] = useState(null)

  // Track the currently selected category in the dropdown
  const [selectedCategory, setSelectedCategory] = useState(null)

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

  const handleSelectCategory = (categoryName) => {
    setSelectedCategory(categoryName)
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

  const validateField = (fieldName, value) => {
    const fieldConfig = fields.find((f) => f.name === fieldName)
    let error = ''
    // Use the nested regex from config.value.param if available
    if (
      fieldConfig?.config?.value?.param?.regex &&
      !new RegExp(fieldConfig.config.value.param.regex).test(value)
    ) {
      error = 'Invalid format'
    }
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: error,
    }))
  }

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

  // Replace direct updateField calls in handlers with updateNestedProperty where appropriate.
  const handleFieldPropertyChange = (property, value) => {
    updateNestedProperty(selectedIndex, property, value)
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

  const handleOptionChange = (optionIndex, property, value) => {
    const newOptions = [
      ...(fields[selectedIndex].config.value.param.enum ||
        fields[selectedIndex].config.value.param.items ||
        []),
    ]
    newOptions[optionIndex] = { ...newOptions[optionIndex], [property]: value }
    // Decide whether to update enum or items based on field type:
    if (fields[selectedIndex].type.endsWith('[]')) {
      updateNestedProperty(selectedIndex, 'options', newOptions) // caller expects options update will handle items internally
    } else {
      updateNestedProperty(selectedIndex, 'options', newOptions)
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

  const handleCheckboxChange = (property, checked) => {
    updateNestedProperty(selectedIndex, property, checked)
  }

  const handleInputTypeChange = (inputType) => {
    updateNestedProperty(selectedIndex, 'inputType', inputType)
  }

  const handleDeleteField = (index) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      deleteField(index)
    }
  }

  const generateContentJson = () => {
    const content = {}
    fields.forEach((field) => {
      const fieldName = field.name
      content[fieldName] = {}
      // Use the nested config as the authoritative source
      if (field.config.description && field.config.description.trim() !== '') {
        content[fieldName].description = field.config.description.trim()
      }
      content[fieldName].order = field.order
      content[fieldName].value = { param: {} }
      content[fieldName].value.param.type = field.type

      // If options exist, update the nested enum or items
      if (field.config.value.param.enum || field.config.value.param.items) {
        if (field.config.value.param.type.endsWith('[]')) {
          content[fieldName].value.param.items = (field.config.value.param.items || []).map(
            (option) =>
              option.description && option.description.trim() !== ''
                ? { value: option.value, description: option.description }
                : option.value
          )
        } else {
          content[fieldName].value.param.enum = (field.config.value.param.enum || []).map(
            (option) =>
              option.description && option.description.trim() !== ''
                ? { value: option.value, description: option.description }
                : option.value
          )
        }
        content[fieldName].value.param.input =
          field.config.value.param.input ||
          (field.config.value.param.enum?.length > 5 ? 'select' : 'radio')
        if (!field.required) {
          content[fieldName].value.param.optional = true
        }
      } else {
        if (field.type === 'string') {
          if (field.config.value.param.regex && field.config.value.param.regex.trim() !== '') {
            content[fieldName].value.param.regex = field.config.value.param.regex
          }
          if (field.config.value.param.input === 'textarea') {
            content[fieldName].value.param.markdown =
              field.config.value.param.markdown || false
            content[fieldName].value.param.scroll = field.config.value.param.scroll || false
          }
        }
        if (field.type === 'integer' || field.type === 'float') {
          if (
            field.config.value.param.minimum !== undefined &&
            field.config.value.param.minimum !== null
          ) {
            content[fieldName].value.param.minimum = Number(field.config.value.param.minimum)
          }
          if (
            field.config.value.param.maximum !== undefined &&
            field.config.value.param.maximum !== null
          ) {
            content[fieldName].value.param.maximum = Number(field.config.value.param.maximum)
          }
        }
        if (field.type === 'file') {
          if (
            field.config.value.param.extensions &&
            field.config.value.param.extensions.length > 0
          ) {
            content[fieldName].value.param.extensions =
              field.config.value.param.extensions.slice()
          }
          if (field.config.value.param.maxSize) {
            content[fieldName].value.param.maxSize = Number(field.config.value.param.maxSize)
          }
        }
        if (!field.required) {
          content[fieldName].value.param.optional = true
        }
      }
    })
    return content
  }

  const saveChanges = async () => {
    const contentJson = generateContentJson()
    try {
      await api.post('/invitations', { content: contentJson })
      promptMessage('Content fields updated successfully', { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  /*
  useEffect(() => {
    if (onContentChange) {
      const contentJson = generateContentJson()
      onContentChange(contentJson)
    }
  }, [fields, onContentChange])
  */

  // Render a preview of the field using the appropriate widget.
  const renderField = (field, index) => {
    console.log('Rendering field:', field)
    const fieldName = field.name
    const fieldDescription = field.config
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

    return (
      <div
        key={fieldName}
        className={`${isHiddenField ? '' : styles.fieldContainer} ${selectedIndex === index ? 'selected-field' : ''}`}
      >
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

  return (
    <EditorSection title="Invitation Content Editor" className="invitation-editor">
      <div style={{ display: 'flex' }}>
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
          background-color: #eef;
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
              <TabList>
                <Tab id="preview-fields" onClick={() => setActiveTab('preview-fields')} active>
                  Live Preview
                </Tab>
                <Tab id="json-fields" onClick={() => setActiveTab('json-fields')}>
                  Raw JSON
                </Tab>
              </TabList>
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
                    <form onSubmit={(e) => e.preventDefault()}>
                      {fields.map((field, idx) => (
                        <React.Fragment key={idx}>
                          <InsertFieldButton
                            index={idx}
                            isOpen={addFieldDropdownIndex === idx}
                            onOpen={handleOpenAddFieldDropdown}
                            onClose={() => setAddFieldDropdownIndex(null)}
                            onAddField={handleAddFieldAtIndex}
                          />

                          <div
                            key={idx}
                            className={`field-row ${selectedIndex === idx ? 'selected' : ''}`}
                            onClick={() => selectField(idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'stretch',
                              marginBottom: '15px',
                              marginRight: '2em',
                            }}
                          >
                            {/* Field Controls */}
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
                                  onClick={() => handleDeleteField(idx)}
                                  aria-label="Remove field"
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'red',
                                    fontSize: '0.75em'
                                  }}
                                >
                                  <span
                                    className="glyphicon glyphicon-remove"
                                    aria-hidden="true"
                                  ></span>
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
                                  onClick={() => moveFieldUp(idx)}
                                  style={{
                                    display: 'flex', // switch from block to flex
                                    justifyContent: 'center', // center the icon horizontally
                                    alignItems: 'center', // center the icon vertically
                                    marginBottom: '2px',
                                    marginLeft: '0.5rem',
                                    marginRight: '0.5rem',
                                  }}
                                  aria-label="Move field up"
                                >
                                  <span
                                    className="glyphicon glyphicon-chevron-up"
                                    aria-hidden="true"
                                  ></span>
                                </button>
                                <div className="field-index" style={{ fontWeight: 'bold' }}>
                                  {idx + 1}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-default btn-xs"
                                  onClick={() => moveFieldDown(idx)}
                                  style={{
                                    display: 'flex', // switch from block to flex
                                    justifyContent: 'center', // center the icon horizontally
                                    alignItems: 'center', // center the icon vertically
                                    marginLeft: '0.5rem',
                                    marginRight: '0.5rem',
                                    marginTop: '2px',
                                  }}
                                  aria-label="Move field down"
                                >
                                  <span
                                    className="glyphicon glyphicon-chevron-down"
                                    aria-hidden="true"
                                  ></span>
                                </button>
                              </div>
                            </div>

                            {/* Field Preview */}
                            <div style={{ flex: 1 }}>
                              {renderField(field, idx)}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                      <InsertFieldButton
                        index={fields.length} // insertion after the last field
                        isOpen={addFieldDropdownIndex === fields.length}
                        onOpen={handleOpenAddFieldDropdown}
                        onClose={() => setAddFieldDropdownIndex(null)}
                        onAddField={handleAddFieldAtIndex}
                      />
                      <button type="button" className="btn btn-primary" onClick={saveChanges}>
                        Save Changes
                      </button>
                    </form>
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
                  <div className="form-group">
                    <label htmlFor='fieldName'>Field Name</label>
                    <input
                      type="text"
                      value={fields[selectedIndex].name}
                      onChange={(e) =>
                        updateNestedProperty(selectedIndex, 'name', e.target.value)
                      }
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor='descriptionField'>Description</label>
                    <textarea
                      value={fields[selectedIndex].config.description || ''}
                      onChange={(e) =>
                        updateNestedProperty(selectedIndex, 'description', e.target.value)
                      }
                      className="form-control"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        height: '20vh', // fixed height
                        resize: 'vertical', // allow user to resize only vertically
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ marginRight: '5px' }}>
                      <input
                        type="checkbox"
                        checked={!fields[selectedIndex].config.value.param.optional}
                        onChange={(e) =>
                          updateNestedProperty(selectedIndex, 'required', e.target.checked)
                        }
                        style={{ marginRight: '5px' }}
                      />
                      Required
                    </label>
                  </div>

                  {/* Choice Fields */}
                  {fields[selectedIndex].config.value.param.enum &&
                    fields[selectedIndex].config.value.param.enum.length >= 0 && (
                      <>
                        <div className="form-group">
                          <label htmlFor='inputType'>Input Type</label>
                          <select
                            className="form-control"
                            value={fields[selectedIndex].config.value.param.input}
                            onChange={(e) =>
                              updateNestedProperty(selectedIndex, 'inputType', e.target.value)
                            }
                          >
                            <option value="select">Dropdown</option>
                            <option value="radio">Radio Buttons</option>
                            <option value="checkbox">Checkboxes</option>
                          </select>
                        </div>
                        {fields[selectedIndex].config.value.param.enum.map((option, index) => (
                          <div key={index} className="form-group">
                            <label>Option {index + 1}</label>
                            {!(typeof option === 'object') && (
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions =
                                    fields[selectedIndex].config.value.param.enum
                                  newOptions[index] = e.target.value
                                  updateNestedProperty(selectedIndex, 'options', newOptions)
                                }}
                                className="form-control"
                                placeholder="Value"
                              />
                            )}
                            {((typeof option === 'object' && 'value' in option) ?? null) && (
                              <input
                                type="text"
                                value={option.value}
                                onChange={(e) => {
                                  const newOptions = [
                                    ...fields[selectedIndex].config.value.param.enum,
                                  ]
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
                            {((typeof option === 'object' && 'description' in option) ??
                              null) && (
                              <input
                                type="text"
                                value={option.description}
                                onChange={(e) => {
                                  const newOptions = [
                                    ...fields[selectedIndex].config.value.param.enum,
                                  ]
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
                            <button
                              className="btn btn-link"
                              type="button"
                              onClick={() => removeOption(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button className="btn btn-link" type="button" onClick={addOption}>
                          Add Option
                        </button>
                      </>
                    )}

                  {/* String Field Options */}
                  {fields[selectedIndex].config.value.param.type === 'string' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="regexInput" style={{ marginRight: '5px' }}>Regex Validation</label>
                        <input
                          type="text"
                          id="regexInput"
                          value={fields[selectedIndex].config.value.param.regex || ''}
                          onChange={(e) =>
                            updateNestedProperty(selectedIndex, 'regex', e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                      {fields[selectedIndex].config.value.param.input === 'textarea' && (
                        <>
                          <div className="form-group">
                            <label htmlFor='textFieldOptions'>Text Field Options</label>
                            <div>
                              <label style={{ marginRight: '5px' }}>
                                <input
                                  type="checkbox"
                                  checked={
                                    fields[selectedIndex].config.value.param.markdown || false
                                  }
                                  onChange={(e) =>
                                    updateNestedProperty(
                                      selectedIndex,
                                      'markdown',
                                      e.target.checked
                                    )
                                  }
                                  style={{ marginRight: '5px' }}
                                />
                                Enable Markdown
                              </label>
                              <label style={{ marginRight: '5px' }}>
                                <input
                                  type="checkbox"
                                  checked={
                                    fields[selectedIndex].config.value.param.scroll || false
                                  }
                                  onChange={(e) =>
                                    updateNestedProperty(
                                      selectedIndex,
                                      'scroll',
                                      e.target.checked
                                    )
                                  }
                                  style={{ marginRight: '5px' }}
                                />
                                Scrollable text box
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Numeric Fields */}
                  {(fields[selectedIndex].config.value.param.type === 'integer' ||
                    fields[selectedIndex].config.value.param.type === 'float') && (
                    <>
                      <div className="form-group">
                        <label htmlFor='numMin'>Minimum</label>
                        <input
                          type="number"
                          value={fields[selectedIndex].config.value.param.minimum || ''}
                          onChange={(e) =>
                            updateNestedProperty(selectedIndex, 'min', e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor='numMax'>Maximum</label>
                        <input
                          type="number"
                          value={fields[selectedIndex].config.value.param.maximum || ''}
                          onChange={(e) =>
                            updateNestedProperty(selectedIndex, 'max', e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                    </>
                  )}

                  {/* File Field Options */}
                  {fields[selectedIndex].config.value.param.type === 'file' && (
                    <>
                      <div className="form-group">
                        <label htmlFor='allowedExt'>Allowed Extensions</label>
                        <input
                          type="text"
                          value={
                            (fields[selectedIndex].config.value.param.extensions || []).join(
                              ', '
                            ) || ''
                          }
                          onChange={(e) =>
                            updateNestedProperty(selectedIndex, 'extensions', e.target.value)
                          }
                          className="form-control"
                          placeholder="e.g., pdf, zip"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor='maxSize'>Max Size (MB)</label>
                        <input
                          type="number"
                          value={fields[selectedIndex].config.value.param.maxSize || ''}
                          onChange={(e) =>
                            updateNestedProperty(selectedIndex, 'maxSize', e.target.value)
                          }
                          className="form-control"
                          placeholder="e.g., 50"
                        />
                      </div>
                    </>
                  )}

                  {/* Profile Field Options */}
                  {fields[selectedIndex].config.value.param.type === 'profile' && (
                    <div className="form-group">
                      <label htmlFor='allowedGroup'>Allowed Group ID for Profiles</label>
                      <ProfileSearchWidget
                        onChange={(value) =>
                          updateNestedProperty(selectedIndex, 'inGroup', value)
                        }
                        value={fields[selectedIndex].config.value.param.inGroup || []}
                      />
                    </div>
                  )}

                  {/* Group Field Options */}
                  {fields[selectedIndex].config.value.param.type === 'group' && (
                    <div className="form-group">
                      <label htmlFor='allowedGroupId'>Allowed Group ID</label>
                      <input
                        type="text"
                        value={fields[selectedIndex].config.value.param.inGroup || ''}
                        onChange={(e) =>
                          updateNestedProperty(selectedIndex, 'inGroup', e.target.value)
                        }
                        className="form-control"
                      />
                    </div>
                  )}

                  {/* Date Field Options */}
                  {fields[selectedIndex].config.value.param.type === 'date' && (
                    <div className="form-group">
                      <label htmlFor='selectDate'>Select Date</label>
                      <DatePickerWidget
                        onChange={(date) => updateNestedProperty(selectedIndex, 'date', date)}
                        value={fields[selectedIndex].config.value.param.date || new Date()}
                        showTime={true}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p>Select a field to edit its properties</p>
              )}
            </div>
          )}
        </div>
      </div>
    </EditorSection>
  )
}

export default LiveContentFieldEditor
