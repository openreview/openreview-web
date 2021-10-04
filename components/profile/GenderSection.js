import { useEffect, useState } from 'react'
import { CreatableDropdown } from '../Dropdown'
import ProfileSectionHeader from './ProfileSectionHeader'

const GenderSection = ({ profileGender, updateGender }) => {
  const defaultGenderOptions = ['Male', 'Female', 'Non-Binary', 'Not Specified']
  const [genderOptions, setGenderOptions] = useState(defaultGenderOptions.map(p => ({ value: p, label: p })))
  const [gender, setGender] = useState(profileGender)

  useEffect(() => {
    updateGender(gender)
  }, [gender])

  return (
    <section>
      <ProfileSectionHeader type="gender" />
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
