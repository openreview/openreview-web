/* globals $: false */
import { useEffect, useRef } from 'react'
import Icon from './Icon'

const DatetimePicker = () => {
  const pickerInputRef = useRef(null)

  useEffect(() => {
    $(pickerInputRef.current).datetimepicker({ date: null, useCurrent: false })
  }, [])

  return (
    <>
      <input ref={pickerInputRef} type="text" className="form-control input-sm" />
      <Icon name="calendar" extraClasses="datetime-picker-icon" />
    </>
  )
}

export default DatetimePicker
