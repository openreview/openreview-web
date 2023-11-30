import { useContext, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import DatetimePicker from '../DatetimePicker'
import EditorComponentContext from '../EditorComponentContext'
import { TimezoneDropdown } from '../Dropdown'
import { getDefaultTimezone, prettyField } from '../../lib/utils'

import styles from '../../styles/components/DatePickerWidget.module.scss'

const DatePickerWidget = ({
  isEditor = true,
  showTime = true,
  onChange: propsOnChange,
  field: propsField,
  error: propsError,
  clearError: propsClearError,
  value: propsValue,
}) => {
  const editorComponentContext = useContext(EditorComponentContext) ?? {}
  const { field, onChange, value, error, clearError } = isEditor
    ? editorComponentContext
    : {
        field: propsField,
        onChange: propsOnChange,
        clearError: propsClearError,
        value: propsValue,
        error: propsError,
      }
  const fieldName = Object.keys(field ?? {})[0]
  const [timeZone, setTimeZone] = useState(getDefaultTimezone().value)

  const onDateTimeChange = (e) => {
    clearError?.()
    onChange({ fieldName, value: e ?? undefined })
  }

  useEffect(() => {
    clearError?.()
    if (!value) return
    onChange({ fieldName, value: dayjs(value).tz(timeZone, true).valueOf() })
  }, [timeZone])

  return (
    <div className={`${styles.datePickerContainer} ${error ? styles.invalidValue : ''}`}>
      <DatetimePicker
        existingValue={value}
        timeZone={timeZone}
        onChange={onDateTimeChange}
        placeholder={fieldName ? `Select ${prettyField(fieldName)}` : 'Select datetime'}
        autoFocus={false}
        showTime={showTime}
      />
      {showTime !== false && (
        <div className={styles.timeZonePicker}>
          <TimezoneDropdown
            className={styles.timeZoneDropdown}
            value={timeZone}
            onChange={(e) => setTimeZone(e.value)}
          />
        </div>
      )}
    </div>
  )
}

export default DatePickerWidget
