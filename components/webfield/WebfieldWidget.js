import dynamic from 'next/dynamic'

const DropdownList = dynamic(() => import('./DropdownList').then((mod) => mod.DropdownList))
const DropdownListV2 = dynamic(() =>
  import('./DropdownList').then((mod) => mod.DropdownListV2)
)

export const WebfieldWidget = (props) => {
  const { field } = props
  const fieldName = Object.keys(field)[0]

  if (field[fieldName]['value-dropdown']) {
    return <DropdownList {...props} />
  }
  return null
}

export const WebfieldWidgetV2 = (props) => {
  const { field } = props
  const fieldName = Object.keys(field)[0]

  if (field[fieldName].value?.enum) {
    if (field[fieldName].presentation?.input === 'select') {
      return <DropdownListV2 {...props} />
    }
  }
  return null
}
