/* globals $: false */

import { useEffect } from 'react'
import { prettyId } from '../../lib/utils'
import getLicenseInfo from '../../lib/forum-utils'

import styles from '../../styles/components/Tag.module.scss'

const Tag = ({ value, isLicenseTag = false }) => {
  const getTagTooltip = (id) => {
    if (id.includes('/number}'))
      return '"number" will be replaced with the paper number after the submission has been completed.'
    if (id.includes('/signatures}'))
      return '"signatures" will be replaced with the edit signature shown below.'
    if (id.includes('/value}')) {
      const fieldName = id.split('/').slice(-2)[0]
      return `"${fieldName}" will be replaced with the value of the field ${fieldName}`
    }
    return id
  }
  const segments = isLicenseTag ? [value] : prettyId(value).split(/\{(\S+\s*\S*)\}/g)
  const tooltip = isLicenseTag ? getLicenseInfo(value)?.fullName : getTagTooltip(value)

  useEffect(() => {
    if (!value) return
    $('[data-toggle="tooltip"]').tooltip()
  }, [value])
  return (
    <div className={styles.value} title={tooltip} data-toggle="tooltip" data-placement="top">
      {segments.map((segment, index) =>
        index % 2 !== 0 ? (
          <em key={index} className={styles.emphasis}>
            {segment}
          </em>
        ) : (
          segment
        )
      )}
    </div>
  )
}

export default Tag
