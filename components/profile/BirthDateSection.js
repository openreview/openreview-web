const BirthDateSection = ({ profileYearOfBirth, updateYearOfBirth }) => {
  console.log('profileYearOfBirth', profileYearOfBirth)
  return (
    <div className="year-of-birth" translate="no">
      <input
        className="form-control"
        type="number"
        min="1922"
        value={profileYearOfBirth ?? ''}
        placeholder="Enter your year of birth"
        onChange={(e) => updateYearOfBirth(e.target.value)}
      />
    </div>
  )
}

export default BirthDateSection
