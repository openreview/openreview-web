import styles from '../../styles/components/ToggleButtonWidget.module.scss'

const ToggleButton = ({
  onChange,
  value,
  trueLabel = 'True',
  falseLabel = 'False',
  isLoading = false,
}) => (
  <div className={styles.toggleButtonContainer}>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={`${styles.toggleButton} ${value ? styles.toggleButtonChecked : ''} ${isLoading ? styles.toggleButtonLoading : ''}`}
      onClick={() => onChange(!value)}
    >
      <div className={styles.toggleButtonInner}>
        {value && <div className={styles.toggleButtonInnerChecked}>{trueLabel}</div>}
        <div className={styles.toggleButtonInnerSwitch} />
        {!value && <div className={styles.toggleButtonInnerUnchecked}>{falseLabel}</div>}
      </div>
    </button>
  </div>
)

export default ToggleButton
