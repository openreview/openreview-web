import dayjs from 'dayjs'

const BirthDateSection = ({ profileYearOfBirth, updateYearOfBirth }) => (
  <div className="year-of-birth" translate="no">
    <input
      aria-label="Enter your year of birth"
      className="form-control"
      type="number"
      min={`${dayjs().year() - 100}`}
      max={`${dayjs().year()}`}
      value={profileYearOfBirth ?? ''}
      placeholder="Enter your year of birth"
      onChange={(e) => updateYearOfBirth(e.target.value)}
    />
  </div>
)

export default BirthDateSection
