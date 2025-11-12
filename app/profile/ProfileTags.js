'use client'

/* globals promptError: false */
import { useEffect, useState } from 'react'
import { orderBy } from 'lodash'
import api from '../../lib/api-client'
import ProfileTag from '../../components/ProfileTag'

export default function ProfileTags({ profileId, showProfileId, isSuperUser }) {
  const [allTags, setAllTags] = useState([])
  const [tagsToShow, setTagsToShow] = useState(5)
  const visibleTags = allTags.slice(0, tagsToShow)

  const loadTags = async () => {
    try {
      const result = await api.get('/tags', {
        profile: profileId,
      })
      setAllTags(orderBy(result.tags, ['cdate'], ['desc']))
    } catch (error) {
      setAllTags([])
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
    <div className={`tags-container ${visibleTags.length ? 'mb-2' : ''}`}>
      {visibleTags.map((tag, index) => (
        <ProfileTag
          key={index}
          tag={tag}
          // onDelete={() => deleteTag(tag)}
          showProfileId={showProfileId}
        />
      ))}
      {allTags.length > 0 && tagsToShow < allTags.length && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          href="#"
          onClick={() => setTagsToShow(allTags.length)}
          role="button"
          className="mt-2"
        >
          View all {allTags.length} tags
        </a>
      )}
    </div>
  )
}
