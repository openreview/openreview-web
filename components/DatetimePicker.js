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

  return <Picker
    generateConfig={dayjsGenerator}
    showTime={{
      showSecond: false,
    }}
    locale={locale}
    format="YYYY-MM-DD HH:mm"
    value={value}
    onOk={handleOkClick}
    onChange={(date) => {
      setValue(date)
      if (!date) onChange(null)
    }}
    placeholder="Select datetime"
    autoFocus
    allowClear
  />
}
export default DatetimePicker
