import { useContext, useEffect } from 'react'
import EditorComponentContext from '../EditorComponentContext'
import styles from '../../styles/components/ToggleButtonWidget.module.scss'

const ToggleButtonWidget = () => {
  const { field, onChange, value, note } = useContext(EditorComponentContext)
  const fieldName = Object.keys(field)[0]

  useEffect(() => {
    if (note || value) return
    const defaultValue = field[fieldName].value?.param?.default
    onChange({ fieldName, value: defaultValue ?? false })
  }, [])

  return (
    <div className={styles.toggleButtonContainer}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={`${styles.toggleButton} ${value ? styles.toggleButtonChecked : ''}`}
        onClick={() =>
          onChange({
            fieldName,
            value: !value,
          })
        }
      >
        <div className={styles.toggleButtonInner}>
          {value && <div className={styles.toggleButtonInnerChecked}>True</div>}
          <div className={styles.toggleButtonInnerSwitch} />
          {!value && <div className={styles.toggleButtonInnerUnchecked}>False</div>}
        </div>
      </button>
    </div>
  )
}

export default ToggleButtonWidget
