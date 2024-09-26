import { screen, render } from '@testing-library/react'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'
import DatePickerWidget from '../components/EditorComponents/DatePickerWidget'

let dateTimePickerProps
let dropdownProps
let mockedOnDateTimeChange

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/DatetimePicker', () => (props) => {
  dateTimePickerProps(props)
  mockedOnDateTimeChange = props.onChange
  return <div>Date and time picker</div>
})
jest.mock('../components/Dropdown', () => ({
  TimezoneDropdown: (props) => {
    dropdownProps(props)
    return <div>Timezone dropdown</div>
  },
}))
jest.mock('../lib/utils', () => {
  const original = jest.requireActual('../lib/utils')
  return {
    ...original,
    getDefaultTimezone: jest.fn(() => ({
      value: 'UTC',
    })),
  }
})
jest.mock('dayjs', () =>
  jest.fn().mockImplementation(() => ({
    format: jest.fn(),
    startOf: jest.fn(),
    endOf: jest.fn(),
    tz: jest.fn().mockReturnThis(),
    valueOf: jest.fn(() => 1234567890),
  }))
)

beforeEach(() => {
  dateTimePickerProps = jest.fn()
  dropdownProps = jest.fn()
  mockedOnDateTimeChange = null
})

describe('DatePickerWidget in context of note editor', () => {
  test('render datetime picker and timezone dropdown', () => {
    const providerProps = {
      value: {
        field: {
          some_date_field: {
            value: {
              param: {
                type: 'date',
                range: [0, 9999999999999],
              },
            },
          },
        },
      },
    }

    renderWithEditorComponentContext(<DatePickerWidget />, providerProps)
    expect(screen.getByText('Date and time picker')).toBeInTheDocument()
    expect(screen.getByText('Timezone dropdown')).toBeInTheDocument()
  })

  test('pass props to date time picker and timezone dropdown', () => {
    const onChange = jest.fn()
    const clearError = jest.fn()

    const providerProps = {
      value: {
        field: {
          some_date_field: {
            value: {
              param: {
                type: 'date',
                range: [0, 9999999999999],
              },
            },
          },
        },
        value: 1234567890,
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<DatePickerWidget />, providerProps)
    expect(dateTimePickerProps).toHaveBeenCalledWith(
      expect.objectContaining({
        existingValue: 1234567890,
        onChange: expect.anything(),
        placeholder: 'Select Some Date Field',
        autoFocus: false,
        timeZone: 'UTC',
      })
    )
    expect(dropdownProps).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'UTC',
        onChange: expect.anything(),
      })
    )

    mockedOnDateTimeChange(9876543210) // user select new date
    expect(onChange).toHaveBeenNthCalledWith(1, {
      fieldName: 'some_date_field',
      value: 9876543210,
    })
    expect(clearError).toHaveBeenCalledTimes(1)

    mockedOnDateTimeChange(null) // user cleared value
    expect(onChange).toHaveBeenNthCalledWith(2, {
      fieldName: 'some_date_field',
      value: undefined,
    })
    expect(clearError).toHaveBeenCalledTimes(2)
  })
})

describe('DatePickerWidget used by itself', () => {
  test('render datetime picker and timezone dropdown', () => {
    render(<DatePickerWidget isEditor={false} />)
    expect(screen.getByText('Date and time picker')).toBeInTheDocument()
    expect(screen.getByText('Timezone dropdown')).toBeInTheDocument()
  })

  test('render only datetimepicker when showTime is false', () => {
    render(<DatePickerWidget isEditor={false} showTime={false} />)
    expect(screen.getByText('Date and time picker')).toBeInTheDocument()
    expect(screen.queryByText('Timezone dropdown')).not.toBeInTheDocument()
  })

  test('pass props to datetimepicker', () => {
    const field = { 'publication date': undefined }
    const onChange = jest.fn()

    render(
      <DatePickerWidget isEditor={false} field={field} value={12345678} onChange={onChange} />
    )
    expect(dateTimePickerProps).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: 'Select Publication Date',
        existingValue: 12345678,
      })
    )
  })

  test('call onChange pased to DatePickerWidget', () => {
    const onChange = jest.fn()
    const clearError = jest.fn()

    render(<DatePickerWidget isEditor={false} onChange={onChange} clearError={clearError} />)
    mockedOnDateTimeChange(9876543210)
    expect(onChange).toHaveBeenCalledWith({ fieldName: undefined, value: 9876543210 }) // field props is not passed
    expect(clearError).toHaveBeenCalled()
  })
})
