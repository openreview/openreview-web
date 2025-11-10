/* globals $: false */
import { useEffect } from 'react'
import { getTagDispayText } from '../lib/utils'
import styles from '../styles/components/ProfileTag.module.scss'
import Icon from './Icon'

const ProfileTag = ({ tag, onDelete, showProfileId }) => {
  const { label, invitation, parentInvitations, readers, signature } = tag
  const deletable = invitation.startsWith(`${process.env.SUPER_USER}/Support`)
  const isPrivateTag = !readers.includes('everyone')
  let tagLink = null
  if (invitation === `${process.env.SUPER_USER}/Support/-/Vouch`) {
    tagLink = `/profile?id=${encodeURIComponent(signature)}`
  } else if (!invitation.startsWith(`${process.env.SUPER_USER}/Support`)) {
    tagLink = `/group?id=${encodeURIComponent(signature)}`
  }

  const getColorClass = () => {
    if (label === 'require vouch') return styles.requireVouch
    if (label === 'potential spam') return styles.potentialSpam
    if (parentInvitations?.endsWith('_Role')) {
      const role = parentInvitations.split('/').pop()
      switch (role) {
        case 'Reviewer_Role':
          return styles.reviewerServiceRole
        case 'Ethics_Reviewer_Role':
          return styles.ethicsReviewerServiceRole
        case 'Meta_Reviewer_Role':
          return styles.metaReviewerServiceRole
        case 'Senior_Meta_Reviewer_Role':
          return styles.seniorMetaReviewerServiceRole
        case 'Ethics_Chair_Role':
          return styles.ethicsChairServiceRole
        case 'Program_Chair_Role':
          return styles.programChairServiceRole
        case 'Publication_Chair_Role':
          return styles.publicationChairServiceRole
        case 'Workflow_Chair_Role':
          return styles.workflowChairServiceRole
        default:
          return ''
      }
    }
    return ''
  }

  const handleTagClick = () => {
    if (tagLink) {
      window.open(tagLink, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip({ html: true })
  }, [tag])

  return (
    <div
      className={`${styles.profileTagContainer} ${getColorClass()} ${deletable ? styles.deletable : ''} ${tagLink ? styles.withTagLink : ''}`}
    >
      <span onClick={handleTagClick}>{getTagDispayText(tag, showProfileId)}</span>
      {isPrivateTag && (
        <div
          data-toggle="tooltip"
          data-placement="top"
          {...(isPrivateTag ? { title: `Visible to <br/> ${readers.join(',<br/>')}` } : {})}
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
