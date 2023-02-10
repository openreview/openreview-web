import { prettyId } from '../../lib/utils'
import styles from '../../styles/components/TagsWidget.module.scss'
import { useEffect } from 'react'

const getTagTooltip = (id) => {
  if (id.includes('/number}'))
    return '"number" will be replaced with the paper number after the submission has been completed.'
  if (id.includes('/signatures}'))
    return '"signatures" will be replaced with the edit signature shown below.'
  if (id.includes('/value}')) {
    const fieldName = id.split('/').slice(-2)[0]
    return `"value" will be replaced with the value of the field ${fieldName}`
  }
  return id
}

const Tag = ({ value }) => {
  const segments = prettyId(value).split(/\{(\S+)\}/g)
  const tooltip = getTagTooltip(value)

  useEffect(() => {
    if (!value) return
    $('[data-toggle="tooltip"]').tooltip()
  }, [value])
  return (
    <span className={styles.value} title={tooltip} data-toggle="tooltip" data-placement="top">
      {segments.map((segment, index) =>
        index % 2 !== 0 ? (
          <em key={index} className={styles.emphasis}>
            {segment}
          </em>
        ) : (
          segment
        )
      )}
    </span>
  )
}

const TagsWidget = ({ values }) => {
  return (
    <div className={styles.container}>
      {values.map((value, index) => {
        return <Tag key={index} value={value} />
      })}
    </div>
  )
}

export default TagsWidget
