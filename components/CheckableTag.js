/* globals $: false */
import styles from '../styles/components/CheckableTag.module.scss'
import Icon from './Icon'

const CheckableTag = ({
  label,
  tagText,
  noTagText,
  rawCount,
  checked,
  onChange,
  onDelete,
}) => {
  const formattedCount = new Intl.NumberFormat('en', { notation: 'compact' }).format(rawCount)
  const showCount = Number.isNaN(rawCount)

  const getColorClass = () => {
    if (label.includes('require vouch')) return styles.requireVouch
    if (label.includes('potential spam')) return styles.potentialSpam
    return ''
  }

  return (
    <div
      className={`${styles.checkableTagContainer} ${getColorClass()}`}
      onClick={onChange ?? onDelete}
    >
      <span className={`${styles.iconLabel} ${checked ? styles.checked : ''}`}>{label}</span>
      {tagText && noTagText && (
        <span className={showCount ? styles.tagText : ''}>
          {checked ? tagText : noTagText}
        </span>
      )}
      {showCount && (
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
      )}
      {onDelete && (
        <div
          className={styles.trashButton}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
        >
          <Icon name="trash" />
        </div>
      )}
    </div>
  )
}

export default CheckableTag
