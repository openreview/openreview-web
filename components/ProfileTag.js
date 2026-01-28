/* globals $: false */
import { useEffect } from 'react'
import { getTagDispayText } from '../lib/utils'
import styles from '../styles/components/ProfileTag.module.scss'
import Icon from './Icon'
import { Space, Tag, Tooltip } from 'antd'
import { DeleteFilled, DeleteOutlined, EyeOutlined } from '@ant-design/icons'

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
    if (parentInvitations?.endsWith('_Role')) return styles.serviceRole
    return ''
  }

  return (
    <Tag
      color="red"
      variant="outlined"
      closable={
        onDelete && deletable
          ? {
              closeIcon: <DeleteOutlined />,
              'aria-label': 'Delete tag',
            }
          : false
      }
      onClose={onDelete}
    >
      <Space>
        <Tooltip title="Visible to everyone">
          <EyeOutlined />
        </Tooltip>
        {tagLink ? (
          <a
            href={tagLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'unset' }}
          >
            {getTagDispayText(tag, showProfileId)}
          </a>
        ) : (
          getTagDispayText(tag, showProfileId)
        )}
      </Space>
    </Tag>
  )

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
