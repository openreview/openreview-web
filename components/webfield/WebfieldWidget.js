import dynamic from 'next/dynamic'
import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'

const DropdownList = dynamic(() =>
  import('../EditorComponents/DropdownList').then((mod) => mod.DropdownList)
)
const DropdownListV2 = dynamic(() =>
  import('../EditorComponents/DropdownList').then((mod) => mod.DropdownListV2)
)
const TextArea = dynamic(() =>
  import('../EditorComponents/TextArea').then((mod) => mod.TextArea)
)
const TextAreaV2 = dynamic(() =>
  import('../EditorComponents/TextArea').then((mod) => mod.TextAreaV2)
)

export const WebfieldWidget = () => {
  const { field } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  if (field[fieldName]['value-dropdown']) {
    return <DropdownList />
    // eslint-disable-next-line no-else-return
  } else if (field[fieldName]['value-regex']) {
    return <TextArea />
  }
  return null
}

export const WebfieldWidgetV2 = () => {
  const { field } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  if (field[fieldName].value?.enum) {
    if (field[fieldName].presentation?.input === 'select') {
      return <DropdownListV2 />
    }
  } else if (field[fieldName].value?.regex) {
    if (field[fieldName].value?.type?.endsWith('[]')) {
      // values-regex
    } else {
      // value-regex
      return <TextAreaV2 />
    }
  }
  return null
}
