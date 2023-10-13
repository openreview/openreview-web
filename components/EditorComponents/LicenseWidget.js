import { useEffect, useState } from 'react'
import styles from '../../styles/components/LicenseWidget.module.scss'
import EditorComponentHeader from './EditorComponentHeader'
import Tag from './Tag'
import Dropdown from '../Dropdown'
import getLicenseInfo from '../../lib/forum-utils'

const LicenseWidget = ({ fieldDescription, value, error, onChange, clearError }) => {
  const [licenseOptions, setLicenseOptions] = useState(null)

  useEffect(() => {
    if (!fieldDescription?.param?.enum) return
    setLicenseOptions(
      fieldDescription.param.enum.map((option) => ({
        value: option.value,
        label: option.description ?? getLicenseInfo(option.value)?.fullName ?? option.value,
      }))
    )
  }, [fieldDescription])

  if (!fieldDescription) return null
  if (typeof fieldDescription === 'string') {
    return (
      <EditorComponentHeader fieldNameOverwrite="License" inline={true}>
        <div className={styles.container}>
          <Tag value={fieldDescription} isLicenseTag />
        </div>
      </EditorComponentHeader>
    )
  }

  // enum - single select dropdown
  return (
    <EditorComponentHeader fieldNameOverwrite="License" inline={true} error={error}>
      <div className={styles.container}>
        <Dropdown
          className={error ? styles.invalidValue : ''}
          options={licenseOptions}
          onChange={(e) => {
            clearError?.()
            onChange(e ? e.value : undefined)
          }}
          value={licenseOptions?.find((p) => p.value === value)}
          placeholder="Select License..."
          isClearable={false}
        />
      </div>
    </EditorComponentHeader>
  )
}

export default LicenseWidget
