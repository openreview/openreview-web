import { render } from '@testing-library/react'
import WebFieldContext from '../components/WebFieldContext'

export const renderWithWebFieldContext = (ui, providerProps) => {
  return render(<WebFieldContext.Provider {...providerProps}>{ui}</WebFieldContext.Provider>)
}
