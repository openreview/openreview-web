import { useState } from 'react'
import Dropdown, { CreatableDropdown } from '../Dropdown'

const GenderSection = ({ profileGender }) => {
  const defaultGenderOptions = ['Male', 'Female', 'Non-Binary', 'Not Specified']
  const placeHolder = 'Choose a gender or type a custom gender'
  const [genderOptions, setGenderOptions] = useState(defaultGenderOptions.map(p => ({ value: p, label: p })))
  const [gender, setGender] = useState(profileGender)

  return (
    <section>
      <h4>Gender</h4>
      <p className="instructions">This information helps conferences better understand their gender diversity. (Optional)</p>
      <CreatableDropdown
        hideArrow
        classNamePrefix="gender-dropdown"
        defaultValue={profileGender ? { value: profileGender, label: profileGender } : null}
        onChange={e => setGender(e.value)}
        options={genderOptions}
        placeholder="Choose a gender or type a custom gender"
      />
    </section>
  )
}

export default GenderSection
