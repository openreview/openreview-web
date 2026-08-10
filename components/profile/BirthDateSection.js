import dayjs from 'dayjs'
import DatetimePicker from '../DatetimePicker'

const BirthDateSection = ({ profileDateOfBirth, updateDateOfBirth }) => (
  <div className="year-of-birth" translate="no">
    <DatetimePicker
      placeholder="Select your date of birth"
      autoFocus={false}
      showTime={false}
      showNow={false}
      disabledDate={(date) =>
        date.isAfter(dayjs().subtract(13, 'year')) ||
        date.isBefore(dayjs().subtract(100, 'year'))
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
