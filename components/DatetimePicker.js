import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useState } from 'react'
import { getDefaultTimezone } from '../lib/utils'

import { datePicker as datePickerStyles } from '../lib/legacy-bootstrap-styles'

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
  getPopupContainer,
  invalid = false,
}) => {
  const [value, setValue] = useState(
    existingValue && dayjs(existingValue).isValid() ? dayjs(existingValue) : null
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
      onChange(date.tz('UTC', true).startOf('date').toISOString())
    } else {
      onChange(date.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
    }
  }

  return (
    <DatePicker
      showTime={
        showTime === false ? false : { ...showTime, use12Hours: true, format: 'hh:mm A' }
      }
      format={showTime === false ? 'YYYY-MM-DD' : 'YYYY-MM-DD hh:mm A'}
      value={value}
      onOk={handleOkClick}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder ?? 'Select datetime'}
      autoFocus={autoFocus}
      allowClear={allowClear}
      disabledDate={disabledDate}
      getPopupContainer={getPopupContainer}
      status={invalid ? 'error' : undefined}
      suffixIcon={null}
      style={datePickerStyles.root}
      styles={{ input: datePickerStyles.input }}
    />
  )
}

export default DatetimePicker
