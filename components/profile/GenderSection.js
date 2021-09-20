import { useState } from 'react'
import Dropdown from '../Dropdown'

const GenderSection = ({ profileGender }) => {
  const defaultGenderOptions = ['Male', 'Female', 'Non-Binary', 'Not Specified'].map(p => ({ value: p, label: p }))
  const placeHolder = 'Choose a gender or type a custom gender'
  const [genderOptions, setGenderOptions] = useState(defaultGenderOptions)
  const [gender, setGender] = useState(profileGender)

  return (
    <section>
      <h4>Gender</h4>
      <p className="instructions">This information helps conferences better understand their gender diversity. (Optional)</p>
      <Dropdown
        name="rejection-reason"
        classNamePrefix="gender-dropdown"
        instanceId="rejection-reason"
        placeholder={gender ?? placeHolder}
        options={genderOptions}
        onChange={(p) => { setGender(p?.value) }}
        isClearable
      />
    </section>
  )
}

export default GenderSection
