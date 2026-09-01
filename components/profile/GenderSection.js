import { AutoComplete } from 'antd'

const GenderSection = ({ profileGender, updateGender }) => {
  const options = ['Male', 'Female', 'Non-Binary', 'Not Specified'].map((p) => ({
    value: p,
    label: p,
  }))
  return (
    <div translate="no">
      <AutoComplete
        style={{ width: '100%', maxWidth: 500 }}
        options={options}
        value={profileGender}
        onChange={(value) => updateGender(value || undefined)}
        placeholder="Choose a gender or type a custom gender"
        showSearch={{ filterOption: true }}
        allowClear
      />
    </div>
  )
}

export default GenderSection
