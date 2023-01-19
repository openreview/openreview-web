import dynamic from 'next/dynamic'
import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'

// #region lazy load widgets
const TagsWidget = dynamic(() => import('../EditorComponents/TagsWidget'))
const TextboxWidget = dynamic(() => import('../EditorComponents/TextboxWidget'))
const TextAreaWidget = dynamic(() => import('../EditorComponents/TextAreaWidget'))
const RadioButtonWidget = dynamic(() => import('../EditorComponents/RadioButtonWidget'))
const CheckboxWidget = dynamic(() => import('../EditorComponents/CheckboxWidget'))
const DropdownWidget = dynamic(() => import('../EditorComponents/DropdownWidget'))
const CodeEditorWidget = dynamic(() => import('../EditorComponents/CodeEditorWidget'))
const FileUploadWidget = dynamic(() => import('../EditorComponents/FileUploadWidget'))
const DatePickerWidget = dynamic(() => import('../EditorComponents/DatePickerWidget'))
const ToggleButtonWidget = dynamic(() => import('../EditorComponents/ToggleButtonWidget'))
const ProfileSearchWidget = dynamic(() => import('../EditorComponents/ProfileSearchWidget'))

// #endregion

const EditorWidget = () => {
  const { field } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  const renderConstant = (value) => {
    if (!value) return <TagsWidget values={field[fieldName].readers} readonly={true} />
    if (Array.isArray(value)) return <TagsWidget values={value} readonly={true} />
    return <TextboxWidget value={value} readonly={true} />
  }

  const renderInput = (value) => {
    const input = value.param.input
    switch (input) {
      case 'radio':
        return <RadioButtonWidget />
      case 'checkbox':
        return <CheckboxWidget />
      case 'select':
        return <DropdownWidget />
      case 'multiselect':
        return <DropdownWidget multiple={true} />
      case 'textarea':
        return <TextAreaWidget />
      case 'text':
        return <TextboxWidget />
      default:
        return null
    }
  }

  const renderType = (value) => {
    const type = value.param?.type
    if (!type) return renderConstant(value.param.const)
    switch (type) {
      case 'json':
      case 'script':
        return <CodeEditorWidget />
      case 'json[]':
      case 'script[]':
        return <CodeEditorWidget /> // multiple code editors
      case 'file':
        return <FileUploadWidget />
      case 'file[]':
        return <FileUploadWidget multiple={true} />
      case 'date':
        return <DatePickerWidget />
      case 'date[]':
        return <DatePickerWidget /> // multiple date pickers
      case 'boolean':
        return <ToggleButtonWidget />
      case 'boolean[]':
        return <ToggleButtonWidget /> // multiple toggle buttons
      case 'integer':
      case 'integer[]':
      case 'float':
      case 'float[]':
      case 'string':
      case 'string[]':
        return <TextboxWidget />
      case 'group':
        return <ProfileSearchWidget />
      case 'group[]':
        return <ProfileSearchWidget multiple={true} />
      case 'note':
      case 'note[]':
      case 'edit':
      case 'edit[]':
      case 'edge':
      case 'edge[]':
      case 'tag':
      case 'tag[]':
        return null // not sure what to render
      default:
        return null
    }
  }

  if (!field[fieldName].value?.param)
    return renderConstant(field[fieldName].value ?? field[fieldName])
  if (field[fieldName].value.param.input) return renderInput(field[fieldName].value)
  return renderType(field[fieldName].value)
}

export default EditorWidget
