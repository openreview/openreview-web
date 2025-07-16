'use client'

/* globals promptError: false */
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import ProfileTag from '../../components/ProfileTag'

export default function ProfileTags({ profileId, showProfileId }) {
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
    if (!profileId) return
    loadTags()
  }, [profileId])

  return (
    <div className={`tags-container ${tags.length ? 'mb-2' : ''}`}>
      {tags.map((tag, index) => (
        <ProfileTag
          key={index}
          tag={tag}
          onDelete={() => deleteTag(tag)}
          showProfileId={showProfileId}
        />
      ))}
    </div>
  )
}
