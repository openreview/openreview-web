import dayjs from 'dayjs'
import DatetimePicker from '../DatetimePicker'

const BirthDateSection = ({ profileDateOfBirth, updateDateOfBirth, savedDateOfBirth }) => (
  <div translate="no">
    <DatetimePicker
      disabled={!!savedDateOfBirth}
      placeholder="Select your date of birth"
      autoFocus={false}
      showTime={false}
      showNow={false}
      disabledDate={(date) =>
        date.isAfter(dayjs()) || date.isBefore(dayjs().subtract(100, 'year'))
      }
      defaultPickerValue={profileDateOfBirth?.value ? null : dayjs().subtract(20, 'year')}
      existingValue={
        profileDateOfBirth?.value
          ? dayjs.utc(profileDateOfBirth.value).format('YYYY-MM-DD')
          : null
      }
      invalid={profileDateOfBirth?.valid === false}
      onChange={(date) =>
        updateDateOfBirth({ value: date ? dayjs(date).valueOf() : undefined, valid: true })
      }
    />
  </div>
)

export default BirthDateSection
