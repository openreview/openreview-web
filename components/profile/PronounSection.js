import { useEffect, useState } from 'react'
import { CreatableDropdown } from '../Dropdown'

const PronounSection = ({ profilePronouns, updatePronoun }) => {
  const defaultPronounOptions = ["Don't Specify", 'they/them', 'she/her', 'he/him']
  const pronounOptions = defaultPronounOptions.map((p) => ({ value: p, label: p }))
  const [pronouns, setPronoun] = useState(profilePronouns)

  useEffect(() => {
    updatePronoun(pronouns)
  }, [pronouns])
  
  return (
    <div className="pronouns" translate="no">
      <CreatableDropdown
        hideArrow
        classNamePrefix="pronouns-dropdown"
        defaultValue={pronouns ? { value: pronouns, label: pronouns } : null}
        onChange={(e) => setPronoun(e.value)}
        options={pronounOptions}
        placeholder="Choose pronouns or type a custom pronouns"
      />
    </div>
  )
}

export default PronounSection
