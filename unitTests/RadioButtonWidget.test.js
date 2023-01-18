import RadioButtonWidget from '../components/EditorComponents/RadioButtonWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom'

let baseProviderProps

beforeEach(() => {
  baseProviderProps = {
    value: {
      invitation: { id: 'invitaitonId' },
      field: {
        radiobutton_widget: {},
      },
    },
  }
})

describe('RadioButtonWidget', () => {
  test('render nothing if invitation does not have options', () => {
    const providerProps = baseProviderProps
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.queryByText('* Radiobutton Widget')).not.toBeInTheDocument()
  })

  test('render nothing if invitation enum is not array', () => {
    const providerProps = baseProviderProps
    providerProps.value.field.radiobutton_widget.value = {
      param: {
        enum: {},
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.queryByText('* Radiobutton Widget')).not.toBeInTheDocument()
  })

  test('render header', () => {
    const providerProps = baseProviderProps
    providerProps.value.field.radiobutton_widget.value = {
      param: {
        enum: [],
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.getByText('* Radiobutton Widget'))
  })

  test('display enum options', () => {
    const providerProps = baseProviderProps
    providerProps.value.field.radiobutton_widget.value = {
      param: {
        enum: ['option 1', 'OPTION TWO'],
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    console.log(prettyDOM())
  })
})
