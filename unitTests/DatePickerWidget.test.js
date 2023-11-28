import { screen } from '@testing-library/react'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'
import DatePickerWidget from '../components/EditorComponents/DatePickerWidget'

let dateTimePickerProps
let dropdownProps
let mockedOnDateTimeChange
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

describe('DatePickerWidget', () => {
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
    expect(onChange).toHaveBeenNthCalledWith(2, {
      // 1st call is timezone change
      fieldName: 'some_date_field',
      value: 9876543210,
    })
  })
})
