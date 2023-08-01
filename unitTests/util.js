// eslint-disable-next-line import/no-extraneous-dependencies
import { render } from '@testing-library/react'
import EditorComponentContext from '../components/EditorComponentContext'
import WebFieldContext from '../components/WebFieldContext'

export const renderWithEditorComponentContext = (ui, providerProps) =>
  render(
    <EditorComponentContext.Provider {...providerProps}>{ui}</EditorComponentContext.Provider>
  )

export const reRenderWithEditorComponentContext = (rerender, ui, providerProps) =>
  rerender(
    <EditorComponentContext.Provider {...providerProps}>{ui}</EditorComponentContext.Provider>
  )

export const renderWithWebFieldContext = (ui, providerProps) =>
  render(<WebFieldContext.Provider {...providerProps}>{ui}</WebFieldContext.Provider>)
