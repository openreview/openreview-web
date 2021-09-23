import { useEffect, useState } from 'react'
import { CreatableDropdown } from '../Dropdown'

const GenderSection = ({ profileGender, updateGender }) => {
  const defaultGenderOptions = ['Male', 'Female', 'Non-Binary', 'Not Specified']
  const [genderOptions, setGenderOptions] = useState(defaultGenderOptions.map(p => ({ value: p, label: p })))
  const [gender, setGender] = useState(profileGender)

  useEffect(() => {
    updateGender(gender)
  }, [gender])

  return (
    <section>
      <h4>Gender</h4>
      <p className="instructions">This information helps conferences better understand their gender diversity. (Optional)</p>
      <CreatableDropdown
        hideArrow
        classNamePrefix="gender-dropdown"
        defaultValue={gender ? { value: gender, label: gender } : null}
        onChange={e => setGender(e.value)}
        options={genderOptions}
        placeholder="Choose a gender or type a custom gender"
      />
    </section>
  )
}

export default GenderSection
