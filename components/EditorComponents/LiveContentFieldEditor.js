/* globals promptError, promptMessage: false */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../../lib/api-client'
import CodeEditor from '../CodeEditor'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import LoadingSpinner from '../LoadingSpinner'

import ProfileSearchWidget from './ProfileSearchWidget'
import DatePickerWidget from './DatePickerWidget'
import EditorComponentContext from '../EditorComponentContext'
import EditorComponentHeader from './EditorComponentHeader'
import EditorWidget from '../webfield/EditorWidget'
import Icon from '../Icon'
import noteEditorStyles from '../../styles/components/NoteEditor.module.scss'
import styles from '../../styles/components/LiveContentFieldEditor.module.scss'
import useFieldEditorState from '../../hooks/useFieldEditorState'

/*
Adding new options for a field:

- Add a new div to one of the Field Options components
<div className="form-group">
  <label htmlFor="newFieldKey">New Field</label>
  <input
    type="number"
    value={param.newField || ''}
    onChange={(e) => updateNestedProperty(selectedIndex, 'newField', e.target.value)}
    className="form-control"
  />
</div>
- Add a new case to the LiveContentFieldEditor updateNestedProperty function
case 'newField':
  newConfig.value = {
    ...newConfig.value,
    param: { ...newConfig.value.param, newField: value },
  }
  break

================================================================================================
Adding a new category of options:
- Create a new component that is a series of <div> elements in the form above
- Accept the same props as the other Field Options components
({ param, selectedIndex, updateNestedProperty })
- Add a new conditionally rendered option to the LiveContentFieldEditor component
{passesBooleanCondition(fields[selectedIndex].config.value.param.newField) && (
<NewFieldOptions
  param={fields[selectedIndex].config.value.param}
  selectedIndex={selectedIndex}
  updateNestedProperty={updateNestedProperty}
/>
)}

*/

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
  DATE: {
    label: 'Date',
    type: 'date',
    allowedInputs: ['single'],
  },
  FILE: {
    label: 'File',
    type: 'file',
    allowedInputs: ['single'],
  },
  PROFILE: {
    label: 'Profile',
    type: 'profile',
    allowedInputs: ['multiple'],
  },
  GROUP: {
    label: 'Group',
    type: 'group',
    allowedInputs: ['multiple'],
  },
}

// For all standard data types (string, integer, float, boolean),
// we have sub-options: Single Choice, Multiple Choice, etc.
const INPUT_TYPE_OPTIONS = [
  { label: 'Single Choice', input: 'radio' },
  { label: 'Multiple Choice', input: 'checkbox' },
  { label: 'Small Textbox', input: 'text' },
  { label: 'Large Textbox', input: 'textarea' },
  { label: 'Single Item', input: 'single' },
  { label: 'Multiple Items', input: 'multiple' },
]

// For “special” data type, we have sub-types that map 1:1 to param.type
const SPECIAL_TYPE_ARRAY = ['date', 'file', 'profile', 'group']
const SPECIAL_TYPE_OPTIONS = {
  Date: {},
  File: {},
  Profile: {
    mismatchError: 'must be a valid email or profile ID',
    regex:
      "^~\\S+$|^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$",
  },
  Group: {},
}

// #region Helper Functions

