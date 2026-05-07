import { ConfigProvider, DatePicker } from 'antd'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useState } from 'react'
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
      onChange(date.tz('UTC').startOf('date').toISOString())
    } else {
      onChange(date.tz(timeZone ?? getDefaultTimezone().value, true).valueOf())
    }
  }

  const showTimeProp = showTime === false ? false : { ...showTime, use12Hours: true }

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#3e6775', colorError: '#8c1b13' },
        components: {
          Button: { primaryShadow: 'none' },
          DatePicker: {
            colorBgContainer: '#fffaf4',
            colorBgElevated: '#fffaf4',
            colorBorder: '#508496',
            activeBorderColor: '#508496',
            hoverBorderColor: '#508496',
            activeShadow: 'none',
            lineWidth: 2,
            borderRadius: 0,
            controlHeight: 30,
            inputFontSize: 12,
          },
        },
      }}
    >
      <DatePicker
        showTime={showTimeProp}
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
        style={{ lineHeight: 1.5, width: '50%', marginRight: '0.25rem' }}
      />
    </ConfigProvider>
  )
}

export default DatetimePicker
