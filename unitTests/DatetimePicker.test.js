import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import DatetimePicker from '../components/DatetimePicker'
import '@testing-library/jest-dom'

dayjs.extend(utc)
dayjs.extend(timezone)

global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('DatetimePicker', () => {
  test('renders an empty input when existingValue is falsy', () => {
    render(<DatetimePicker onChange={jest.fn()} />)

    expect(screen.getByPlaceholderText('Select datetime')).toHaveValue('')
  })

  test('renders a custom placeholder when provided', () => {
    render(<DatetimePicker onChange={jest.fn()} placeholder="Pick a date" />)

    expect(screen.getByPlaceholderText('Pick a date')).toBeInTheDocument()
  })

  test('renders the formatted date without time', () => {
    const currentEpoch = Date.now()
    const expecteddate = dayjs(currentEpoch).format('YYYY-MM-DD')

    render(
      <DatetimePicker existingValue={currentEpoch} onChange={jest.fn()} showTime={false} />
    )

    expect(screen.getByPlaceholderText('Select datetime')).toHaveValue(expecteddate)
  })

  test('renders the formatted date with time (default behavior)', () => {
    const currentEpoch = Date.now()
    const expecteddate = dayjs(currentEpoch).format('YYYY-MM-DD hh:mm A')

    render(<DatetimePicker existingValue={currentEpoch} onChange={jest.fn()} />)

    expect(screen.getByPlaceholderText('Select datetime')).toHaveValue(expecteddate)
  })

  test('clear value when user click cross button', async () => {
    const onChange = jest.fn()

    render(<DatetimePicker existingValue={Date.now()} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button'))

    expect(onChange).toHaveBeenCalledWith(null)
    expect(screen.getByPlaceholderText('Select datetime')).toHaveValue('')
  })

  test('call onChange when user manually enter date only', async () => {
    const onChange = jest.fn()

    render(<DatetimePicker onChange={onChange} showTime={false} />)

    await userEvent.type(screen.getByPlaceholderText('Select datetime'), '2000-01-01{enter}')
    expect(onChange).toHaveBeenCalledWith('2000-01-01T00:00:00.000Z')
  })

  test('call onChange when user select today', async () => {
    const today = dayjs.utc().startOf('day').toISOString()
    const onChange = jest.fn()

    render(<DatetimePicker onChange={onChange} showTime={false} />)

    await userEvent.click(screen.getByPlaceholderText('Select datetime'))
    await userEvent.click(screen.getByText('Today'))

    expect(onChange).toHaveBeenCalledWith(today)
  })

  test('call onChange when user manually enter datetime', async () => {
    const onChange = jest.fn()

    render(<DatetimePicker onChange={onChange} timeZone="UTC" />)

    await userEvent.click(screen.getByPlaceholderText('Select datetime'))
    await userEvent.paste('2000-01-01 01:01 PM')
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onChange).toHaveBeenCalledWith(946731660000)
  })

  test('call onChange when user select now', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })
    jest.setSystemTime(Date.UTC(2000, 2, 1, 1, 1, 0, 0))
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const onChange = jest.fn()
      const expected = dayjs().tz('UTC', true).valueOf()

      render(<DatetimePicker onChange={onChange} timeZone="UTC" />)

      await user.click(screen.getByPlaceholderText('Select datetime'))
      await user.click(screen.getByText('Now'))

      expect(onChange).toHaveBeenCalledWith(expected)
    } finally {
      jest.useRealTimers()
    }
  })

  test('use timezone to calculate epoch value', async () => {
    const onChange = jest.fn()

    render(<DatetimePicker onChange={onChange} timeZone="Asia/Hong_Kong" />)

    await userEvent.click(screen.getByPlaceholderText('Select datetime'))
    await userEvent.paste('2000-01-01 01:01 PM')
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))

    expect(onChange).toHaveBeenCalledWith(946702860000)
  })

  test('disabledDate should work', async () => {
    const onChange = jest.fn()

    render(<DatetimePicker onChange={onChange} disabledDate={() => true} />) // disable all dates for simplicity
    await userEvent.click(screen.getByPlaceholderText('Select datetime'))

    expect(screen.getByText('Now')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })
})
