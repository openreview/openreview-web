import { render } from '@testing-library/react'
import EditorComponentContext from '../components/EditorComponentContext'

export const renderWithEditorComponentContext = (ui, providerProps) => {
  return render(
    <EditorComponentContext.Provider {...providerProps}>{ui}</EditorComponentContext.Provider>
  )
}

export const reRenderWithEditorComponentContext = (rerender, ui, providerProps) => {
  return rerender(
    <EditorComponentContext.Provider {...providerProps}>{ui}</EditorComponentContext.Provider>
  )
}
