/* globals $: false */
import moment from 'moment'
import 'moment-timezone'
import { useEffect, useRef } from 'react'
import { getDefaultTimezone } from '../lib/utils'
import Icon from './Icon'

const DatetimePicker = ({
  extraClasses, value, onChange, timeZone,
}) => {
  const pickerInputRef = useRef(null)

  useEffect(() => {
    $(pickerInputRef.current).datetimepicker({ date: value ? moment(value) : null, useCurrent: false })
    $(pickerInputRef.current).on('dp.change', (e) => {
      let newTimestamp = null
      if (e.date) {
        const newMoment = moment.tz(e.date.format('YYYY-MM-DD HH:mm'), timeZone ?? getDefaultTimezone().value)
        newTimestamp = newMoment.valueOf()
      }
      onChange(newTimestamp)
    })
  }, [])

  return (
    <>
      <input ref={pickerInputRef} type="text" className={`form-control input-sm ${extraClasses}`} />
      <Icon name="calendar" extraClasses="datetime-picker-icon" />
    </>
  )
}

export default DatetimePicker
