/* globals $: false */
import { useEffect } from 'react'
import { prettyInvitationId, prettyId } from '../lib/utils'
import styles from '../styles/components/ProfileTag.module.scss'
import Icon from './Icon'

const ProfileTag = ({ tag, onDelete }) => {
  const getColorClass = () => {
    if (tag.label === 'require vouch') return styles.requireVouch
    if (tag.label === 'potential spam') return styles.potentialSpam
    return ''
  }
  const deletable = tag.invitation.startsWith(`${process.env.SUPER_USER}/Support`)
  const displayLabelText = `${prettyInvitationId(tag.invitation)}${tag.label !== undefined ? ` "${tag.label}"` : ''}${tag.weight !== undefined ? ` (${tag.weight})` : ''}${!tag.invitation.startsWith(tag.signature) ? '' : ` by ${prettyId(tag.signature)}`}`
  const isPrivateTag = !tag.readers.includes('everyone')

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip({ html: true })
  }, [tag])

  return (
    <div
      className={`${styles.profileTagContainer} ${getColorClass()} ${deletable ? styles.deletable : ''}`}
      {...(deletable ? { onClick: onDelete } : {})}
      data-toggle="tooltip"
      data-placement="top"
      {...(isPrivateTag ? { title: `Visible to <br/> ${tag.readers.join(',<br/>')}` } : {})}
    >
      <span>{displayLabelText}</span>
      {isPrivateTag && <Icon name="eye-open" extraClasses={styles.readerIcon} />}
      {onDelete && deletable && (
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

export default ProfileTag
