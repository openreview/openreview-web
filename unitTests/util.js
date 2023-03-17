import { render } from '@testing-library/react'
import EditorComponentContext from '../components/EditorComponentContext'
import WebFieldContext from '../components/WebFieldContext'

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

export const renderWithWebFieldContext = (ui, providerProps) => {
  return render(<WebFieldContext.Provider {...providerProps}>{ui}</WebFieldContext.Provider>)
}
