import styles from '../../styles/components/LicenseWidget.module.scss'
import EditorComponentHeader from './EditorComponentHeader'
import Tag from './Tag'

const LicenseWidget = ({ fieldDescription }) => {
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

  // any other widget type
  return null
}

export default LicenseWidget
