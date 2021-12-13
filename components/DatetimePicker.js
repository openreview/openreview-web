import dayjs from 'dayjs'
import Picker from 'rc-picker'
import { useState } from 'react'
import locale from 'rc-picker/lib/locale/en_US'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { nanoid } from 'nanoid'
import dayjsGenerator from '../lib/dayjsGenerator'
import { getDefaultTimezone } from '../lib/utils'

dayjs.extend(timezone)
dayjs.extend(utc)

const DatetimePicker = ({ existingValue, onChange, timeZone }) => {
  const [value, setValue] = useState(existingValue ? dayjs(existingValue) : '')
  const [open, setOpen] = useState(false)

  const handleOkClick = (e) => {
    onChange(e.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
    setOpen(false)
  }

  return <Picker
    key={nanoid()}
    open={open}
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
    onBlur={() => { setOpen(false) }}
    onClick={() => { setOpen(true) }}
    autoFocus
    allowClear
  />
}
export default DatetimePicker
