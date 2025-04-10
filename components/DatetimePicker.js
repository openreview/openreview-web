import dayjs from 'dayjs'
import Picker from 'rc-picker'
import { useState } from 'react'
import locale from 'rc-picker/lib/locale/en_US'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import dayjsGenerator from '../lib/dayjsGenerator'
import { getDefaultTimezone } from '../lib/utils'

dayjs.extend(timezone)
dayjs.extend(utc)

const DatetimePicker = ({
  existingValue,
  onChange,
  timeZone,
  placeholder,
  autoFocus = true,
  allowClear = true,
  skipOkEvent = false,
  onBlur,
  disabledDate,
  showTime = {
    showSecond: false,
  },
}) => {
  const [value, setValue] = useState(
    existingValue && dayjs(existingValue).isValid() ? dayjs(existingValue) : ''
  )

  const handleOkClick = (e) => {
    if (skipOkEvent) return
    onChange(e.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
  }

  const handleChange = (date) => {
    setValue(date)
    if (!date) {
      onChange(null)
      return
    }
    if (showTime === false) {
      onChange(date.tz('UTC').startOf('date').toISOString())
    } else {
      onChange(date.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
    }
  }

  return (
    <Picker
      generateConfig={dayjsGenerator}
      showTime={showTime}
      locale={locale}
      format={showTime === false ? 'YYYY-MM-DD' : 'YYYY-MM-DD hh:mm A'}
      value={value}
      onOk={handleOkClick}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder ?? 'Select datetime'}
      use12Hours
      autoFocus={autoFocus}
      allowClear={allowClear}
      disabledDate={disabledDate}
    />
  )
}

export default DatetimePicker
