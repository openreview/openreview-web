import dynamic from 'next/dynamic'
import { useContext } from 'react'
import { getFieldConstValue } from '../../lib/webfield-utils'
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

  const renderConstant = () => {
    const constValue = getFieldConstValue(field[fieldName])
    return Array.isArray(constValue) ? <TagsWidget values={constValue} /> : <TextboxWidget />
  }

  const renderInput = (value) => {
    const { input } = value.param
    switch (input) {
      case 'radio':
        return <RadioButtonWidget />
      case 'checkbox':
        return <CheckboxWidget />
      case 'select':
        return <DropdownWidget />
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
    if (!type) return renderConstant()
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
        return <TextboxWidget />
      case 'string':
      case 'string[]':
        return value.param?.enum ? <DropdownWidget /> : <TextboxWidget />
      case 'group':
      case 'profile':
        return <ProfileSearchWidget />
      case 'group[]':
      case 'profile[]':
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

  if (fieldName === 'authorids' && Array.isArray(field.authorids?.value))
    return <ProfileSearchWidget multiple={true} />
  if (!field[fieldName].value?.param) {
    if (!field[fieldName].value && field[fieldName].readers) {
      return null // TODO: an empty widget which shows only readers
    }
    return renderConstant()
  }
  if (field[fieldName].value.param.input) return renderInput(field[fieldName].value)
  return renderType(field[fieldName].value)
}

export default EditorWidget
