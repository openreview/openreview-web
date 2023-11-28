import { useContext, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import DatetimePicker from '../DatetimePicker'
import EditorComponentContext from '../EditorComponentContext'
import { TimezoneDropdown } from '../Dropdown'
import { getDefaultTimezone, prettyField } from '../../lib/utils'

import styles from '../../styles/components/DatePickerWidget.module.scss'

const DatePickerWidget = () => {
  const { field, onChange, value, clearError } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]
  const [timeZone, setTimeZone] = useState(getDefaultTimezone().value)

  const onDateTimeChange = (e) => {
    clearError?.()
    onChange({ fieldName, value: e })
  }

  useEffect(() => {
    clearError?.()
    if (!value) return
    onChange({ fieldName, value: dayjs(value).tz(timeZone, true).valueOf() })
  }, [timeZone])

  return (
    <div className={styles.datePickerContainer}>
      <DatetimePicker
        existingValue={value}
        timeZone={timeZone}
        onChange={onDateTimeChange}
        placeholder={`Select ${prettyField(fieldName)}`}
        autoFocus={false}
      />
      <div className={styles.timeZonePicker}>
        <TimezoneDropdown
          className={styles.timeZoneDropdown}
          value={timeZone}
          onChange={(e) => setTimeZone(e.value)}
        />
      </div>
    </div>
  )
}

export default DatePickerWidget
