import { AutoComplete } from 'antd'

const PronounSection = ({ profilePronouns, updatePronoun }) => {
  const options = ['they/them', 'she/her', 'he/him', 'Not Specified'].map((p) => ({
    value: p,
    label: p,
  }))
  return (
    <div translate="no">
      <AutoComplete
        style={{ width: '100%', maxWidth: 500 }}
        options={options}
        value={profilePronouns}
        onChange={updatePronoun}
        placeholder="Choose pronouns or type a custom pronouns"
        showSearch={{ filterOption: true }}
        allowClear
      />
    </div>
  )
}

export default PronounSection
