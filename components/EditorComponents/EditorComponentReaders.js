import { useContext } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import EditorWidget from '../webfield/EditorWidget'

const EditorComponentReaders = ({ readers }) => {
  const { field } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  if (!readers) return null
  return (
    <EditorComponentContext.Provider
      value={{
        field: { [fieldName]: field[fieldName].readers },
      }}
    >
      <EditorWidget />
    </EditorComponentContext.Provider>
  )
}

export default EditorComponentReaders
