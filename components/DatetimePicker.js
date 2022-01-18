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

const DatetimePicker = ({ existingValue, onChange, timeZone }) => {
  const [value, setValue] = useState(existingValue ? dayjs(existingValue) : '')

  const handleOkClick = (e) => {
    onChange(e.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
  }

  const handleChange = (date) => {
    setValue(date)
    if (!date) {
      onChange(null)
      return
    }
    onChange(date.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
  }

  return (
    <Picker
      generateConfig={dayjsGenerator}
      showTime={{ showSecond: false }}
      locale={locale}
      format="YYYY-MM-DD hh:mm A"
      value={value}
      onOk={handleOkClick}
      onChange={handleChange}
      placeholder="Select datetime"
      use12Hours
      autoFocus
      allowClear
    />
  )
}

export default DatetimePicker
