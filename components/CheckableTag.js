/* globals $: false */
import styles from '../styles/components/CheckableTag.module.scss'

const CheckableTag = ({ label, tagText, noTagText, rawCount, checked, onChange }) => {
  const formattedCount = new Intl.NumberFormat('en', { notation: 'compact' }).format(rawCount)

  return (
    <div className={styles.checkableTagContainer} onClick={onChange}>
      <span className={`${styles.iconLabel} ${checked ? styles.checked : ''}`}>{label}</span>
      <span className={styles.tagText}>{checked ? tagText : noTagText}</span>
      <span
        className={styles.count}
        data-toggle="tooltip"
        data-placement="top"
        title={rawCount}
        onMouseEnter={(e) => {
          $(e.target).tooltip('show')
        }}
        onMouseLeave={(e) => {
          $(e.target).tooltip('destroy')
        }}
      >
        {formattedCount}
      </span>
    </div>
  )
}

export default CheckableTag
