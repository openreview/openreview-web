import TextboxWidget from '../components/EditorComponents/TextboxWidget'
import { render, screen } from '@testing-library/react'
import EditorComponentContext from '../components/EditorComponentContext'

describe('TextboxWidget', () => {
  test.skip('render header text', () => {
    render(
      <EditorComponentContext.Provider
        value={{
          field: { reader: '' },
        }}
      >
        <TextboxWidget />
      </EditorComponentContext.Provider>
    )
  })
})