const generateFieldConfig = (topLevelChoice, secondLevelChoice) => {
  // If topLevelChoice is "SPECIAL",
  // secondLevelChoice must be one of the special sub-types
  if (Object.keys(SPECIAL_TYPE_OPTIONS).includes(topLevelChoice.label)) {
    return {
      description: '',
      value: {
        param: {
          type:
            secondLevelChoice === 'Multiple Items'
              ? `${topLevelChoice.type}[]`
              : topLevelChoice.type,
          ...SPECIAL_TYPE_OPTIONS[topLevelChoice.label],
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

const TabNavigation = ({ activeTab, onTabChange, isPreviewDisabled, previewErrorMessage }) => (
  <TabList>
    <Tab
      id="preview-fields"
      onClick={() => onTabChange('preview-fields')}
      active={activeTab === 'preview-fields'}
      // When disabled, change the cursor and opacity
      className={isPreviewDisabled ? styles.disabledTab : ''}
      hidden={isPreviewDisabled}
      // Tooltip for hover over error
      title={isPreviewDisabled ? `Cannot preview: ${previewErrorMessage}` : ''}
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

// #endregion

// #region Top Level Field Components

const InsertFieldButton = ({ index, isOpen, onOpen, onClose, onAddField }) => {
  // Are we in step 1 or step 2?
  const [selectedTopLevel, setSelectedTopLevel] = React.useState(null)
  // "forward" means transitioning from top-level -> second-level,
  // "backward" means transitioning from second-level -> top-level.
  const [animationDirection, setAnimationDirection] = useState("backward")
  const dropdownRef = useRef(null)

  // Track whether the user is hovering over the insertion area
  const [isHovered, setIsHovered] = React.useState(false)

  // We want the line/plus to be visible if hovered OR if dropdown is open
  const shouldShowLine = isHovered || isOpen
  const linePlusContainerClass = `
    ${styles.linePlusContainer} ${shouldShowLine ? styles.showLine : styles.hideLine}
  `

  // Motion variants for the list transitions. The custom prop "direction" controls:
  // - When "forward": entering list starts from right (x:20) and exiting list moves left (x:-20).
  // - When "backward": entering list starts from left (x:-20) and exiting list moves right (x:20).
  const listVariants = {
    initial: (direction) => ({
      x: direction === "forward" ? 20 : -20,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: (direction) => ({
      x: direction === "forward" ? -20 : 20,
      opacity: 0,
      transition: { duration: 0.2 },
    }),
  }

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
    setAnimationDirection("backward")
    setSelectedTopLevel(topLevel)
  }

  const handleSelectSecondLevel = (label) => {
    // We have top-level + second-level → generate a new field
    const newConfig = generateFieldConfig(selectedTopLevel, label)
    onAddField(index, newConfig)
    // reset local state & close
    setAnimationDirection("forward")
    setSelectedTopLevel(null)
    onClose()
  }

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      requestAnimationFrame(() => {
        dropdownRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      })
    }
  }, [isOpen])


  return (
    <>
      <div
        className={styles.insertFieldButtonWrapper}
        // Hover tracking
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* The horizontal line + plus icon */}
        <div className={linePlusContainerClass} onClick={() => (isOpen ? onClose() : onOpen(index))}>
          <div className={styles.flexLine}></div>
          <span
            className={`glyphicon glyphicon-plus ${styles.plusIcon}`}
          ></span>
          <div className={styles.flexLine}></div>
        </div>

        {/* Dropdown (only visible if isOpen=true) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="dropdown"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.dropdownContainer}>
                {/* If no category selected yet, list categories */}
                {!selectedTopLevel && (
                  <motion.ul
                    key="topList"
                    custom={animationDirection}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={listVariants}
                    className={styles.fadeInList}
                  >
                    {Object.values(DATA_TYPE_OPTIONS).map((top, idx, arr) => {
                      const isLast = idx === arr.length - 1
                      return (
                        <li key={top.label}>
                          <button
                            className="btn btn-default"
                            type="button"
                            ref={isLast ? dropdownRef : null}
                            onClick={() => handleSelectTopLevel(top.label)}
                          >
                            {top.label}
                          </button>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}

                {/* If a category is selected, list field types */}
                {selectedTopLevel && (
                  <motion.ul
                    key="secondList"
                    custom={animationDirection}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={listVariants}
                    className={styles.fadeInList}
                  >
                    {secondLevelOptions.map((fieldName) => (
                      <li key={fieldName}>
                        <button
                          className="btn btn-default"
                          type="button"
                          onClick={() => handleSelectSecondLevel(fieldName)}
                        >
                          {fieldName}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        className="btn btn-default"
                        type="button"
                        onClick={() => {
                          // Set animation direction for "back" transition.
                          setAnimationDirection("forward")
                          setSelectedTopLevel(null)
                        }}
                      >
                        ← Back to Categories
                      </button>
                    </li>
                  </motion.ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

const HiddenFieldsToggle = ({ renderHiddenFields, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onToggle}
      className={styles.hiddenFieldsToggle}
    >
      <span
        className={`glyphicon ${
          renderHiddenFields ? 'glyphicon-eye-open' : 'glyphicon-eye-close'
        } ${styles.icon}`}
      />
      <span className={styles.text}>
        {renderHiddenFields ? 'Showing Hidden Fields' : 'Hiding Hidden Fields'}
      </span>
    </div>
  )
}

const FieldRow = ({
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
}) => (
  <>
    <InsertFieldButton
      index={index}
      isOpen={addFieldDropdownIndex === index}
      onOpen={handleOpenAddFieldDropdown}
      onClose={() => setAddFieldDropdownIndex(null)}
      onAddField={handleAddFieldAtIndex}
    />

    <div
      className={`${styles.fieldRow} ${selectedIndex === index ? styles.selected : ''}`}
      onClick={() => selectField(index)}
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

// #endregion

// #region Nested Level Field Components

const FieldControls = ({ idx, onDelete, onMoveUp, onMoveDown }) => (
  <div
    className={styles.fieldControls}
  >
    {/* Delete button at the top */}
    <div
      className={styles.deleteButton}
    >
      <button
        type="button"
        className={`close ${styles.close}`}
        onClick={() => onDelete(idx)}
        aria-label="Remove field"
      >
        <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
      </button>
    </div>
    {/* Index and Reorder Buttons Centered Vertically */}
    <div
      className={styles.controlButtons}
    >
      <button
        type="button"
        className="btn btn-default btn-xs"
        onClick={() => onMoveUp(idx)}
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
        aria-label="Move field down"
      >
        <span className="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>
      </button>
    </div>
  </div>
)

const FieldPreview = ({ field, renderField, index }) => (
  <div style={{ flex: 1 }}>{renderField(field, index)}</div>
)


const FieldOptionsPanel = ({
  field,
  selectedIndex,
  updateNestedProperty,
  fieldReaderOptions,
  removeOption,
  addOption
}) => {
  if (!field) return null

  const {param} = field.config.value
  const type = param.type || ''

  return (
    <div>
      {/* Basic Field Options */}

      <BasicFieldOptions
        field={field}
        selectedIndex={selectedIndex}
        updateNestedProperty={updateNestedProperty}
        fieldReaderOptions={fieldReaderOptions}
      />

      {/* Choice Fields */}
      {param.enum && param.enum.length >= 0 && (
        <CollapsibleSection title="Choice Field Options">
          <ChoiceFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
            removeOption={removeOption}
            addOption={addOption}
          />
        </CollapsibleSection>
      )}

      {/* String Field Options */}
      {type === 'string' && (
        <CollapsibleSection title="String Field Options">
          <StringFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
          />
        </CollapsibleSection>
      )}

      {/* Numeric Fields */}
      {(type === 'integer' || type === 'float') && (
        <CollapsibleSection title="Numeric Field Options">
          <NumericFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
          />
        </CollapsibleSection>
      )}

      {/* Special Field Options */}
      {(SPECIAL_TYPE_ARRAY.includes(type)) && (
        <SpecialFieldOptions
          param={param}
          selectedIndex={selectedIndex}
          updateNestedProperty={updateNestedProperty}
        />
      )}
    </div>
  )
}

// #endregion

// #region Shared Field Options

const CollapsibleSection = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Use different glyphicon icons for collapsed vs. expanded
  const iconClass = expanded ? 'glyphicon-menu-down' : 'glyphicon-menu-right'

  return (
    <div className={styles.collapsibleSection}>
      {/* Header */}
      <div
        onClick={() => setExpanded(prev => !prev)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={styles.collapsibleHeader}
      >
        <span className={`glyphicon ${iconClass} ${styles.collapsibleIcon}`} />
        {title}
      </div>

      {/* Collapsible Content with Framer Motion */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.collapsibleContentInner}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const BasicFieldOptions = ({
  field,
  selectedIndex,
  updateNestedProperty,
  fieldReaderOptions,
}) => {
  const currentSelections = field.config.readers || []

  // Handler when a new dropdown option is chosen
  const handleDropdownChange = (e) => {
    const selectedValue = e.target.value
    // Avoid adding duplicates.
    if (!currentSelections.includes(selectedValue)) {
      const newSelections = [...currentSelections, selectedValue]
      updateNestedProperty(selectedIndex, 'fieldReaders', newSelections)
    }
    // Set the dropdown back to the default value
    e.target.value = ''
  }

  // Handler to remove a selection (by its index)
  const removeSelection = (idxToRemove) => {
    const newSelections = currentSelections.filter((_, idx) => idx !== idxToRemove)
    updateNestedProperty(selectedIndex, 'fieldReaders', newSelections)
  }

  // To display a friendly name, find the key that maps to the stored value.
  const getDisplayName = (storedValue) =>
    Object.keys(fieldReaderOptions).find(
      (displayText) => fieldReaderOptions[displayText] === storedValue
    )

  return (
    <>
      {/* Field Name */}
      <div className={styles.formGroupOverride}>
        <label htmlFor="fieldName">Field Name</label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => updateNestedProperty(selectedIndex, 'name', e.target.value)}
          className="form-control"
        />
      </div>

      {/* Description */}
      <div className={styles.formGroupOverride}>
        <label htmlFor="descriptionField">Description</label>
        <textarea
          value={field.config.description || ''}
          onChange={(e) => updateNestedProperty(selectedIndex, 'description', e.target.value)}
          className={`form-control ${styles.descriptionTextarea}`}
        />
      </div>

      {/* Required Checkbox */}
      <div className={`${styles.formGroupOverride} ${styles.checkboxGroup}`}>
        <label>
          <input
            type="checkbox"
            checked={!field.config.value.param.optional}
            onChange={(e) => updateNestedProperty(selectedIndex, 'required', e.target.checked)}
          />
          Required
        </label>
      </div>

      <CollapsibleSection title="Advanced Field Options">
      {/* Hidden Checkbox */}
      <div className={`${styles.formGroupOverride} ${styles.checkboxGroup}`}>
        <label>
          <input
            type="checkbox"
            checked={field.config.value.param.hidden || false}
            onChange={(e) => updateNestedProperty(selectedIndex, 'hidden', e.target.checked)}
          />
          Hide from Submitters
        </label>
      </div>

      {/* Deletable Checkbox */}
      {(field.config.value.param.optional) && (
        <div className={`${styles.formGroupOverride} ${styles.checkboxGroup}`}>
          <label>
            <input
              type="checkbox"
              checked={field.config.value.param.deletable || false}
              onChange={(e) => updateNestedProperty(selectedIndex, 'deletable', e.target.checked)}
            />
            Allow users to clear this field
          </label>
        </div>
      )}

      <hr></hr>

      {/* New Section for Dropdown Selections */}
      {currentSelections && currentSelections.length > 0 && (
        <div className={styles.formGroupOverride}>
          <label htmlFor="selectedReaders">Selected Readers</label>
          <div className={styles.selectedReadersContainer}>
            {currentSelections.map((sel, idx) => (
              <span
                key={idx}
                className={styles.selectedReaderOption}
              >
                {getDisplayName(sel)}
                <span
                  className={`glyphicon glyphicon-remove ${styles.removeIcon}`}
                  onClick={() => removeSelection(idx)}
                ></span>
              </span>
            ))}
          </div>
        </div>
      )}


      {/* Dropdown to Add New Option */}
      <div className={styles.formGroupOverride}>
        <label htmlFor="addReaderOption">Restrict Readers To</label>
        <select className="form-control" onChange={handleDropdownChange} defaultValue="">
          <option value="" disabled>
            Select an option…
          </option>
          {Object.entries(fieldReaderOptions).map(([displayText, validValue]) => (
            <option key={validValue} value={validValue}>
              {displayText}
            </option>
          ))}
        </select>
      </div>
      </CollapsibleSection>
    </>
  )
}

// #endregion

// #region Multiple Choice Field Options

const ChoiceFieldOptions = ({
  param,
  selectedIndex,
  updateNestedProperty,
  removeOption,
  addOption,
}) => (
  <>
    {/* Input Type Selector */}
    <div className={styles.formGroupOverride}>
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
      <div key={index} className={styles.formGroupOverride}>
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
        <button className="btn btn-link" type="button" onClick={() => removeOption(index)} style={{marginTop: '0.25em'}}>
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

// #endregion

// #region String Field Options

const StringFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => (
  <>
    {/* Regex Validation */}
    <div className={styles.formGroupOverride}>
      <label htmlFor="regexInput">
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
      <div className={styles.formGroupOverride}>
        <label htmlFor="textFieldOptions">Text Field Options</label>
        <div>
          <label>
            <input
              type="checkbox"
              checked={param.markdown || false}
              onChange={(e) =>
                updateNestedProperty(selectedIndex, 'markdown', e.target.checked)
              }
            />
            Enable Markdown
          </label>
          <label>
            <input
              type="checkbox"
              checked={param.scroll || false}
              onChange={(e) => updateNestedProperty(selectedIndex, 'scroll', e.target.checked)}
            />
            Scrollable text box
          </label>
        </div>
      </div>
    )}
  </>
)

// #endregion

// #region Number Field Options

const NumericFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => (
  <>
    <div className={styles.formGroupOverride}>
      <label htmlFor="numMin">Minimum</label>
      <input
        type="number"
        value={param.minimum || ''}
        onChange={(e) => updateNestedProperty(selectedIndex, 'min', e.target.value)}
        className="form-control"
      />
    </div>
    <div className={styles.formGroupOverride}>
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

// #endregion

// #region Special Field Options

const SpecialFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => {
  const type = (param.type || '').replace('[]', '')

  switch (param.type) {
    case 'file':
      return (
        <CollapsibleSection title="File Field Options">
          <FileFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
          />
        </CollapsibleSection>
      )
    case 'profile':
      return (
        <CollapsibleSection title="Profile Field Options">
          <ProfileFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
          />
        </CollapsibleSection>
      )
    case 'group':
      return (
        <CollapsibleSection title="Group Field Options">
          <GroupFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
          />
        </CollapsibleSection>
      )
    case 'date':
      return (
        <CollapsibleSection title="Date Field Options">
          <DateFieldOptions
            param={param}
            selectedIndex={selectedIndex}
            updateNestedProperty={updateNestedProperty}
          />
        </CollapsibleSection>
      )
    default:
      return null
  }
}

const FileFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => (
  <>
    <div className={styles.formGroupOverride}>
      <label htmlFor="allowedExt">Allowed Extensions</label>
      <input
        type="text"
        value={(param.extensions || []).join(', ') || ''}
        onChange={(e) => updateNestedProperty(selectedIndex, 'extensions', e.target.value)}
        className="form-control"
        placeholder="e.g., pdf, zip"
      />
    </div>
    <div className={styles.formGroupOverride}>
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

const ProfileFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => (
  <div className={styles.formGroupOverride}>
    <label htmlFor="allowedGroup">Allowed Group ID for Profiles</label>
    <ProfileSearchWidget
      onChange={(value) => updateNestedProperty(selectedIndex, 'inGroup', value)}
      value={param.inGroup || []}
    />
  </div>
)

const GroupFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => (
  <div className={styles.formGroupOverride}>
    <label htmlFor="allowedGroupId">Allowed Group ID</label>
    <input
      type="text"
      value={param.inGroup || ''}
      onChange={(e) => updateNestedProperty(selectedIndex, 'inGroup', e.target.value)}
      className="form-control"
    />
  </div>
)

const DateFieldOptions = ({ param, selectedIndex, updateNestedProperty }) => (
  <div className={styles.formGroupOverride}>
    <label htmlFor="selectDate">Select Date</label>
    <DatePickerWidget
      onChange={(date) => updateNestedProperty(selectedIndex, 'date', date)}
      value={param.date || new Date()}
      showTime={true}
    />
  </div>
)

// #endregion

const LiveContentFieldEditor = ({ propInvitation, propExistingValues, onContentChange }) => {

  // #region State and Variable Management

  const leftPanelRef = useRef(null)
  const [leftHeight, setLeftHeight] = useState(null)
  const [activeTab, setActiveTab] = useState('preview-fields')
  const [renderHiddenFields, setRenderHiddenFields] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({})
  // Track which insertion point (if any) has the dropdown open
  const [addFieldDropdownIndex, setAddFieldDropdownIndex] = useState(null)
  // Track the currently selected category in the dropdown
  const [selectedCategory, setSelectedCategory] = useState(null)
  // Holds the JSON text in the editor.
  const [jsonString, setJsonString] = useState('')
  // Holds any JSON validation error message.
  const [jsonError, setJsonError] = useState(null)
  const [jsonSynced, setJsonSynced] = useState(false)

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

  // eslint-disable-next-line no-template-curly-in-string
  const SUBMISSION_SUBSTRING = '${7/content/noteNumber/value}'
  const FIELD_READER_OPTIONS = {
    'Program Chairs': `${invitation.domain}/Program_Chairs`,
    'All Senior Area Chairs': `${invitation.domain}/Senior_Area_Chairs`,
    'Assigned Senior Area Chairs': `${invitation.domain}/Submission${SUBMISSION_SUBSTRING}/Senior_Area_Chairs`,
    'All Area Chairs': `${invitation.domain}/Area_Chairs`,
    'Assigned Area Chairs': `${invitation.domain}/Submission${SUBMISSION_SUBSTRING}/Area_Chairs`,
    'All Reviewers': `${invitation.domain}/Reviewers`,
    'Assigned Reviewers': `${invitation.domain}/Submission${SUBMISSION_SUBSTRING}/Reviewers`,
  }

  // Use the custom hook for state management.
  const { fields, selectedIndex, selectField, updateField, deleteField, setAllFields } =
    useFieldEditorState(initialFields)

  // #endregion

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
      case 'deletable':
        newConfig.value = {
          ...newConfig.value,
          param: { ...newConfig.value.param, deletable: value },
        }
        break
      case 'fieldReaders':
        // If value is an empty array, remove the fieldReaders property
        newConfig.readers = value.length ? value : undefined
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
    const fieldName = field.name
    const fieldDescription = structuredClone(field.config)
    let fieldNameOverwrite = fieldDescription?.value?.param?.fieldName
    if (!fieldNameOverwrite) {
      fieldNameOverwrite = fieldName === 'authorids' ? 'Authors' : undefined
    }
    const isHiddenField = fieldDescription?.value?.param?.hidden

    // If this field is hidden and the user isn't showing hidden fields, skip it
    if (isHiddenField && !renderHiddenFields) {
      return null
    }

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
        className={`${isHiddenField ? '' : noteEditorStyles.fieldContainer} ${selectedIndex === index ? 'selected-field' : ''}`}
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
            <span
              className="glyphicon glyphicon-eye-close"
              style={{ marginRight: '4px' }}
            ></span>
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
            <div className={noteEditorStyles.fieldReaders}>
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
      updatedFields[idx].config.order = idx + 1
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
      newFields[idx].config.order = idx + 1
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
      newFields[idx].config.order = idx + 1
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

  const handleJsonChange = (newJson) => {
    if (newJson.trim().length === 0) {
      setJsonError(null)
      return
    }
    try {
      JSON.parse(newJson)
      setJsonError(null)
      setJsonString(newJson)
    } catch (e) {
      setJsonError(e.message)
    }
  }

  const handleTabChange = (newTab) => {
    if (newTab === 'json-fields') {
      // Rebuild the JSON string from the current fields state.
      const fieldsObj = fields.reduce((acc, field) => {
        acc[field.name] = field.config
        return acc
      }, {})
      setJsonString(JSON.stringify(fieldsObj, null, 2))
      setJsonSynced(true)
      setJsonError(null)
      console.log('Setting JSON string:', jsonString)
    }
    // If the JSON string is empty, treat it as valid (or show a custom message)
    if (newTab === 'preview-fields') {
      if (jsonString.trim().length === 0) {
        setJsonError(null)
      } else {
        try {
          const parsed = JSON.parse(jsonString)
          // Example: convert parsed JSON into your fields array.
          const newFields = Object.entries(parsed).map(([name, config]) => ({
            name,
            config,
            order: 0,
            required: !config.value.param?.optional ?? false,
          }))
          // Reassign order if needed
          setAllFields(newFields)
          setJsonError(null)
          setJsonSynced(false)
        } catch (e) {
          setJsonError(e.message)
          return
        }
      }
    }

    setActiveTab(newTab)
  }

  const handleToggleHiddenFields = () => {
    setRenderHiddenFields(prev => !prev)
  }

  // #endregion
  console.log('activeTab:', activeTab)
  console.log('jsonError:', jsonError)
  console.log('current Fields:', fields)
  console.log(`jsonString: |${jsonString}|`)

  // #region Main Component Render

  return (
    <div id="editor-container" className={styles.editorContainer}>
      {/* Flex container for the field list and field editor */}
      <div id="fields-container" className={styles.fieldsContainer}>
        <div
          id="fields-preview"
          className={`${styles.fieldsPreviewPanel} ${
            activeTab === 'json-fields' ? styles.leftPanelCondensed : styles.leftPanelFull
          }`}
        >
          <Tabs>
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isPreviewDisabled={jsonError !== null}
              previewErrorMessage={jsonError}
            />
            {/* Our new toggle component */}
            <HiddenFieldsToggle
              renderHiddenFields={renderHiddenFields}
              onToggle={handleToggleHiddenFields}
            />
            <TabPanels>
                <TabPanel id="preview-fields">
                  <div id="form-preview" className={styles.formPreview}>
                    {fields.map((field, idx) =>
                      (field.config.value.param.hidden && renderHiddenFields) ||
                      !field.config.value.param.hidden ? (
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
                      ) : null
                    )}
                    <InsertFieldButton
                      index={fields.length} // insertion after the last field
                      isOpen={addFieldDropdownIndex === fields.length}
                      onOpen={handleOpenAddFieldDropdown}
                      onClose={() => setAddFieldDropdownIndex(null)}
                      onAddField={handleAddFieldAtIndex}
                    />
                  </div>
                </TabPanel>
              <TabPanel id="json-fields">
                {jsonSynced ? (
                  <CodeEditor
                    code={jsonString}
                    readOnly={false}
                    isJson
                    onChange={handleJsonChange}
                  />
                ) : (
                  <LoadingSpinner inline text={null} extraClass="spinner-small" />
                )}
                <AnimatePresence>
                  {jsonError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={styles.jsonErrorMessage}
                    >
                      <span
                        className={`glyphicon glyphicon-warning-sign ${styles.jsonErrorIcon}`}
                      ></span>
                      <span>JSON Error: {jsonError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabPanel>
            </TabPanels>
          </Tabs>

        </div>

        {/* Options Editor */}
        {activeTab !== 'json-fields' && (
          <div className={`col-sm-3 ${styles.optionsPanel}`}>
            <h3>Field Options</h3>
            {selectedIndex !== null ? (
              <FieldOptionsPanel
                field={fields[selectedIndex]}
                selectedIndex={selectedIndex}
                updateNestedProperty={updateNestedProperty}
                fieldReaderOptions={FIELD_READER_OPTIONS}
                removeOption={removeOption}
                addOption={addOption}
              />
            ) : (
              <p>Select a field to edit its properties</p>
            )}
          </div>
        )}
      </div>
      <div className={styles.saveButtonWrapper}>
            <button type="button" className="btn btn-primary" onClick={() => null}>
              Save Invitation
            </button>
          </div>
    </div>
  )
}

export default LiveContentFieldEditor
