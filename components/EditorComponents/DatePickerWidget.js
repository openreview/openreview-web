import { useContext, useState } from 'react'
import dayjs from 'dayjs'
import DatetimePicker from '../DatetimePicker'
import EditorComponentContext from '../EditorComponentContext'
import { TimezoneDropdown } from '../Dropdown'
import { getDefaultTimezone, prettyField } from '../../lib/utils'

import styles from '../../styles/components/DatePickerWidget.module.scss'

const DatePickerWidget = (props) => {
  const editorComponentContext = useContext(EditorComponentContext) ?? {}
  const { field, onChange, value, error, clearError } =
    props.isEditor === false ? props : editorComponentContext
  const fieldName = Object.keys(field ?? {})[0]
  const minimum =
    field?.[fieldName]?.value?.param?.minimum ?? field?.[fieldName]?.value?.param?.range?.[0]
  const maximum =
    field?.[fieldName]?.value?.param?.maximum ?? field?.[fieldName]?.value?.param?.range?.[1]
  const [timeZone, setTimeZone] = useState(getDefaultTimezone()?.value)

  const disabledDate = (current) => {
    const epochValue = current.valueOf()
    return epochValue < minimum || epochValue > maximum
  }

  const onDateTimeChange = (e) => {
    clearError?.()
    onChange({ fieldName, value: e ?? undefined })
  }

  return (
    <div className={`${styles.datePickerContainer} ${error ? styles.invalidValue : ''}`}>
      <DatetimePicker
        existingValue={value}
        timeZone={timeZone}
        onChange={onDateTimeChange}
        placeholder={fieldName ? `Select ${prettyField(fieldName)}` : 'Select datetime'}
        autoFocus={false}
        disabledDate={disabledDate}
        showTime={props.showTime}
      />
      {props.showTime !== false && (
        <div className={styles.timeZonePicker}>
          <TimezoneDropdown
            className={styles.timeZoneDropdown}
            value={timeZone}
            onChange={(e) => {
              setTimeZone(e.value)
              clearError?.()
              if (!value) return
              onChange({ fieldName, value: dayjs(value).tz(e.value, true).valueOf() })
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DatePickerWidget
