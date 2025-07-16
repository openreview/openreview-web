/* globals $: false */
import { useEffect } from 'react'
import { getTagDispayText } from '../lib/utils'
import styles from '../styles/components/ProfileTag.module.scss'
import Icon from './Icon'

const ProfileTag = ({ tag, onDelete, showProfileId }) => {
  const getColorClass = () => {
    if (tag.label === 'require vouch') return styles.requireVouch
    if (tag.label === 'potential spam') return styles.potentialSpam
    return ''
  }
  const deletable = tag.invitation.startsWith(`${process.env.SUPER_USER}/Support`)
  const isPrivateTag = !tag.readers.includes('everyone')

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip({ html: true })
  }, [tag])

  return (
    <div
      className={`${styles.profileTagContainer} ${getColorClass()} ${deletable ? styles.deletable : ''}`}
    >
      <span>{getTagDispayText(tag, showProfileId)}</span>
      {isPrivateTag && (
        <div
          data-toggle="tooltip"
          data-placement="top"
          {...(isPrivateTag
            ? { title: `Visible to <br/> ${tag.readers.join(',<br/>')}` }
            : {})}
        >
          <Icon name="eye-open" extraClasses={styles.readerIcon} />
        </div>
      )}
      {onDelete && deletable && (
        <div
          className={styles.trashButton}
          data-toggle="tooltip"
          data-placement="top"
          title="Delete tag"
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

export default ProfileTag
