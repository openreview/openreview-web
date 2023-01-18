import RadioButtonWidget from '../components/EditorComponents/RadioButtonWidget'
import { renderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getByDisplayValue('option 1'))
    expect(screen.getByDisplayValue('OPTION TWO'))
  })

  test('display option as selected when match with existing value', () => {
    const providerProps = baseProviderProps
    providerProps.value.value = 'OPTION TWO'
    providerProps.value.field.radiobutton_widget.value = {
      param: {
        enum: ['option 1', 'OPTION TWO'],
      },
    }
    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)
    expect(screen.getByDisplayValue('option 1')).not.toHaveAttribute('checked')
    expect(screen.getByDisplayValue('OPTION TWO')).toHaveAttribute('checked')
  })

  test('call update when option is selected', async () => {
    const providerProps = baseProviderProps
    providerProps.value.field.radiobutton_widget.value = {
      param: {
        enum: ['option 1', 'OPTION TWO'],
      },
    }
    const onChange = jest.fn()
    providerProps.value.onChange = onChange

    renderWithEditorComponentContext(<RadioButtonWidget />, providerProps)

    const optionTwo = screen.getByDisplayValue('OPTION TWO')
    const optionOne = screen.getByDisplayValue('option 1')

    await userEvent.click(optionTwo)
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: 'OPTION TWO' }))

    await userEvent.click(optionOne)
    expect(onChange).toHaveBeenNthCalledWith(2, expect.objectContaining({ value: 'option 1' }))
  })
})
