'use client'

/* globals promptError: false */
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import CheckableTag from '../../components/CheckableTag'
import { prettyInvitationId, prettyId } from '../../lib/utils'

export default function ProfileTags({ profileId, isSuperUser }) {
  const [tags, setTags] = useState([])

  const loadTags = async () => {
    try {
      const result = await api.get('/tags', {
        profile: profileId,
      })
      setTags(result.tags)
    } catch (error) {
      setTags([])
    }
  }

  const deleteTag = async (tag) => {
    try {
      await api.post('/tags', {
        id: tag.id,
        ddate: Date.now(),
        profile: tag.profile,
        label: tag.label,
        signature: tag.signature,
        invitation: tag.invitation,
      })
      await loadTags()
    } catch (error) {
      promptError(error.message)
    }
  }
  useEffect(() => {
    if (!profileId || !isSuperUser) return
    loadTags()
  }, [profileId])

  if (!isSuperUser) return null

  return (
    <div className={`tags-container ${tags.length ? 'mb-2' : ''}`}>
      {tags.map((tag, index) => (
        <CheckableTag
          key={index}
          label={`${prettyInvitationId(tag.invitation)}${tag.label !== undefined ? ` "${tag.label}"` : ''}${tag.weight !== undefined ? ` (${tag.weight})` : ''}${!tag.invitation.startsWith(tag.signature) ? '' : ` by ${prettyId(tag.signature)}`}`}
          checked={true}
          onDelete={() => deleteTag(tag)}
        />
      ))}
    </div>
  )
}
