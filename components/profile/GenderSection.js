import { useEffect, useState } from 'react'
import { CreatableDropdown } from '../Dropdown'

const GenderSection = ({ profileGender, updateGender }) => {
  const defaultGenderOptions = ['Male', 'Female', 'Non-Binary', 'Not Specified']
  const genderOptions = defaultGenderOptions.map((p) => ({ value: p, label: p }))
  const [gender, setGender] = useState(profileGender)

  useEffect(() => {
    updateGender(gender)
  }, [gender])

  return (
    <div className="gender" translate="no">
      <CreatableDropdown
        hideArrow
        classNamePrefix="gender-dropdown"
        defaultValue={gender ? { value: gender, label: gender } : null}
        onChange={(e) => setGender(e.value)}
        options={genderOptions}
        placeholder="Choose a gender or type a custom gender"
      />
    </div>
  )
}

export default GenderSection
